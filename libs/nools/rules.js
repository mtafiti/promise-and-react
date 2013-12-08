var nools = require("nools");

//listeners stored here
var subscribedListeners = [];

//fact templates are stored here..
var templates = {};

//default name for the flow
var defaultFlowName = "invokeFlow";

//holds the nowjs reference
var now;

//hashes for args - makes it easier, probably dont need them
var fntable = new predicates.FnTable();
var argstable = new predicates.ArgsTable();

//timeout to wait for response from nools(ms)
var TIMEOUT = 400;

//store rulenames to avoid duplication
var ruleNames = {};

// TODO: Problem with dispatch. The lambda to be called needs to be captured,
// either at the client or at the server.

var Invoked = function (fn, dev, args, time) {
    this.dev = dev;
    this.args = args || [];
    this.time = time;
    this.fn = fn;
};

//state fact templates
var StartDM = function (dev1, dev2, time) {
    this.dev1 = dev1;
    this.dev2 = dev2;
    this.time = time;
    //this.args = args;
};
var BodyDM = function (dev1, time) {
    this.dev1 = dev1;
    this.time = time;
    //this.args = args;
};
var EndDM = function (dev1, dev2, time) {
    this.dev1 = dev1;
    this.dev2 = dev2;
    this.time = time;
    //this.args = args;
};

//cb fact templates
var StartOper = function (args, time) {
    this.args = args;
    this.time = time || Date.now();
};
var BodyOper = function (args, time) {
    this.args = args;
    this.time = time || Date.now();

};
var EndOper = function (args, time) {
    this.args = args;
    this.time = time || Date.now();

};


var initialize = function (mynow) {
    now = mynow;
};

//this is how we should define our rules
var invokeFlow = nools.flow("mDraw Flow", function (flow) {

    var mouseDownRule = flow.rule("mouseDown", [
        [Invoked, "inv1", "inv1.function == 'mouseDown' " , {args: "args1", dev: "dev1", time: "time1"}],
        [Invoked, "inv2", "inv2.function == 'mouseDown' " , {args: "args2", dev: "dev2", time: "time2"}],
        ["not", "dev1 == dev2"],
        ["(time1 - time2) <= 1500"],
        ["not", StartDM, "start1", "start1.dev1 == dev1 && start1.time == time1"],
        ["not", Invoked , "inv3", "inv3.function == 'mouseUp' " , {args: "args3", dev: "dev3", time: "time3"}],
        ["not", " time2 < time3"]

    ], function (facts) {
        //this is called when the rule fires
        var inv1 = facts.inv1, inv2 = facts.inv2;
        var args1 = facts.args1, args2 = facts.args2;

        console.log("StartDM asserted.. ");
        //can have conditional insert..
        this.assert(new StartDM(inv1.dev, inv2.dev, inv2.time));
        this.assert(new StartOper(args1 + args2));

    });

    var mouseMoveRule = flow.rule("mouseMove", [
        [StartDM, "start1", "", {dev1: "dev1Start", dev2: "dev2Start", time: "timeStart"}],
        [Invoked, "inv1", "inv1.function == 'mouseMove' " , {args: "argsMove", dev: "devMove", time: "timeMove"}],
        ["not",
            ["or",
                [EndDM, "enddm1", "enddm1.dev1 == dev1Start && enddm2.dev2 == dev2Start && timeStart < timeMove "],
                [EndDM, "enddm2", "enddm2.dev1 == dev2Start && enddm2.dev2 == dev1Start && timeStart < timeMove "]
            ]
        ],
        ["or",
            ["devMove == dev1Start"],
            ["devMove == dev2Start"]
        ]

    ], function (facts) {

        var inv1 = facts.inv1;
        var args1 = facts.args1;

        this.assert(new BodyDM(inv1.dev, inv2.time));
        console.log("BodyDM asserted.. ");
        this.assert(new BodyOper(args1 + args2));
    });

    var mouseUpRule = flow.rule("mouseUp", [
        [StartDM, "start1", "", {dev1: "dev1Start", dev2: "dev2Start", time: "timeStart"}],
        [Invoked, "inv1", "inv1.function == 'mouseUp' " , {args: "argsUp", dev: "devUp", time: "timeUp"}],
        ["or",
            ["devMove == dev1Start"],
            ["devMove == dev2Start"]
        ],
        ["not",
            ["and",
                [EndDM, "end1", "", {dev1: "dev1End", dev2: "dev2End", time: "timeEnd"}],
                ["or",
                    ["dev1Start < dev1End"],
                    ["dev1Start == devEnd"]
                ]
            ],
            [EndDM, "enddm1", "enddm1.dev1 == dev1Start && enddm2.dev2 == dev2Start && timeStart < timeMove "],
            [EndDM, "enddm2", "enddm2.dev1 == dev2Start && enddm2.dev2 == dev1Start && timeStart < timeMove "]
        ]
    ], function (facts) {

        var inv1 = facts.inv1, inv2 = facts.inv2;
        var args1 = facts.args1, args2 = facts.args2;

        this.assert(new EndDM(inv1.dev, inv2.dev, inv2.time));
        console.log("EndDM asserted.. ");
        this.assert(new EndOper(args1 + args2));
    });

});

/**
 * function addRule: adds a rule into nools flow
 * @param ruleName
 * @param flowName
 * @param lhs - order of hash in Type is important!
 * @param cb
 * @returns boolean
 */
function addRule(ruleName, lhs, cb) {

    var flow = invokeFlow.getFlow(defaultFlowName);
    if (!flow) {
        console.log("Could not add rule. Flow not found: " + ruleName);
        return false;
    }

    //scan the lhs, replace type with new fn
    lhs = traverseArray(lhs);

    flow.rule(ruleName, lhs, function (facts) {
        //nools rule fired
        var listener = getListener(ruleName);
        if (listener) {
            listener.callback(facts);
        }
    });

    addListener(rulename, function (facts) {
        //assumes that in lhs has in1, inv2, arg1, arg2.. todo
        var arg1 = facts.inv1.args;
        var args = [];
        args.push(arg1);

        cb(args);
    });

    return true;
}

//asserts a fact
function assertFact(fact, cb) {
    var flow = invokeFlow.getFlow(flowName || deFaultFlowName);
    if (!flow) {
        console.log("Could not add fact. Flow not found: " + ruleName);
        cb(new Error('A problem occurred when adding fact'));
    }
    var flowSession = flow.getSession();
    var typefn = templates['' + fact.type];

    //get the object keys as array. implies order is important.
    var factarr = Object.keys(fact).map(function (key) {
        return fact[key];
    });

    //now we can assert
    flowSession.assert(typefn(factarr));

    //add to fact table
    var argkey = argstable.put(fact);
    //add cb to fn table, in case of composed evt
    fntable.put(argkey, cb);

    //now, use settimeout to call the fn if no response
    setTimeout((function (key) {
        var thekey = key;
        return function () {
            console.log("\nTimeout happened. calling normal fn....");
            //find fn callback from table
            var cb = fntable.get(thekey);
            //if no cb, it was removed, so do nothing
            if (!cb) {
                console.log("..normal fn not found for key: " + thekey);
                return;
            }
            //find and remove related args from table
            var args = argstable.get(thekey);
            //call the cb
            cb({isComposed: false, 'fnargs': args});
        }
    })(argkey), CB_TIMEOUT);

}

//helper functions
function addListener(event, callbk) {
    subscribedListeners.push({eventType: event, callback: callbk});
    console.info("subscribed for events from type " + event);
    //console.dir(subscribedListeners);
}
function removeListener(event) {
    subscribedListeners = subscribedListeners.filter(function (l) {
        return l.eventType !== event;
    });
    console.info("unsubscribed for events from type " + eventType);
}
function getListener(event) {
    for (var i = 0, l = subscribedListeners.length; i < l; i++) {
        var lstnr = subscribedListeners[i];
        if (lstnr.eventType === event) {
            return lstnr;
        }
    }
    return null;
}

//function createConstructorFunction
//  creates a 'newable' constructor that takes a hash and
// creates a new object with 'this' in the hash. order is important
function createConstructorFunction(hash) {
    var _hash = hash;

    var fn = function () {
        //need to create an object with this hash
        Object.keys(_hash).forEach(function (key, idx) {
            this['' + _hash[key]] = arguments[idx];
        }, this);
    };

    //add to templates array
    if (hash['type']) {
        templates['' + hash['type']] = fn;
    }

    return fn;
}

//goes through the lhs array and replaces any 'type' references with
// actual constructor functions
function traverseArray(arr) {
    if (Object.prototype.toString.call(arr) === '[object Array]') {
        arr = arr.map(function (val) {
            if (Object.prototype.toString.call(val) === '[object Array]') {
                traverseArray(arr);
            } else {
                if (val.type && val.type === 'facttype') {
                    //replace hash with constructor fn for type
                    val = createConstructorFunction(val);
                }
            }
            return val;
        });
    } else {
        if (arr.type && arr.type === 'facttype') {
            //replace hash with constructor fn for type
            arr = createConstructorFunction(arr);
        }
    }
    return arr;
}


exports.addRule = addRule;
exports.addFact = assertFact;
exports.initialize = initialize;
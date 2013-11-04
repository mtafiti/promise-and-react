var inbound = require('./inbound.js'),
    outbound = require('./outbound.js'),
    predicates = require('./predicates.js');

var HOST = '127.0.0.1', PORT = 4337, CB_TIMEOUT = 500;

var inname = 'my-in', outname = 'my-out';

//inbound and outbound connections
var inconn, outconn;

//the tables
var fntable = new predicates.FnTable();
var argstable = new predicates.ArgsTable();

var rulenames = {};

var proceedfntable = new predicates.FnTable();
var proceedargstable = new predicates.ArgsTable();

//nowjs for group invocations
var now;

function start(nowjs) {
    //connect inbound
    inbound.connect(HOST, PORT, inname, function () {
        //now that we have inbound, connect outbound
        outbound.connect(HOST, PORT, outname, function () {
            onConnect();
        });
    });
    now = nowjs;
}
//called after input connect is done
function onConnect() {

    //inbound.addCode(" ( deftemplate Cursor (slot id) ( slot x) ( slot y) (slot state) (slot clientId) ) ");
    //inbound.addCode(' ( defrule echoCursor ?cursor <- (Cursor (x ?x) (y ?y) (state ?st) (clientId ?cid)) => (printout t  "Cursor found at: " ?x ", " ?y " " ?st "  " ?cid crlf) )');

    inbound.addCode(' ( defrule echoInvokes (or (Invoked (dev ?d) (args ?a) (oid ?id) (fn "mouseUp")) (Invoked (dev ?d) (args ?a) (oid ?id) (fn "mouseDown"))  ) (Invoked (dev ?d) (args ?a) (oid ?id) (fn ?f) (time ?t))  => (printout t  "Invoked asserted: " ?f ". dev: " ?d ", args " ?a " iod " ?id ". at: " ?t crlf) )');

}
/**
 *    publish: Publish event to midas
 *    @param data:the object to publish.
 *                MUST contain a type field
 */
function publish(data) {
    //consider data.shpid later
    //console.log("Publishing to midas a fact: ");
    //console.dir(data);
    inbound.add(data);
    //{type: 'Cursor', x: data.x, y: data.y, state: data.state, clientId: data.clientId}
}
/*
 *	Subscribe to events from midas
 */
function subscribe(eventType, callback) {
    if (typeof callback !== 'function') {
        console.error("Error. Subscribe callback provided is not a valid function");
        return;
    }
    if (typeof eventType !== 'string') {
        console.error("Error. Event type to subscribe must be a string");
        return;
    }

    outbound.addListener(eventType, callback);
    //subscribe
    inbound.addCode('(subscribe "' + eventType + '" "' + outname + '" )');
}
function unsubscribe(eventType) {
    var listener = outbound.getListener(eventType);
    if (listener) {
        //unsubscribe
        inbound.addCode('(unsubscribe "' + listener.eventType + '" "' + listener.callback + '" )');
    }
}

/**
 *    function addSEXpression: Add some code to Midas
 *    @param str: the code(string) to execute
 */
function addSExpression(str) {
    inbound.addCode(str);
}
/** publishInvoke - register event to midas
 @param: data:
 @param clientId: the client id

 */
function publishInvoke(data, clientId, invokecb) {
    //add to table, get key.
    //console.log("data: ");
    //console.dir(data);
    var argkey = argstable.add({fn: data.fnname, oid: data.receiver, args: data.args, device: clientId});
    var proceedargkey = argstable.add({fn: data.fnname, oid: data.receiver, args: data.args, device: clientId});

    //console.log("just added: "+argkey);
    //console.dir(argstable[argkey]);

    //add the invoke callback in case of timeout
    fntable.put(argkey, invokecb);
    proceedfntable.put(argkey, invokecb);
    //send to midas
    publish({type: 'Invoked', fn: data.fnname, args: argkey, oid: data.receiver, dev: clientId, x: data.args.x, y: data.args.y});
    //now, use settimeout to call the fn if no response from midas
    setTimeout((function (key) {
        var thekey = key;
        return function () {
            //console.log("\nTimeout happened. calling normal fn....");
            //find fn callback from table
            var cb = fntable.get(thekey);
            //if no cb, it was removed, so do nothing
            if (!cb) {
                //console.log("..normal fn not found for key: "+thekey);
                return;
            }
            //find and remove relatedargs from table
            var args = argstable.get(thekey);
            //call the cb
            //console.log("...called normal fn. ");
            cb({isComposed: false, 'fnargs': args});
        }
    })(argkey), CB_TIMEOUT);
}
/** publishNewRule - send rule to midas
 @param: rulename: the name of the sequence
 @param: rule:    the rule
 @param: seqcb:    the sequence callback
 */
function publishNewRule(rulename, rule, returnfn) {
    //make the predicates first
    var preds, i, l, inv, pred, seq;
    if (!rulename || rulename.length === 0)
        return;

    //check if we already registered this rule
    if (rulenames[rulename])
        return;
    //if not we add it to hash
    rulenames[rulename] = rule;

    //format the rule a bit. returns template and rule
    var ruleobj = formatRule(rulename, rule);

    var cb = function (data) {
        console.log("node: combined evt called.. now lets get args from table and call cb");

        var clientCallbacks = [];

        var collabargs = [];

        if (data.args) {        //todo: if no args?
            data.args.forEach(function (argkey) {

                //remove client callback - update: uses groups with now
                var clientcb = fntable.get(argkey);

                //remove args
                var cbargs = argstable.get(argkey);

                //add to cbs to call - update: uses groups with now
                //clientCallbacks.push({callback: clientcb, args: cbargs});

                //call it but dismiss - update: do we need this?
                //if (typeof clientcb === 'function')
                //	clientcb.call(null, {isComposed: true, msg: 'Function call ignored'});   //args??

                collabargs.push(cbargs);

            });
        }

        //now call all fns in the clients - update: use nowjs for group
        /*clientCallbacks.forEach(function(value){
         if (value.callback){
         value.callback.call(null, {isComposed: true , 'fnargs': value.args});
         console.log("node: composed event called. args:  ");
         console.dir(value.args);
         } else {
         console.log("node: Callback undefined for composed event. Dump of args:  ");
         console.dir(value);
         }

         });
         */

        //get the clients group, then invoke the fn on the group
        var collabFn = now.everyone.now[data.type];
        if (collabFn) {
            console.log("..cb called on clients. args:");
            console.dir(collabargs);
            collabFn(collabargs);
        }

    };

    //subscribe to this sequence once it is asserted
    subscribe(rulename, cb);

    console.log("node: registering rule to midas.. \n");
    console.dir(ruleobj);

    //first send template
    addSExpression(ruleobj.template);
    //then send the rule
    addSExpression(ruleobj.rule);

    //call the fn back since the rule registration was successful
    returnfn();
}

/**
 *    function formatRule: formats the rule from the device
 *  @param rule - the rule to format
 *    @returns an obj with the template and the rule string
 */
function formatRule(rulename, rule) {
    var wholerule = '';

    var deftemplate = '(deftemplate ' + rulename + ' (multislot args)) ';     //multislot requires 2 args or more to trigger a response.
    var defrule = '(defrule rule-' + rulename + ' ';

    wholerule += defrule;
    //assert with rulename e.g. endrule, startrule, bodyrule
    rule = rule.replace('(call', '(printout t " callback' + rulename + '" crlf) (assert (' + rulename + ' ');
    rule = rule.replace(/function/g, 'fn');

    wholerule += rule += ' ) )';

    return {template: deftemplate, rule: wholerule};
}
//exports
exports.start = start;
exports.publish = publish;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.addSExpression = addSExpression;
exports.publishNewRule = publishNewRule;
exports.publishInvoke = publishInvoke;//
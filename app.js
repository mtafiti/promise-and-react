/**
 * Requires.
 */
var express = require('express')
    , routes = require('./routes')
    , ajax = require('./routes/ajax')
    , http = require('http')
    , utils = require('./libs/utilities-server.js')
    , path = require('path')
    , midas = require('./libs/midasbridge/midas.js')
    , nools = require('./libs/nools/rules.js');


var app = express();


//global hash table
distInteractions = utils.mapBehaviour.call({});

// all environments
app.set('port', process.env.PORT || 8000);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(express.cookieParser('yoursecrethere'));
app.use(express.session());

app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.engine('.html', require('jade').renderFile);

app.get('/', routes.index);

//custom routes
app.get('/draw', function (req, res) {
    if (req.param("room") === "new") {
        // mynow.addRoom(req.param("rname"));  disable for demo
    }
    routes.draw(req, res);
});
app.get('/ajax', function (req, res) {
    ajax.ajax_get(req, res, mynow);
});
app.post('/ajax', function (req, res) {
    ajax.ajax_post(req, res, mynow);
});

app.use(express.static(path.join(__dirname, 'public')));

server = http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

var mynow = require("./libs/groups").initialize(server);

//init nools rule engine
nools.initialize(mynow);

//midas.start(mynow);

//log a message on client. mainly for test purposes.
mynow.everyone.now.logMessage = function (msg) {
    console.log("Message from client: " + msg);
};

//log of room structure to client
mynow.everyone.now.logRooms = function () {
    console.log("The room structure: ");
    console.dir(mynow.getAllRooms());
};

//test. to remove
mynow.everyone.now.testFunc = function (msg, cb) {
    // this.now.doSomething();
    console.log("Test message from " + this.user.clientId);
    cb("Server responds with hi!")
};

//test function - to remove
mynow.everyone.now.testpromise = function (cb) {
    // this.now.doSomething();
    console.log("testPromiseSever called. ");
    cb("This message is from server. Count is " + count);
    count++;
};

//load all rooms on server to client
mynow.everyone.now.loadRooms = function (cb) {
    cb(null, mynow.getAllRooms());
};

//distribute a text (chat) message
mynow.everyone.now.sendChatToAll = function (message, cb) {
    mynow.everyone.now.receiveMessage(this.now.name, message);
    cb(null, true);
};

/**
 * deprecated. use joinavaliable room
 * @param name
 * @param rm
 * @param cb
 */
mynow.everyone.now.addClientToGroup = function (name, rm, cb) {

    var res = mynow.addUser({id: this.user.clientId, 'name': name}, rm);
    if (res) cb(this.user.clientId, "Added successfully");
    else {
        cb("Unable to add the user. ", null)
        console.log("unable to add user " + name);
    }
};

//register user to room
mynow.everyone.now.joinAvailableRoom = function (name, rm, cb) {
    var res = mynow.addUser({id: this.user.clientId, 'name': name}, rm);
    //if (res) cb(null, this.user.cookie["connect.sid"]);
    if (res) {
        cb(this.user.clientId);
        //also notify others in the room
    }
    else {
        cb("Unable to add the user. ")
        console.log("Error: unable to add user " + name);
    }
};

//broadcast data
mynow.everyone.now.distributeData = function (data) {
    //send to everyone, with the client's session id
    mynow.everyone.now.receiveData(this.user.clientId, data);
};

/*
 mynow.everyone.now.clientEvent = function (fn, params, info, cb) {
    //var userId = this.user.cookie["connect.sid"];
    var userId = this.user.clientId;
    midas.publishInvoke(info, userId, function (args) {
        //return the result to client
        cb(args);
    });
 };
 */
mynow.everyone.now.clientEvent = function (fact, cb) {

    nools.addFact(fact, function (args) {
        cb("Added fact " + fact.type);
    });

};

//mouse up operation. can end a collaborative drag.
mynow.everyone.now.clientEndDrag = function (shape, cb) {

    //at this point midas has identified a composed event
    var userId = this.user.clientId;
    //get room name, then send to ppl in room
    var usersRoom = mynow.everyone.now.getRoomForUser(userId);

    //append correct rule to invokes
    invokes.forEach(function (val) {
        val.rulename = rulename;
        console.log("invokes rule:");
        console.dir(val);
    });

    //now send to devices in room
    var theGroup = mynow.getGroup(usersRoom.name);
    theGroup.composedEvent(invokes); //todo: add

    console.log("Sequence callback called. in room " + usersRoom.name + ". data: ");
    console.dir(invokes);

    //todo:
    // cb();
};

mynow.everyone.now.createRule = function (rulename, rule, returnfn) {
    //var userId = this.user.cookie["connect.sid"];
    var userId = this.user.clientId;

    midas.publishNewRule(rulename, rule, function (invokes) {


    });

    //finished registering sequence
    returnfn({msg: 'Created rule successfully'});  //todo: check params

};


//init rooms - for demo
mynow.addRoom("mingoroom");
mynow.addRoom("testroom");
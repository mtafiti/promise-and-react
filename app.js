/**
 * Requires.
 */
require('./libs/flapjax-2.1.js');

var express = require('express')
    , routes = require('./routes')
    , ajax = require('./routes/ajax')
    , http = require('http')
    , utils = require('./libs/utilities-server.js')
    , path = require('path');

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
mynow.everyone.now.testFunc = function () {
    // this.now.doSomething();
    console.log("Test message from " + this.user.clientId);
};

//test. to remove
var testcount = 0;
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
    if (res) cb(this.user.cookie["connect.sid"], "Added successfully");
    else {
        cb("Unable to add the user. ", null)
        console.log("unable to add user " + name);
    }
};

//register user to room
mynow.everyone.now.joinAvailableRoom = function (name, rm, cb) {
    var res = mynow.addUser({id: this.user.clientId, 'name': name}, rm);
    if (res) cb(null, this.user.cookie["connect.sid"]);
    else {
        cb("Added successfully", "Unable to add the user. ")
        console.log("Error: unable to add user " + name);
    }
};

//broadcast data
mynow.everyone.now.distributeData = function (data) {
    //send to everyone, with the client's session id
    mynow.everyone.now.receiveData(this.user.cookie["connect.sid"], data);
};

//drag operation started. can be collaborative.
mynow.everyone.now.registerDrag = function (shpid, info, cb) {

    if (distInteractions.isEmpty() || distInteractions.hasOnly(this.user.cookie["connect.sid"])) {
        //create event stream
        var reqE = receiverE();

        //debugging
        //console.log('adding event stream for shape: ' + shpid + ' and user: ' + this.user.clientId);
        var data = {args: info, stream: reqE, item: shpid};

        distInteractions.add(this.user.cookie["connect.sid"], data);

        reqE.mapE(function (val) {
            cb(val);
        });

        //send event the first time
        reqE.sendEvent({isComposed: false, args: info});

    } else {
        //first gather all args to send to all clients
        var allargs = [];

        //get this user's event stream
        var userData = distInteractions.get(this.user.cookie["connect.sid"]);
        var userStream;
        //if the user exists in hash, use his event stream
        if (userData) {
            userStream = userData.stream;
        } else {
            //if not, new drag user, create one for him
            userStream = receiverE();
            userStream.mapE(function (val) {
                cb(val);
            });
        }

        var hashData = {args: info, stream: userStream, item: shpid};

        //add new data for my drag in the dictionary
        //console.log('adding event data for shape: ' + shpid + ' and user: ' + this.user.clientId);
        distInteractions.add(this.user.cookie["connect.sid"], hashData);

        //check if on same shape
        if (distInteractions.usersOnSameShape(shpid)) {

            //faster to use Object.keys? See
            //http://jsperf.com/keys-vs-array
            distInteractions.forEach(function (key, val) {
                //push the args into array
                allargs.push({client: key, args: val.args});
            });
            //then send to each stream
            distInteractions.forEach(function (key, value) {
                //send with all args
                if (value.stream) {
                    value.stream.sendEvent({isComposed: true, args: allargs});
                }
            });
            console.log("Sent collab drag to all contestants.. args: ");
            console.dir(allargs);

        } else {
            //then send to each stream  SHOULD UPDATE ONLY YOURS
            distInteractions.forEach(function (key, value) {
                //send with all args
                if (value.stream) {
                    value.stream.sendEvent({isComposed: false, args: value.args});
                }
            });
        }
    }
};


mynow.everyone.now.registerEndDrag = function (shape, cb) {
    var userId = this.user.cookie["connect.sid"];
    //get the stream and disable it
    var entry = distInteractions.get(userId);
    if (entry) entry.stream = null;   //could set it to zeroE also
    //remove from dictionary
    distInteractions.remove(userId);

    console.log("...ended drag operation by client " + this.user.cookie["connect.sid"]);
    cb();
};

//init rooms - for demo
mynow.addRoom("dylaroom");
mynow.addRoom("testroom");
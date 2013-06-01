
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , ajax = require('./routes/ajax')
  , http = require('http')
  , path = require('path');

var app = express();

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
app.get('/draw', function(req,res){
    if (req.param("room") === "new"){
        mynow.addRoom(req.param("rname"));
    }
    routes.draw(req,res);
});
app.get('/ajax', function(req,res){
    ajax.ajax_get(req,res,mynow);
});
app.post('/ajax', function(req,res){
    ajax.ajax_post(req,res,mynow);
});

app.use(express.static(path.join(__dirname, 'public')));

server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var mynow = require("./libs/groups").initialize(server);

//add now to ajax
//mynow = ajax.initialize(mynow);

mynow.everyone.now.logMessage = function(msg){
   console.log("Message from client: "+msg);
};

mynow.everyone.now.logRooms = function(){
   console.log("The room structure: ");
   console.dir(mynow.getAllRooms());
};

mynow.everyone.now.loadRooms = function(cb){
    cb(null,mynow.getAllRooms());
};

mynow.everyone.now.distributeMessage = function(message){
    everyone.now.receiveMessage(this.now.name, message);
};

mynow.everyone.now.testFunc = function(){
    // this.now.doSomething();
    console.log("Test message from "+this.user.clientId);
};

mynow.everyone.now.addClientToGroup = function(name,rm,cb){
    var res = mynow.addUser({id: this.user.clientId, 'name':name} , rm);
    if (res) cb(this.user.clientId,"Added successfully");
};

mynow.everyone.now.distributeData = function(data){
    //filter this client
    mynow.everyone.now.receiveData(this.user.clientId, data);
};

mynow.everyone.now.registerDrag = function(shpid, info, cb){
    var reqE;

}
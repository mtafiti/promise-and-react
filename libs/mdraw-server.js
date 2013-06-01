
var utilities = require('./libs/utilities-server');

// holds all our boxes
var allshapes;



// shape object to hold data
function SelHandle(x,y,w,h) {
    this.x = x||0;
    this.y = y||0;
    this.w = 1; // default width and height?
    this.h = 1;
    this.selected = false;
    this.fill = '#444444';
    this.strokecolor = '#444444';
}

// shape object to hold data
function ShapeObj(x,y,w,h) {
    this.x = x||0;
    this.y = y||0;
    this.w = w||1;
    this.h = h||1;
    this.selected = false;
    this.fill = '#444444';
    this.strokecolor = '#0A0A0A';
    this.strokewidth = 2;
    this.angle = 0;

    this.type = 'rect';

    //unique id toso: shldnt be like this
    this.shpid = utilities.generateRandomID('SHP-');

    //grp id
    this.grpid = '';
    //selection handles for each shape
    this.selectionhandles = new Array();

    for (var i = 0; i < 8; i ++) {
        var rect = new SelHandle();
        this.selectionhandles.push(rect);
    }

}

var initialize = function(){

     allshapes = [];
};

/*

//------- from paper -------------

dictInteractions = {};

function mouseDownAndMoveE (canvas) {
    return extractEventE(canvas,"mousedown")
        .mapE(function(md) {

            return extractEventE(canvas,"mousemove")
                .mapE(function(mm) {
                    now.registerDrag(shapeid, shapeinfo, function(){
                        //update shape on canvas
                    });
                });
        })
}


/**
 * Create a stream that receives operations. Arguments
 * passed to this operation will be bound to the given parameters
 * in an object passed as event to the stream.
 *
 * @param operation The operation clients calls to trigger an event.
 * @param ... Strings for the parameters this request has.
 */
/*
my.receiveE = function (operation) {
    // create the receiving stream for requests of type operation
    var recE = receiverE();

    // Fix the indexes -> lower by one for faster runtime mapping
    // The arguments object maps indices as strings to values.
    // Alternative: use explicit array as argument list on call&definition.
    var params = {};
    for(var idx_s in arguments) {
        idx = parseInt(idx_s);
        if(idx > 0) // skip the first index, which is the operation
            params[(idx-1).toString()] = arguments[idx_s];
    }

    // bind the operation to a function sending events
    everyone.now[operation] = function() {
        var request = {
            user:this.user,
            client:this.now,
            body:{}
        };
        for(var idx in arguments) {
            request.body[params[idx]] = arguments[idx];
        }
        recE.sendEvent(request);
    };
    return recE;
};
*/
/**
 * Requests can be sent to the server, resulting in an event.
 * We wrap this in a receiverE event stream and send requests as
 * events to this stream.
 * @param method get,post,delete,... (see express app API)
 * @param url /path/to/resource
 * @return the receiving stream for requests on METHOD url.
 */
 /*
exports.requestE = function (shpid,shpinfo,cb) {

    //return to client
    cb(reqE);
    //save in table
    return reqE;
};

everyone.now.registerDrag = function (shpid, info, cb) {
var reqE;
if (!distInteractions.contains(this.user.id)){
reqE = receiverE();
distInteractions.add(this.user.id, reqE);
reqE.mapE(function(val){
   cb(val);
});
//call it the first time
reqE.sendEvent(info)
} else {
reqE = distInteractions.get(this.user.id)
}
reqE.sendEvent(info);
}
*/

exports.initialize = initialize;
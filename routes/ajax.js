//var utilities = require('utilities');

exports.initialize = function (mynow) {
    console.log("initializing mynow in ajax...");
    //myajaxnow = mynow;
    //return myajaxnow;
};

exports.ajax_post = function (request, response, myajaxnow) {

//clean get request
    var pathname = request.url;
    var content = '';
    console.log("post was called with params " + request.params);


    if (request.params["savesession"]) {
        //add data to rooms object
        myajaxnow.saveData(postparams.data);
        content = JSON.stringify({success: true, msg: 'Session saved successfully'});
    } else if (request.params["loadsession"]) {
        //get room session
        var data = myajaxnow.getData(postparams.rname);
        content = JSON.stringify({data: data, success: true});
    }

    response.json({"rooms": content}, 200);
};

/**
 * Soon to be deprecated
 * @param request
 * @param response
 * @param myajaxnow
 */
exports.ajax_get = function (request, response, myajaxnow) {
    //clean get request
    var pathname = request.url;
    var content = '';

    //GET Ajax request
    if (pathname.indexOf('?') !== -1) {
        pathname = pathname.substring(pathname.indexOf('?') + 1, pathname.length);
    }
    console.log("Request handler 'ajax' was called. pathname:" + pathname);

    if (request.param("request") === "loadrooms") {
        var rms = myajaxnow.getAllRoomnames();
        content = JSON.stringify({success: true, rooms: rms});
    }
    //respond
    response.json({"rooms": content}, 200);
};
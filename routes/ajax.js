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
    //console.log("post was called with params "+ request.params);


    if (request.param("request") === "savesession") {
        //add data to rooms object
        myajaxnow.saveData(request.param("data") || "", request.param("rname"));
        content = JSON.stringify({success: true, msg: 'Session saved successfully'});
    } else if (request.param("request") === "loadsession") {
        //get room session
        var data = myajaxnow.getData(request.param("rname"));
        content = JSON.stringify({data: data, success: true});
    }

    response.json({"rooms": content}, 200);
};

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
    response.json({"rooms": content}, 200);
};
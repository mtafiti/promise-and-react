/**
 * Created with JetBrains WebStorm.
 * User: ken
 * Date: 12/04/13
 * Time: 12:25
 * Copyright 2013
 */

exports.requestE = function (app,method,url) {
    var reqE = receiverE();

    if(!method in app) {
        throw "No such method:"+method;
    }

    app[method](
        url,
        function (req,res) {
            reqE.sendEvent({req:req,res:res});
        }
    );

    return reqE;
};

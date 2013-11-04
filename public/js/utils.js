//decode get request var
function getQueryString(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

function getFunctionParams(fn) {
    var reg = /\(([\s\S]*?)\)/;
    var params = reg.exec(fn);
    if (params)
        return params[1].trim().split(',').map(function (val) {
            return val.trim();
        });
    else
        return [];
}

function uncircularizeEvt(e) {
    var eventOptions = {};
    if (e) {
        eventOptions = {
            __isEventObj: true, //mingo-specific
            pointerX: e.pointerX,
            pointerY: e.pointerY,
            pageX: e.pageX,
            pageY: e.pageY,
            screenX: e.screenX,
            screenY: e.screenY,
            button: e.button,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            bubbles: e.bubbles,
            cancelable: e.cancelable
        };
    }
    return eventOptions;
}

/**
 * function isEvent: serializing mouse event object in javascript is a pain,
 * so use this function to check an intercepted argument is an event. if so, strip it down
 * see: http://stackoverflow.com/questions/1458894/how-to-determine-if-javascript-object-is-an-event
 * to its essentials before sending to the leader
 */
function isEvent(a) {
    var txt, es = false;
    txt = Object.prototype.toString.call(a).split('').reverse().join('');
    es = ((txt.indexOf("]tnevE") == 0) || a.__isEventObj) ? true : false; // Firefox, Opera, Safari, Chrome
    if (!es) {
        txt = a.constructor.toString().split('').reverse().join('');
        es = (txt.indexOf("]tnevE") == 0) ? true : false; // MSIE
    }
    return es;
}

//see: http://bit.ly/15VWqHD
function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

//http://bit.ly/18U9sro
function arrayUnique(arr) {
    var i,
        len = arr.length,
        out = [],
        obj = {};

    for (i = 0; i < len; i++) {
        obj[arr[i]] = 0;
    }
    for (i in obj) {
        out.push(i);
    }
    return out;
}

if (!String.prototype.trim)
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };

if (!Object.extend) {
    Object.extend = function (destination, source) {
        for (var k in source) {
            if (source.hasOwnProperty(k)) {
                destination[k] = source[k];
            }
        }
        return destination;
    }
}
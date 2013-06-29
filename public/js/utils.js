//decode get request var
function getQueryString(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

function getFunctionParams(fn) {
    var reg = /\(([\s\S]*?)\)/;
    var params = reg.exec(fn);
    if (params)
        return params[1].split(',');
    else
        return [];
}

function uncircularizeEvt(e) {
    var eventOptions = {};
    if (e) {
        eventOptions = {
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
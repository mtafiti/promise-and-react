//hold client's sessionid
var sessionId;

function remoteCall(url, args, responseCallback) {
    http = new XMLHttpRequest();
    http.open("GET", url + "?" + args, true);
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            if (http.status === 200) {
                var response = JSON.parse(http.responseText);
                responseCallback(response);
            } else {
                console.log("Error", http.statusText);
            }

        }
    };
    http.send(null);
};

function loadRooms() {
    //remote call for rooms
    remoteCall("ajax", "request=loadrooms", function (reply) {
        var dd = document.getElementById('room');
        var obj = JSON.parse(reply.rooms);
        if (!obj.success)
            return;
        obj.rooms.map(function (val) {
            dd.add(new Option(val, val), null);
        });

    });
}

function loadRoomsP() {

    //p1 = fnpromise("ready");
    p2 = fnpromise("loadRooms");
    p3 = fnpromise("joinAvailableRoom");
    p4 = fnpromise("sendChatToAll");

    p2().then(function (rooms) {
        //promise for dropdown select
        var deferred = Q.defer();

        var roomsarr = Object.keys(rooms);
        if (rooms) {
            var dd = document.getElementById('room');
            console.log("load rooms finished");
            var roomsarr = Object.keys(rooms);
            roomsarr.map(function (val) {
                dd.add(new Option(val, val), null);
            });
            //add evt to show before submit
            var form = document.getElementById('myform');
            //enable start button
            document.getElementById('start-div').style.display = "block";

            form.onsubmit = function (evt) {
                if (dd.value !== "-1") deferred.resolve(dd.value);
                evt.preventDefault();
            };
        } else {
            deferred.reject("No rooms found");
        }

        return deferred.promise;
    })
        .then(function (rname) {
            console.log("form submit...");
            var nickname = document.getElementById('nick').value
            return p3(nickname, rname);
        })
        .then(function (sesid) {
            debugger;
            console.log("Added to users list on server." + sesid);
            var nickname = document.getElementById('nick').value;

            //set clientID
            sessionId = sesid;
            return p4("Hi everyone! I have joined the session! My name is " + nickname);
        },function err(msg) {
            debugger;
            console.error(msg);
        }
    ).then(function (res) {
            debugger;
            if (res) {
                alert("Joined drawing session successfully. ");
                document.getElementById('sessionid').value = sessionId;

                var form = document.getElementById('myform');
                form.submit();
            }
        })
        .done(); //.then...

    //show dd
    document.getElementById('roomname-dd').style.display = "block";

    document.getElementById('join-div').style.display = "none";
}

/**
 * Deprecated
 * @param val
 */
function selectRoom(val) {
    if (val === 'new') {
        document.getElementById('roomname-div').style.display = "block";
        document.getElementById('rname').value = "";
    } else {
        document.getElementById('roomname-div').style.display = "none";
        document.getElementById('rname').value = document.getElementById('room').value;
    }
}


function init() {

    //hide the dropdown until user clicks join
    document.getElementById('roomname-div').style.display = "none";
    document.getElementById('roomname-dd').style.display = "none";
    document.getElementById('start-div').style.display = "none";

    //set click event
    document.getElementById('join').onclick = function (evt) {
        var username = document.getElementById('nick').value;
        if (username) {
            loadRoomsP();
        }
    }
}
//todo: investigate appending 2 cbs problem
/** give now callback string, returns promise that invokes remote now server
 *
 * @param fn  the nowjs fn name as string
 * @returns {Function} that calls nowjs fn on server
 */
function fnpromise(fn) {
    return function () {
        var deferred = Q.defer();
        func = now[fn];

        func.apply(this, Array.prototype.slice.call(arguments).concat(cb));
        function cb(err, value) {
            if (err == null) {
                deferred.resolve((arguments.length > 2) ?
                    Array.prototype.slice.call(arguments, 1) :
                    value);
            } else {
                deferred.reject(new Error(err));
            }
        }

        return deferred.promise;
    }
}



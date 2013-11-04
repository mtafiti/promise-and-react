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

//where all the session logic magic happens...
function loadRoomsP() {

    //p1 = fnpromise("ready");
    p2 = fnpromise("loadRooms");
    p3 = fnpromise("joinAvailableRoom");
    p4 = fnpromise("sendChatToAll");

    p2().then(function (rooms) {
        //promise for dropdown select
        var deferred = Q.defer();


        return deferred.promise;
    })
        .then(function (rname) {
            //console.log("form submit...");
            var nickname = document.getElementById('nick').value
            return p3(nickname, rname);
        })
        .then(function (sesid) {
            console.log("Added to users list on server." + sesid);
            var nickname = document.getElementById('nick').value;

            //set sessinID
            sessionId = sesid;
            return p4("Hi everyone! I have joined the session! My name is " + nickname);
        }).then(function (res) {
            if (res) {
                alert("Joined drawing session successfully. ");
                document.getElementById('sessionid').value = sessionId;

                var form = document.getElementById('myform');
                form.submit();
            }
        }, function err(msg) {
            console.error(msg);
        })
        .done(); //.then...

    //show dd
    document.getElementById('roomname-dd').style.display = "block";
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
    //document.getElementById('roomname-div').style.display = "none";
    //document.getElementById('roomname-dd').style.display = "none";
    //document.getElementById('start-div').style.display = "none";

    //set click event
    var username = document.getElementById('nick').value;

    //message
    now.receiveMessage = function (name, msg) {
        console.log("Message from participant: " + msg);
    };
    now.ready(function () {
        now.loadRooms(function (result, rooms) {
            if (rooms) {
                var dd = document.getElementById('room');
                console.log("load rooms finished");
                var roomsarr = Object.keys(rooms);
                roomsarr.map(function (val) {
                    dd.add(new Option(val, val), null);
                });
                //add evt to show before submit
                var form = document.getElementById('myform');

                form.onsubmit = function (evt) {
                    if (dd.value === "-1")
                        evt.preventDefault();
                };
            } else {
                console.log("No rooms found");
            }

        });
        document.getElementById('roomname-div').style.display = "none";
    });

}

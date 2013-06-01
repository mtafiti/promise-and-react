/**
 * Created with JetBrains WebStorm.
 * User: Kennedy Kambona
 * Date: 23/04/13
 * Time: 11:48
 * Copyright Software Languages Lab 2013.
 * MIT License.
 *  */
var mynow = require("now");

exports.initialize = function(server){
    var rooms = [];

    //nowjs
    mynow.everyone = mynow.initialize(server);

    //create rooms
    mynow.nowjs = mynow;

    mynow.getAllRooms = function(){
        return mynow.serverRooms;
    };
    mynow.getAllRoomnames = function(){
        var names = [];
        Object.keys(mynow.serverRooms).forEach(function(key) {
            //var val = o[key];
            names.push(key);
        });
        return names;
    };
    mynow.roomExists = function(roomname){
        return mynow.serverRooms[roomname] != null;
    };
    mynow.getRoom = function(roomname){
        if (mynow.roomExists(roomname)){
           return mynow.serverRooms[roomname];
        }
        else
            return null;
    };

    //add a new room, with check
    mynow.addRoom = function(roomname){
       if (!mynow.roomExists(roomname)){
           console.log("Adding new room: "+ roomname);
           //add to nowjs group
           grp = mynow.nowjs.getGroup(roomname);
           //add to own data structure
           mynow.serverRooms[""+roomname] = {name: roomname, users: {}, data: ''};
           return true;
       } else
       return false;
    };

    //add users. note users are dictionaries
    mynow.addUser = function(newuser, roomname){
       var theRoom = mynow.getRoom(roomname);
       if (theRoom){
           grp = mynow.getGroup(roomname);

           grp.addUser(newuser.id);

           theRoom.users[""+newuser.name] =  newuser.id;
           return theRoom.users;
         }
    };
    //todo: remove user by client id
    mynow.removeUser = function(userid, roomname){
        var theRoom = mynow.getRoom(roomname);
        if (theRoom){
            grp = mynow.getGroup(roomname);

            grp.removeUser(newuser);

            delete theRoom.users[userid];
        }
    };

    mynow.saveData = function(data, roomname){
        var theRoom = mynow.getRoom(roomname);
        theRoom.data = data;
        //optional message to group
        var grp = mynow.getGroup(roomname);
        grp.now.receiveMessage("Data for room saved on server");

        //logging
        console.dir(mynow.serverRooms);
        return true;
    };

    mynow.getData = function(roomname){
        var theRoom = mynow.getRoom(roomname);
        console.log("Retrieved data for "+ roomname);
        return theRoom.data ;
    };
    mynow.serverRooms = {};

    return mynow;

};

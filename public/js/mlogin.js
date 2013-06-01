
function remoteCall(url, args, responseCallback) {
	http = new XMLHttpRequest();
	http.open("GET", url + "?" + args, true);
	http.onreadystatechange = function() {
		if (http.readyState === 4) {
			 if (http.status === 200) {  
				var response = JSON.parse(http.responseText);
				responseCallback(response);  
			} else {  
			  console.log("Error", http.statusText);  
			} 
			
		};
	};
	http.send(null);
};

//remote call for rooms
remoteCall("ajax","request=loadrooms",function (reply) { 
	var dd = document.getElementById('room');
    var obj = JSON.parse(reply.rooms);
    if (!obj.success)
		return;
	obj.rooms.map(function(val){
		dd.add(new Option(val, val),null);
	});

 });

function loadRooms(){
    promise = //...
    now.addClientToGroup(nickname,rname,function(id,res){
        console.log("Added to users list on server."+ id);
        //set clientID
        clientId = id;
        promise.resolve(res)
    });
    return promise
}
/*
function err(msg){ console.log("Error: " + msg)}

p1 =  promisify(now.loadRooms);
p2 = promisify(now.addClientToGroup);
p1(nickname,rname)
  .then(function(res){
     return p2(res);
  },err)
  .then(function(res){
     console.log(res.msg)
  },err)
  .done();
  */
 function selectRoom(val){
	if (val === 'new'){		
		document.getElementById('roomname-div').style.display = "block";
		document.getElementById('rname').value = "";
	}else{
		document.getElementById('roomname-div').style.display = "none";
		document.getElementById('rname').value = document.getElementById('room').value;
	}
 }
var http = require('http');
var fs = require('fs');

// app.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/public/index.html');
});

server.listen(8080);  

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
      
// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  res.send('hello world');
});
app.use(express.static('public'));
// var server = http.createServer(function(req, res) {
    // fs.readFile('./index.html', 'utf-8', function(error, content) {
        // res.writeHead(200, {"Content-Type": "text/html"});
        // res.end(content);
    // });
// });

// FAST

var tableID = 0;
var tableSocket;

var players = [];
var playerIndex=0;
var colors = [{color:"#f4f142",text:"jaune"},
{color:"#4286f4",text:"bleu"},
{color:"#edb11a",text:"orange"},
{color:"#8317c1",text:"violet"}];

// Chargement de socket.io
//var io = require('socket.io').listen(server);
// io.use(ios(session));
var p2p = require('socket.io-p2p-server').Server;
io.use(p2p);

var clients = [];
var portFast = 1000;

function getIp(socket){
	var address = socket.handshake.address;
	return address.address;
}

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    console.log('Un client est connecté !');


	// Exemple Chat protocol
	socket.on('message', function (message) {
		var mess = {'pseudo':socket.pseudo,'message':message}
        console.log('brodcasting message'+socket.pseudo + ' : ' + message);
		if(message=="FAST")
		{
			console.log("sending fast");
			socket.broadcast.emit('FAST_PRIVATE_MINI_GAME_START',{});
		}
		socket.broadcast.emit('message', mess);
    });

	socket.on('login', function (pseudi){
		console.log('Login '+pseudi);
        socket.pseudo = pseudi;
		clients[pseudi] = socket;
		socket.emit('portFast',portFast++);
		socket.emit('loginCallback',portFast++);


		socket.broadcast.emit('clientConnect', pseudi);
		console.log('login of'+socket.pseudo);
    });

	socket.on('login', function (pseudi){
		console.log('Login '+pseudi);
        socket.pseudo = pseudi;
		clients[pseudi] = socket;
		socket.emit('portFast',portFast++);
		socket.emit('loginCallback',portFast++);


		socket.broadcast.emit('clientConnect', pseudi);
		console.log('login of'+socket.pseudo);
    });
	
	function disconnectClient(pseudo){
		socket.broadcast.emit('clientDisconnect', socket.pseudo);
		clients[socket.pseudo]=null;
        socket.pseudo = null;
	}

	socket.on('unlogin', function (message) {
		console.log('Unlogin '+ socket.pseudo + ' ;mess ' + message);
		disconnectClient(socket.pseudo);
    });


        socket.on('FAST_EVENT_BROADCAST', function(data){
            socket.broadcast.emit('FAST_EVENT_BROADCAST', data);
        })

	socket.on('disconnect', function (message) {
		console.log('disconnect '+ socket.pseudo + ' ;mess ' +message);

		disconnectClient(socket.pseudo);
    });
	socket.on('peer-obj', function (message) {
		console.log('peer ' + message);
		disconnectClient(socket.pseudo);
    });
	socket.on('connectTo',function(pseudo){
		console.log(socket.pseudo + ' asked to connect to'  + pseudo);
		if(clients[pseudo]==null){
			console.log('cannot connect ' + socket.pseudo + ' to '+ pseudo);
			return;
		}

		var socket2 = clients[pseudo];
		var ip = getIp(socket2);
		var mess = {'ip':ip,'port':socket2.port}


		socket.emit('connectTo', mess);
	});

	// FAST Protocol
	
	// TABLE_CONNECT
	socket.on('FAST_TABLE_CONNECT',function(none){
		console.log("TABLE_CONNECT");
		tableID = 0;
		tableSocket = socket;
		socket.emit('FAST_TABLE_CONNECT', tableID);
	});
	
	// FAST_COLOR
	socket.on('FAST_COLOR',function(none){
		console.log("FAST_COLOR");
		socket.broadcast.emit('FAST_COLOR', none);

	});
	
	socket.on('FAST_PHONE_CONNECT',function(object){
		console.log('FAST_PHONE_CONNECT');
		console.log(object);
		
		if(tableSocket==socket){
			console.log("table connect");
			// from table
			// add player object
			object.PLAYER_ID = playerIndex++;
			object.COLOR = colors[object.PLAYER_ID];
			object.PHONE_CONNECTED = false;
			players.push(object);

		}
		else{
			createPlayer();
			var foundP = findPlayer(object.ATOM_PHONE_ID,socket);
			// for(var i=0;i<players.length;i++){
				// if(!players[i].PHONE_CONNECTED){
					// console.log("Found player not connected");
					// console.log(players[i]);
				// //if(players[i].ATOM_PHONE_ID==object.ATOM_PHONE_ID){
					// //players[i].socket = socket;
					// players[i].PHONE_CONNECTED = true;
					// players[i].OK = true;
					// socket.player = players[i];
					// foundP = players[i];
					// found = true;
					// break;
				// }
			// }
			if(foundP == undefined){
				createPlayer();
				foundP = findPlayer(object.ATOM_PHONE_ID,socket);

			}
			

			console.log("ok");
			socket.emit('FAST_PHONE_CONNECT', foundP);
			console.log("ok2");
			if(tableSocket!=null)
				tableSocket.emit('FAST_PHONE_CONNECT', foundP);
			else
				console.log("table not connected");
			//socket.broadcast.emit('FAST_PHONE_CONNECT', foundP);
			
			// else{
				// console.log("ok");
				// var bad = {OK:false};
				// socket.emit('FAST_PHONE_CONNECT', bad);

			// }
		}
	});
});

function findPlayer(id,socket){
	for(var i=0;i<players.length;i++){
		if(!players[i].PHONE_CONNECTED){
			console.log("Found player not connected");
			console.log(players[i]);
		//if(players[i].ATOM_PHONE_ID==object.ATOM_PHONE_ID){
			//players[i].socket = socket;
			players[i].PHONE_CONNECTED = true;
			players[i].OK = true;
			socket.player = players[i];
			foundP = players[i];
			found = true;
			return  players[i];
			break;
		}
	}
}

function createPlayer(){
	var object = {
			ATOM_PHONE_ID: 20,
			ATOM_PLAYER_ID: playerIndex,
			PHONE_CONNECTED: false
	}
	object.PLAYER_ID = playerIndex++;
	object.COLOR = colors[object.PLAYER_ID%colors.length];
	console.log("created player");
	console.log(object);
	players.push(object);
			
}

console.log('Listening to 8080');
server.listen(8080);

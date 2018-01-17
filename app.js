var http = require('http');
var fs = require('fs');

// var Session = require('express-session');
// var SessionStore = require('session-file-store')(Session);
// var session = Session({store: new SessionStore({path: __dirname+'/tmp/sessions'}), secret: 'pass121211', resave: true, saveUninitialized: true});
// var express = require('express');
// var app = express();

// var ios = require('socket.io-express-session');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);
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


	socket.on('message', function (message) {
		var mess = {'pseudo':socket.pseudo,'message':message}
        console.log('brodcasting message'+socket.pseudo + ' : ' + message);
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

});
console.log('Listening to 8080');
server.listen(8080);

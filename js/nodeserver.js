var app = require('express')();
// var http = require('http').Server(app);
 var sql = require('mssql');
var port = process.env.PORT || 9001;
var fs = require('fs');
var server_handler = function (req, res) {

		res.setHeader('Access-Control-Allow-Origin', 'http://leo.canvas');

		// Request methods you wish to allow
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

		// Request headers you wish to allow
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		// Set to true if you need the website to include cookies in the requests sent
		// to the API (e.g. in case you use sessions)
		res.setHeader('Access-Control-Allow-Credentials', true);

        res.writeHead(404);
        res.end();
    },
    http = null;

	//SQL
	// config for your database
var config = {
    user: 'canvas',
    password: 'OaLzw5K3',
    server: '192.168.15.205',
    database: 'CanvasSocketIO'
};

// Create an http(s) server instance to that socket.io can listen to

    http = require('https').Server({
        key: fs.readFileSync("config/sslcerts/key.pem"),
        cert: fs.readFileSync("config/sslcerts/cert.pem"),
        passphrase: "duj9OYtB"
    }, server_handler);

	var io = require('socket.io')(http);
	sql.connect(config);

io.on('connection', function(socket){

  socket.on('create room', function(roomName){

	var request = new sql.Request();

		// query to the database and get the records
	var query = "CreateRoom '" + roomName + "'";
	request.query(query, function (err, recordset) {

		if (err){
			console.log(err)
		}
		socket.join(roomName);
		socket.emit("room created", recordset);
	});
  });

  socket.on('join room', function(roomName){

	var request = new sql.Request();

	// query to the database and get the records
	var query = "JoinRoom '" + roomName + "'";
	request.query(query, function (err, recordset) {

		if (err){
			console.log(err)
		}
		socket.join(roomName);
		socket.emit("room joined", recordset);
	});
  });

  socket.on('added shape', function(shape, params){
    var data = {
      id: params.id,
      shape: shape
    }

	var request = new sql.Request();

	// query to the database and get the records
	var roomName = params.roomName;
	var query = "AddObjectToRoom '" + params.roomId + "', '" + params.id + "', '" + JSON.stringify(shape) + "'";

	request.query(query, function (err, recordset) {

		if (err){
			console.log(err);
		}
		socket.broadcast.to(roomName).emit('added shape', data);

	});
  });


  socket.on('draw finished', function(shape, params){
    var data = {
      id: params.id,
      shape: shape
    }
	var roomName = params.roomName;
	var request = new sql.Request();

	// query to the database and get the records
	var query = "AddObjectToRoom '" + params.roomId + "', '" + params.id + "', '" + JSON.stringify(shape) + "'";
	request.query(query, function (err, recordset) {

		if (err){
			console.log(err)
		}
		socket.broadcast.to(roomName).emit('draw finished', data);

	});
  });

  socket.on('shape modified', function(modifiedShape, params){
    var roomName = params.roomName;
    var data = {
      id: params.id,
      shape: modifiedShape
    }

	var request = new sql.Request();

	// query to the database and get the records
	var query = "UpdateObjectInRoom '" + params.roomId + "', '" + params.id + "', '" + JSON.stringify(modifiedShape) + "'";

	request.query(query, function (err, recordset) {

		if (err){
			console.log(err)
		}
		socket.broadcast.to(roomName).emit('shape modified', data);

	});

  });

  socket.on('delete object', function(params){
    var data = {
      id: params.id
    }
	var roomName = params.roomName;
	var request = new sql.Request();

	// query to the database and get the records
	var query = "DeleteObjectFromRoom '" + params.roomId + "', '" + params.id + "'";
	request.query(query, function (err, recordset) {

		if (err){
			console.log(err)
		}
		socket.broadcast.to(roomName).emit('delete object', data);

	});

  });

});


http.listen(port, function(){
  console.log('listening on *:' + port);
});


var app = require('express')();
// var http = require('http').Server(app);
var secure = false;
var port = process.env.PORT || 9001;
var fs = require('fs');
var server_handler = function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', 'http://canvas.tew-dev.com');

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

// Create an http(s) server instance to that socket.io can listen to
if (secure) {
  http = require('https').Server({
    key: fs.readFileSync("config/sslcerts/key.pem"),
    cert: fs.readFileSync("config/sslcerts/cert.pem"),
    passphrase: "duj9OYtB"
  }, server_handler);
} else {
  http = require('https').Server(app);
}


var io = require('socket.io')(http);

io.on('connection', function (socket) {

  socket.on('added shape', function (shape, params) {
    var data = {
      id: params.id,
      shape: shape
    }
    socket.broadcast.emit('added shape', data);
  });

  socket.on('draw finished', function (shape, params) {
    var data = {
      id: params.id,
      shape: shape
    }
    socket.broadcast.emit('draw finished', data);
  });

  socket.on('shape modified', function (modifiedShape, params) {
    console.info('Modified shape ', modifiedShape);
    console.info('params ', params);

    var data = {
      id: params.id,
      shape: modifiedShape
    }
    socket.broadcast.emit('shape modified', data);
  });

  socket.on('delete object', function(params){
    var data = {
      id: params.id
    }
    socket.broadcast.emit('delete object', data);
  });

});


http.listen(port, function () {
  console.log('listening on *:' + port);
});

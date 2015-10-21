(function() {
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
var socketio = require('socket.io');
var tripSearcher = require('./tripSearcher.js');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

//Direct browsing to client directory
router.use(express.static(path.resolve(__dirname, 'client')));

router.use(bodyParser.urlencoded({
    extended:true
}));

io.on('connection', function(socket) { 
  socket.on('getTrips', function(params) {
    tripSearcher.getTrips(params, io);
  });
  
  socket.on('denormalize', function(params) {
    console.error("Denormalize not yet implemented");  
  });
});


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Citibike mapper listening at ", addr.address + ":" + addr.port);
});
})();
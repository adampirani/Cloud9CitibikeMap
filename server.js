var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes"]
var db = require("mongojs")(databaseUrl, collections);
var socketio = require('socket.io');
var routeProcessor = require('./routeProcessor.js');


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
    console.log("get trips with params: ", params);
    
    db.trips.find(
      { starttime: {
          $gte: new Date(params.start),
          $lt:  new Date(params.end),
        },
        coordinates : { $exists: true }
      }).sort( { starttime: 1 },
      function(err, trips) {
        if(err) {
          console.log("ERROR: ", err);
        }
        else {
          console.log("found this many trips: ", trips.length);
          io.emit("trips", trips);
        }
      }
    );
  });
  
  socket.on('findRoutes', function(params) {
    console.log("FIND ROUTES");
    routeProcessor.findRoutes(params);
  });
});




server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Citibike mapper listening at ", addr.address + ":" + addr.port);
});

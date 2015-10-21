var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes", "tripRoutes"]
var db = require("mongojs")(databaseUrl, collections);

exports.getTrips = function(params, socket) {
    console.log("get trips with params: ", params);
    
    db.tripRoutes.find(
      { starttime: {
          $gte: new Date(params.start),
          $lt:  new Date(params.end),
        },
      }).sort( { starttime: 1 },
      function(err, trips) {
        if(err) {
          console.log("ERROR: ", err);
        }
        else {
          console.log("found this many trips: ", trips.length);
          socket.emit("trips", trips);
        }
      }
    );
}
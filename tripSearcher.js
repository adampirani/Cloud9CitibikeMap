(function() {
var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes"]
var db = require("mongojs")(databaseUrl, collections);

exports.getTrips = function(params, io) {
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
}
})();
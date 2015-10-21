var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes", "tripRoutes"]
var db = require("mongojs")(databaseUrl, collections);

//Run automatically on the server, wrap in exports if using UI
// exports.denormalize = function(params) {
  populateTripRoutes();
// }

function populateTripRoutes() {
  forAllTrips(populateTripRoute);
}

function forAllTrips(callback) {
  db.trips.find({}, function(err, trips) {
    console.log("num trips: ", trips.length);
    trips.forEach(function(trip) { callback(trip); });
  });
}

function populateTripRoute(trip) {
  var query = { '_id': trip['start_station_id'] + '_' + trip['end_station_id'] };
  db.routes.find( query, function(err, routes) {
    if (err) {
      console.error("Error searching for trip: " + trip);
      console.error("error: ", err);
    }
    if (routes.length === 1) {
      saveTripRoute(trip, routes[0]);
    }
    else {
      console.error("Routes length wasn't exactly 1 for trip: ", trip);
      console.error("Routes : ", routes)
    }
  });
}

function saveTripRoute(trip, route) {
  var tripRoute = trip;
    
  tripRoute.routeName = route._id;
  tripRoute.routeCoordinates = route.coordinates;
  tripRoute.routeDuration = route.duration;
  
  db.tripRoutes.save(tripRoute);
}


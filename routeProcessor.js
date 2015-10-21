(function() {
var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes"]
var db = require("mongojs")(databaseUrl, collections);
var http = require('http');
var GOOGLE_REQUEST_TIMER = 500;
var GOOGLE_REQUEST_URL = "http://maps.googleapis.com/maps/api/directions/json?origin=";

//Run automatically on the server, wrap in exports if using UI
// exports.findRoutes = function(params) {
  findUniqueTrips(lookupRoutes);
// }

function findUniqueTrips(callback) {
    //TODO: This aggregate statement seems odd, should be able to just output lat/long fields after finding 2 unique station id fields
    db.trips.aggregate( [ 
    	{ $group: 
    		{ 
    		    _id: { start: "$start_station_id" , end: "$end_station_id" },
    		    start_station_id : { $first : "$start_station_id"},
    		    end_station_id : { $first : "$end_station_id"},
            start_station_latitude: { $first : "$start_station_latitude" },
        		start_station_longitude: { $first : "$start_station_longitude" },
            end_station_latitude: { $first : "$end_station_latitude" },
        	  end_station_longitude: { $first : "$end_station_longitude" },
    		}
    	},
    // 	{
    // 	    $project: { 
    // 	       // _id: 0,
    // 	       // route_id: { $concat: [ { $substr: ["$_id.start", 0, 3] } , { $substr: ["$_id.end", 0, 3]} ] },
    // 	        start_station_id : 1,
    // 		    end_station_id : 1,
    // 	        start_station_latitude: 1,
    //         	start_station_longitude: 1,
    //             end_station_latitude: 1,
    //         	end_station_longitude: 1 
    // 	    }
    // 	}
    ], function(err, trips) {
        if (err) {
            console.error("ERROR FINDING ROUTES: " , err);
        }
        else {
            callback(trips);
        }
    });
}

function lookupRoutes(trips) {
  console.log("found this many unique trips: ", trips.length);
  var i = 0;
  var len = trips.length;
  var numNewRoutes = 0;
  
  for (var i = 0; i < len; ++i) {
    var aTrip = trips[i];
    newRouteExecute(aTrip, function(trip) {
      lookupRouteForTrip(trip, numNewRoutes++);
    });
  }
}

function newRouteExecute(trip, callback) {
  db.routes.find( { '_id': trip['start_station_id'] + '_' + trip['end_station_id']}, function(err, routes) {
    if (err) {
        console.error("Error looking up trip in routes: ", err);
    }
    if (routes.length === 0) {
        callback(trip);
    }
  });
}

function lookupRouteForTrip(aTrip, routeNum) {
    var path = GOOGLE_REQUEST_URL + aTrip["start_station_latitude"] + "," + aTrip["start_station_longitude"] +
          "&destination=" + aTrip["end_station_latitude"] + "," + aTrip["end_station_longitude"] +
          "&mode=bicycling";
    setTimeout(function() { lookupOnGoogle(path, aTrip) }, GOOGLE_REQUEST_TIMER*routeNum);
}

function lookupOnGoogle(path, aTrip) {
    http.get(path, function(response) { handleGoogleResponse(response, aTrip); });
}

function handleGoogleResponse(response, aTrip) {
    var body = '';

    response.on('data', function(d) {
      body += d;
    });
    
    response.on('error', function(e) {
      console.error("Error on google map request: ", e);
    });
    
    response.on('end', function() { processBikeTripResponse(body, aTrip); });
}

function  processBikeTripResponse(body, aTrip) {
    var parsed = JSON.parse(body);
    //TODO: Send message to client about progress every so often (10 trips?)
    if (parsed.error_message){
      console.error("Error in google response: ", parsed.error_message); 
    }
    else {
      setCoordinatesAndDistance(parsed, aTrip);
    }
    
    ([{$group:{"start_station_id": "$start_station_id", "end_station_id": "$end_station_id"}}])
    
}

function setCoordinatesAndDistance(directionResult, trip) {
  // For each step, save the coordinates to build a line that follows
  // the default bicycling directions
  // console.log("directionResult: ", directionResult);
  var myRoute = directionResult.routes[0].legs[0];
  var coordinates = [];

  for (var i = 0; i < myRoute.steps.length; i++) {
    var step = myRoute.steps[i];
    coordinates.push(step.start_location);
    if (i === myRoute.steps.length - 1) {
      coordinates.push(step.end_location);
    }
  };
  
  db.routes.save( { '_id'                : trip['start_station_id'] + '_' + trip['end_station_id'],
                    'start station name' : trip['start station name'],
                    'start station id'   : trip['start_station_id'],
                    'end station name'   : trip['end station name'],
                    'end station id'     : trip['end_station_id'],
                    'coordinates'        : coordinates,
                    'distance'           : myRoute.distance.value,
                    'duration'           : myRoute.duration.value });
}

})();
var databaseUrl = "mongodb://localhost/citibike"; // "username:password@example.com/mydb"
var collections = ["trips", "routes"]
var db = require("mongojs")(databaseUrl, collections);
var http = require('http');

exports.findRoutes = function(params) {
    db.trips.find(
      { starttime: {
          $gte: new Date("12/1/2014"),
          $lt:  new Date("12/2/2014"),
        },
        coordinates: {
          $exists: false
        }
      }, 
      function(err, trips) {
        if(err) {
          console.log("ERROR: ", err);
        }
        else {
          lookupRoutes(trips);
        }
    });
}

function lookupRoutes(trips) {
  console.log("found this many trips without coordinates: ", trips.length);
  for (var i = 0, len = trips.length; i < len; ++i) {
    var trip = trips[i];
    (function(aTrip, j) {
    //TODO: Use promises/generators instead of a 500ms timer
    setTimeout(function() { lookupRouteForTrip(len, j, aTrip); }, j*500); 
    })(trip, i);
  }
}

function lookupRouteForTrip(len, j, aTrip) {
  console.log("searching routes for with id: " , aTrip['start_station_id'] + '_' + aTrip['end_station_id']);
  db.routes.find( { '_id': aTrip['start_station_id'] + '_' + aTrip['end_station_id']}, function(err, routes) {
    if (routes && routes.length > 0) {
      console.log("found that route already");
      return;
    }
    else {
      var path = "http://maps.googleapis.com/maps/api/directions/json?origin=" + aTrip["start station latitude"] + "," + aTrip["start station longitude"] +
          "&destination=" + aTrip["end station latitude"] + "," + aTrip["end station longitude"] +
          "&mode=bicycling";

      http.get(path, function(response) { handleGoogleResponse(response, len, j, aTrip); });
    }
  });
  
  
}

function handleGoogleResponse(response, len, j, aTrip) {
    var body = '';

    response.on('data', function(d) {
      body += d;
    });
    
    response.on('error', function(e) {
      console.error("Error on google map request: ", e);
    });
    
    response.on('end', function() { processBikeTripResponse(body, len, j, aTrip); });
}

function  processBikeTripResponse(body, len, j, aTrip) {
    var parsed = JSON.parse(body);
    console.log("saving trip j: " + j + " of " + len);
    //TODO: Send message to client about progress every so often (10 trips?)
    if (parsed.error_message){
      console.error("Error in google response: ", parsed.error_message); 
    }
    else {
      setCoordinatesAndDistance(parsed, aTrip);
    }
    
    ([{$group:{"start station id": "$start station id", "end station id": "$end station id"}}])
    
}

function setCoordinatesAndDistance(directionResult, trip) {
  // For each step, save the coordinates to build a line that follows
  // the default bicycling directions
  // console.log("directionResult: ", directionResult);
  var myRoute = directionResult.routes[0].legs[0];

  trip.coordinates = [];
  trip.distance    = myRoute.distance.value;

  for (var i = 0; i < myRoute.steps.length; i++) {
    var step = myRoute.steps[i];
    trip.coordinates.push(step.start_location);
    if (i === myRoute.steps.length - 1) {
      trip.coordinates.push(step.end_location);
    }
  };
  
  // console.log("saving this trip? ", trip);
  db.trips.save(trip);
  db.routes.save( { '_id'                : trip['start station id'] + '_' + trip['end station id'],
                    'start station name' : trip['start station name'],
                    'start station id'   : trip['start station id'],
                    'end station name'   : trip['end station name'],
                    'end station id'     : trip['end station id'],
                    'coordinates'        : trip.coordinates,
                    'distance'           : trip.distance,
                    'duration'           : myRoute.duration.value });
}
(function() {
  "use strict";
var map;
var TIME_FACTOR = 3; //For every second in real life, move at 3ms
var HEX_MAX = 255;
var HEX_BASE = 16;
var MAX_SPEED_FACTOR = 0.6;
var MIN_SPEED_FACTOR = 1.5;

function buildDateStringISO(time) {
  return "2014-12-01T" + time + ":00.000Z";
}

window.getTrips = function() {
  var startTimeString = document.getElementById("startTime").value;
  var endTimeString   = document.getElementById("endTime").value;

  window.socket.emit('getTrips', { start: buildDateStringISO(startTimeString), end: buildDateStringISO(endTimeString) });
}

window.receivedTrips = function(trips) {
  console.log("received this many trips: ", trips.length);
  startAnimation(trips);
}

function startAnimation(trips) {
  var startTime   = document.getElementById("startTime").value;
  var baseline = new Date(buildDateStringISO(startTime));
  for (var i = 0, len = trips.length; i < len; ++i) {
    var trip = trips[i];
    animateTrip(trip, (new Date(trip.starttime) - baseline)/1000);
  }
}

window.initializeMapService = function() {
  // Instantiate a directions service.
  // directionsService = new window.google.maps.DirectionsService();

  // Create a map and center it on the East River.
  var eastRiver = new window.google.maps.LatLng(40.7234205, -73.9730403);
  
  var mapOptions = {
    zoom: 13,
    center: eastRiver,
  }
  map = new window.google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

function animateTrip(trip, startTime) {   
  // Define the symbol, using one of the predefined paths ('CIRCLE')
  // supplied by the Google Maps JavaScript API.    
  var lineSymbol = {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 2,
      strokeColor: '#393'
  };
  
  // Create the polyline and add the symbol to it via the 'icons' property.
  var bikePath = new window.google.maps.Polyline({
    path: trip.routeCoordinates,
    geodesic: true,
    strokeColor: getTripColor(trip),
    strokeOpacity: 1.0,
    strokeWeight: 1,
    icons: [{
      icon: lineSymbol,
      offset: '0%'
    }],
  });

  scheduleRoute(bikePath, trip, startTime);
}

function getTripColor(trip) {
  if (trip.routeDuration === 0) {
    return "blue";
  }
  var relativeDuration = trip.tripduration / trip.routeDuration;
  var redFactor = 0;
  var greenFactor = 0;
  var blueFactor = 0;

  if (relativeDuration < 1) { //faster than google directions
    //closer to MAX_SPEED_FACTOR -> more red
    //closer to 1 -> more green
    var fastBaseline = Math.max(relativeDuration - MAX_SPEED_FACTOR, 0) / MAX_SPEED_FACTOR;
    greenFactor = fastBaseline;
    redFactor = 1 - fastBaseline;
  }
  else { //slower than google directions
    //closer to MIN_SPEED_FACTOR -> more blue
    //closer to 1 -> more green
    var slowBaseline = (Math.min(relativeDuration, MIN_SPEED_FACTOR) - 1) / (MIN_SPEED_FACTOR - 1) ;
    blueFactor = slowBaseline;
    greenFactor = 1 - slowBaseline;
  }
  
  var red   = percentageToHexString(redFactor, 2);
  var green = percentageToHexString(greenFactor, 2);
  var blue  = percentageToHexString(blueFactor, 2);
  
  return '#' + red + green + blue;
}

function percentageToHexString(pct, padding) {
  var hex = Number(Math.round(pct*HEX_MAX)).toString(HEX_BASE);
  padding = padding === undefined ? 2 : padding;

  while (hex.length < padding) {
      hex = "0" + hex;
  }

  return hex;
}

//Schedule the animation to take place based on when it starts
function scheduleRoute(bikePath, trip, startTime) {
   window.setTimeout(function() {
    // console.log("starting trip with startTime: ", startTime);
    bikePath.setMap(map);
    var count = 0;
    var numIncrements = Math.floor(trip.tripduration * TIME_FACTOR /20);

    // Use the DOM setInterval() function to change the offset of the symbol
    // at fixed intervals.
    var intervalId = window.setInterval(function() {
        var percent = ++count / numIncrements;
        var icons = bikePath.get('icons');
        icons[0].offset = (percent*100 + '%');
        bikePath.set('icons', icons);
        if (percent >= 1) {
          bikePath.setMap(null);
          bikePath.set('icons', []);
          window.clearInterval(intervalId);
        }
    }, 20);
    
  }, startTime * TIME_FACTOR);
}

window.google.maps.event.addDomListener(window, 'load', function() {
  window.initializeMapService();
});

})();
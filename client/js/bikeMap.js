(function() {
  "use strict";
var map;
var TIME_FACTOR = 3; //For every second in real life, move at 3ms

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
    path: trip.coordinates,
    geodesic: true,
    strokeColor: '#0000FF',
    strokeOpacity: 1.0,
    strokeWeight: 1,
    icons: [{
      icon: lineSymbol,
      offset: '0%'
    }],
  });

  scheduleRoute(bikePath, trip, startTime);
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
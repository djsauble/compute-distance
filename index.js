var sgeo = require('sgeo');

// Smooth the run (e.g. ignore bouncing GPS tracks)
var defaultFilter = function (data) {
  var accurate = [],
      filtered = [],
      maxDistance = 20; // Meters

  // Filter out inaccurate points
  data.forEach(function(e) {
    if (!e.accuracy || parseFloat(e.accuracy) < maxDistance) {
      accurate.push(e);
    }
  });

  // Filter out discontinuities (points that aren't adjacent to any other points)
  for (var i = 1; i < accurate.length - 1; ++i) {
    var pt1 = new sgeo.latlon(
      parseFloat(accurate[i-1].latitude),
      parseFloat(accurate[i-1].longitude)
    );
    var pt2 = new sgeo.latlon(
      parseFloat(accurate[i].latitude),
      parseFloat(accurate[i].longitude)
    );
    var pt3 = new sgeo.latlon(
      parseFloat(accurate[i+1].latitude),
      parseFloat(accurate[i+1].longitude)
    );
    var d1 = pt1.distanceTo(pt2);
    var d2 = pt2.distanceTo(pt3);
    if (d1 <= maxDistance && d2 <= maxDistance) {
      filtered.push(accurate[i]);
    }
  }

  return filtered;
};

// Get an array of coordinates
var getCoordinates = function (data) {
  var coords = [];

  for (var i in data) {
    coords.push(new sgeo.latlon(
      parseFloat(data[i].latitude),
      parseFloat(data[i].longitude)
    ));
  }

  return coords;
};

// Get the distance represented by a set of coordinates (meters)
var computeDistance = function (coords) {

  var distance = 0;
  for (var i = 0; i < coords.length - 1; ++i) {
    distance += parseFloat(coords[i].distanceTo(coords[i + 1]));
  }
  return distance * 1000;
};

module.exports = {
  filter: defaultFilter,
  map: getCoordinates,
  compute: computeDistance
};

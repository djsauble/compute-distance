// Get the Google API object, if it exists
var getGoogleAPI = function (options) {
  if (options && options.google) {
    return options.google;
  }
  else if (global && global.google) {
    return global.google;
  }
  else if (window && window.google) {
    return window.google;
  }
  else {
    console.log("Google API object does not exist");
    console.trace();
  }

  return undefined;
};

// Smooth the run (e.g. ignore bouncing GPS tracks)
var defaultFilter = function (data, options) {
  var accurate = [],
      filtered = [],
      maxDistance = 20, // Meters
      google = getGoogleAPI(options);

  // Filter out inaccurate points
  data.forEach(function(e) {
    if (!e.accuracy || parseFloat(e.accuracy) < maxDistance) {
      accurate.push(e);
    }
  });

  // Filter out discontinuities (points that aren't adjacent to any other points)
  for (var i = 1; i < accurate.length - 1; ++i) {
    var pt1 = new google.maps.LatLng(
        {
          lat: parseFloat(accurate[i-1].latitude),
          lng: parseFloat(accurate[i-1].longitude)
        }
    );
    var pt2 = new google.maps.LatLng(
        {
          lat: parseFloat(accurate[i].latitude),
          lng: parseFloat(accurate[i].longitude)
        }
    );
    var pt3 = new google.maps.LatLng(
        {
          lat: parseFloat(accurate[i+1].latitude),
          lng: parseFloat(accurate[i+1].longitude)
        }
    );
    var d1 = google.maps.geometry.spherical.computeDistanceBetween(pt1, pt2);
    var d2 = google.maps.geometry.spherical.computeDistanceBetween(pt2, pt3);
    if (d1 <= maxDistance && d2 <= maxDistance) {
      filtered.push(accurate[i]);
    }
  }

  return filtered;
};

// Get an array of coordinates
var getCoordinates = function (data, options) {
  var coords = [],
      google = getGoogleAPI(options);

  for (var i in data) {
    coords.push(new google.maps.LatLng({
      lat: parseFloat(data[i].latitude),
      lng: parseFloat(data[i].longitude)
    }));
  }

  return coords;
};

// Get the distance represented by a set of coordinates (meters)
var computeDistance = function (coords, options) {
  var google = getGoogleAPI(options);

  var distance = 0;
  for (var i = 0; i < coords.length - 1; ++i) {
    distance += google.maps.geometry.spherical.computeDistanceBetween(coords[i], coords[i+1]);
  }
  return distance;
};

module.exports = {
  filter: defaultFilter,
  mapToGoogle: getCoordinates,
  computeDistance: computeDistance
};

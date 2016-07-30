(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function(root, factory) {

	if (root === null) {
		throw new Error('Google-maps package can be used only in browser');
	}

	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.GoogleMapsLoader = factory();
	}

})(typeof window !== 'undefined' ? window : null, function() {


	'use strict';


	var googleVersion = '3.18';

	var script = null;

	var google = null;

	var loading = false;

	var callbacks = [];

	var onLoadEvents = [];

	var originalCreateLoaderMethod = null;


	var GoogleMapsLoader = {};


	GoogleMapsLoader.URL = 'https://maps.googleapis.com/maps/api/js';

	GoogleMapsLoader.KEY = null;

	GoogleMapsLoader.LIBRARIES = [];

	GoogleMapsLoader.CLIENT = null;

	GoogleMapsLoader.CHANNEL = null;

	GoogleMapsLoader.LANGUAGE = null;

	GoogleMapsLoader.REGION = null;

	GoogleMapsLoader.VERSION = googleVersion;

	GoogleMapsLoader.WINDOW_CALLBACK_NAME = '__google_maps_api_provider_initializator__';


	GoogleMapsLoader._googleMockApiObject = {};


	GoogleMapsLoader.load = function(fn) {
		if (google === null) {
			if (loading === true) {
				if (fn) {
					callbacks.push(fn);
				}
			} else {
				loading = true;

				window[GoogleMapsLoader.WINDOW_CALLBACK_NAME] = function() {
					ready(fn);
				};

				GoogleMapsLoader.createLoader();
			}
		} else if (fn) {
			fn(google);
		}
	};


	GoogleMapsLoader.createLoader = function() {
		script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = GoogleMapsLoader.createUrl();

		document.body.appendChild(script);
	};


	GoogleMapsLoader.isLoaded = function() {
		return google !== null;
	};


	GoogleMapsLoader.createUrl = function() {
		var url = GoogleMapsLoader.URL;

		url += '?callback=' + GoogleMapsLoader.WINDOW_CALLBACK_NAME;

		if (GoogleMapsLoader.KEY) {
			url += '&key=' + GoogleMapsLoader.KEY;
		}

		if (GoogleMapsLoader.LIBRARIES.length > 0) {
			url += '&libraries=' + GoogleMapsLoader.LIBRARIES.join(',');
		}

		if (GoogleMapsLoader.CLIENT) {
			url += '&client=' + GoogleMapsLoader.CLIENT + '&v=' + GoogleMapsLoader.VERSION;
		}

		if (GoogleMapsLoader.CHANNEL) {
			url += '&channel=' + GoogleMapsLoader.CHANNEL;
		}

		if (GoogleMapsLoader.LANGUAGE) {
			url += '&language=' + GoogleMapsLoader.LANGUAGE;
		}

		if (GoogleMapsLoader.REGION) {
			url += '&region=' + GoogleMapsLoader.REGION;
		}

		return url;
	};


	GoogleMapsLoader.release = function(fn) {
		var release = function() {
			GoogleMapsLoader.KEY = null;
			GoogleMapsLoader.LIBRARIES = [];
			GoogleMapsLoader.CLIENT = null;
			GoogleMapsLoader.CHANNEL = null;
			GoogleMapsLoader.LANGUAGE = null;
			GoogleMapsLoader.REGION = null;
			GoogleMapsLoader.VERSION = googleVersion;

			google = null;
			loading = false;
			callbacks = [];
			onLoadEvents = [];

			if (typeof window.google !== 'undefined') {
				delete window.google;
			}

			if (typeof window[GoogleMapsLoader.WINDOW_CALLBACK_NAME] !== 'undefined') {
				delete window[GoogleMapsLoader.WINDOW_CALLBACK_NAME];
			}

			if (originalCreateLoaderMethod !== null) {
				GoogleMapsLoader.createLoader = originalCreateLoaderMethod;
				originalCreateLoaderMethod = null;
			}

			if (script !== null) {
				script.parentElement.removeChild(script);
				script = null;
			}

			if (fn) {
				fn();
			}
		};

		if (loading) {
			GoogleMapsLoader.load(function() {
				release();
			});
		} else {
			release();
		}
	};


	GoogleMapsLoader.onLoad = function(fn) {
		onLoadEvents.push(fn);
	};


	GoogleMapsLoader.makeMock = function() {
		originalCreateLoaderMethod = GoogleMapsLoader.createLoader;

		GoogleMapsLoader.createLoader = function() {
			window.google = GoogleMapsLoader._googleMockApiObject;
			window[GoogleMapsLoader.WINDOW_CALLBACK_NAME]();
		};
	};


	var ready = function(fn) {
		var i;

		loading = false;

		if (google === null) {
			google = window.google;
		}

		for (i = 0; i < onLoadEvents.length; i++) {
			onLoadEvents[i](google);
		}

		if (fn) {
			fn(google);
		}

		for (i = 0; i < callbacks.length; i++) {
			callbacks[i](google);
		}

		callbacks = [];
	};


	return GoogleMapsLoader;

});

},{}],3:[function(require,module,exports){
var Distance = require('../index');
var GoogleMapsLoader = require('google-maps');
GoogleMapsLoader.KEY = 'AIzaSyDrMrHDCL33b4PkB0p5SZlCR7mwc7Yp7SA';
GoogleMapsLoader.LIBRARIES = ['geometry'];

QUnit.test( 'Filter a GPS track to ensure the filter works', function(assert) {
  var done = assert.async();

  GoogleMapsLoader.load(function(google) {
    var options = { google: google };

    var filtered = Distance.filter(data, options);

    var raw = Distance.mapToGoogle(data, options);
    var civilized = Distance.mapToGoogle(filtered, options);

    var rawDistance = Distance.computeDistance(raw, options);
    var filteredDistance = Distance.computeDistance(civilized, options);

    assert.equal(104.01168761662434, rawDistance, 'Passed!');
    assert.equal(97.55330283703395, filteredDistance, 'Passed!');

    done();
  });
});

var data = [
  {
    "accuracy": "3.65034238412834",
    "timestamp": "2016-07-13 17:37:21 +0000",
    "speed": "2.87030777392534",
    "longitude": "-122.684291525972",
    "latitude": "45.4552793030159"
  },
  {
    "accuracy": "3.66371496094623",
    "timestamp": "2016-07-13 17:37:22 +0000",
    "speed": "2.94181233777536",
    "longitude": "-122.684279587705",
    "latitude": "45.4552545425528"
  },
  {
    "accuracy": "3.69168994022815",
    "timestamp": "2016-07-13 17:37:23 +0000",
    "speed": "2.90584564247121",
    "longitude": "-122.684267937937",
    "latitude": "45.4552295472177"
  },
  {
    "accuracy": "3.71961854027059",
    "timestamp": "2016-07-13 17:37:24 +0000",
    "speed": "2.88939306497784",
    "longitude": "-122.684256681587",
    "latitude": "45.4552047088093"
  },
  {
    "accuracy": "3.73611551361425",
    "timestamp": "2016-07-13 17:37:25 +0000",
    "speed": "2.92085520045488",
    "longitude": "-122.684244659873",
    "latitude": "45.4551799821795"
  },
  {
    "accuracy": "3.75104159306923",
    "timestamp": "2016-07-13 17:37:26 +0000",
    "speed": "2.88009491384224",
    "longitude": "-122.68423151589",
    "latitude": "45.4551555825611"
  },
  {
    "accuracy": "3.75294358239133",
    "timestamp": "2016-07-13 17:37:27 +0000",
    "speed": "2.88590454088516",
    "longitude": "-122.684217392998",
    "latitude": "45.4551316267062"
  },
  {
    "accuracy": "3.73716021259961",
    "timestamp": "2016-07-13 17:37:28 +0000",
    "speed": "2.95862321025117",
    "longitude": "-122.684202031463",
    "latitude": "45.4551076619896"
  },
  {
    "accuracy": "3.71001103884602",
    "timestamp": "2016-07-13 17:37:29 +0000",
    "speed": "3.07743891678977",
    "longitude": "-122.684185643287",
    "latitude": "45.455083078625"
  },
  {
    "accuracy": "3.68616770628963",
    "timestamp": "2016-07-13 17:37:30 +0000",
    "speed": "3.07354229861629",
    "longitude": "-122.684169543038",
    "latitude": "45.4550578383943"
  },
  {
    "accuracy": "3.65537953207874",
    "timestamp": "2016-07-13 17:37:31 +0000",
    "speed": "3.11652901765036",
    "longitude": "-122.684154421907",
    "latitude": "45.4550321066515"
  },
  {
    "accuracy": "3.6214133037302",
    "timestamp": "2016-07-13 17:37:32 +0000",
    "speed": "3.21517085266255",
    "longitude": "-122.684139305697",
    "latitude": "45.455005683394"
  },
  {
    "accuracy": "3.59629356447519",
    "timestamp": "2016-07-13 17:37:33 +0000",
    "speed": "3.34977743920018",
    "longitude": "-122.684123164934",
    "latitude": "45.454978423068"
  },
  {
    "accuracy": "3.58771906519626",
    "timestamp": "2016-07-13 17:37:34 +0000",
    "speed": "3.3403796911864",
    "longitude": "-122.684106600705",
    "latitude": "45.4549506760375"
  },
  {
    "accuracy": "3.57219846508053",
    "timestamp": "2016-07-13 17:37:35 +0000",
    "speed": "3.42979742697327",
    "longitude": "-122.684089777596",
    "latitude": "45.4549226154859"
  },
  {
    "accuracy": "3.57470621878724",
    "timestamp": "2016-07-13 17:37:36 +0000",
    "speed": "3.36006294951539",
    "longitude": "-122.684072927366",
    "latitude": "45.4548944670351"
  },
  {
    "accuracy": "3.60153575864319",
    "timestamp": "2016-07-13 17:37:37 +0000",
    "speed": "3.16408673247767",
    "longitude": "-122.68405786169",
    "latitude": "45.4548671056867"
  },
  {
    "accuracy": "3.6273040513033",
    "timestamp": "2016-07-13 17:37:38 +0000",
    "speed": "3.11620865080048",
    "longitude": "-122.684044514698",
    "latitude": "45.4548404608905"
  },
  {
    "accuracy": "3.64669036696636",
    "timestamp": "2016-07-13 17:37:39 +0000",
    "speed": "3.28168979307104",
    "longitude": "-122.684030815316",
    "latitude": "45.4548133434631"
  },
  {
    "accuracy": "3.67480467339098",
    "timestamp": "2016-07-13 17:37:40 +0000",
    "speed": "3.59168279884561",
    "longitude": "-122.684014809989",
    "latitude": "45.4547845527991"
  },
  {
    "accuracy": "3.7203005893323",
    "timestamp": "2016-07-13 17:37:41 +0000",
    "speed": "3.8579771782173",
    "longitude": "-122.683996271578",
    "latitude": "45.4547536840669"
  },
  {
    "accuracy": "3.76298224442169",
    "timestamp": "2016-07-13 17:37:42 +0000",
    "speed": "4.04524139953921",
    "longitude": "-122.683976045877",
    "latitude": "45.4547211038113"
  },
  {
    "accuracy": "3.78323035687535",
    "timestamp": "2016-07-13 17:37:43 +0000",
    "speed": "4.10112513408214",
    "longitude": "-122.683955009669",
    "latitude": "45.4546875791189"
  },
  {
    "accuracy": "3.78380365577449",
    "timestamp": "2016-07-13 17:37:44 +0000",
    "speed": "3.99709580324626",
    "longitude": "-122.683934392971",
    "latitude": "45.4546541624388"
  },
  {
    "accuracy": "3.77374014503256",
    "timestamp": "2016-07-13 17:37:45 +0000",
    "speed": "3.70703257726778",
    "longitude": "-122.683915860728",
    "latitude": "45.4546220573708"
  },
  {
    "accuracy": "3.73902017498624",
    "timestamp": "2016-07-13 17:37:46 +0000",
    "speed": "3.52467348205519",
    "longitude": "-122.683899424121",
    "latitude": "45.4545916502511"
  },
  {
    "accuracy": "3.68348615111873",
    "timestamp": "2016-07-13 17:37:47 +0000",
    "speed": "3.44406950940728",
    "longitude": "-122.683883223384",
    "latitude": "45.4545624495273"
  },
  {
    "accuracy": "3.61852038262765",
    "timestamp": "2016-07-13 17:37:48 +0000",
    "speed": "3.45734617474492",
    "longitude": "-122.683865779238",
    "latitude": "45.4545339399939"
  },
  {
    "accuracy": "3.55535485995236",
    "timestamp": "2016-07-13 17:37:49 +0000",
    "speed": "3.65735300464383",
    "longitude": "-122.683845314167",
    "latitude": "45.454505382999"
  },
  {
    "accuracy": "3.51559183131938",
    "timestamp": "2016-07-13 17:37:50 +0000",
    "speed": "3.78056144014349",
    "longitude": "-122.683821060169",
    "latitude": "45.4544766217887"
  },
  {
    "accuracy": "3.494195404299",
    "timestamp": "2016-07-13 17:37:51 +0000",
    "speed": "3.71737272365098",
    "longitude": "-122.683794638667",
    "latitude": "45.4544484859938"
  },
  {
    "accuracy": "3.4763594777032",
    "timestamp": "2016-07-13 17:37:52 +0000",
    "speed": "3.37623800473845",
    "longitude": "-122.68376892349",
    "latitude": "45.4544222021408"
  }
];

},{"../index":1,"google-maps":2}]},{},[3]);

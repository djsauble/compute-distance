Find the distance associated with an array of geospatial coordinates.

There are three methods associated with this library. Each takes an `options`
param, where you can pass your Google Maps API object (using [this
library](https://www.npmjs.com/package/google-maps), for example).

**filter(data, options)**

A filter designed to smooth abberations from a GPS trace. It discards
coordinates with accuracy less than 20 meters and coordinates that are more than
20 meters from their nearest neighbor.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double,
      accuracy: Double // optional
    }

**mapToGoogle(data, options)**

Take an array of coordinates and convert them to google.maps.LatLng objects.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double
    }

**computeDistance(data, options)**

Take an array of `google.maps.LatLng` objects and compute the distance they
represent in meters.

## Usage

This library depends on the Google Maps Javascript API, so be sure to include it
using the directions on [this page](https://developers.google.com/maps/documentation/javascript/).

To filter a set of data before computing distance, use the following code:

    var Distance = require('compute-distance');
    var GoogleMapsLoader = require('google-maps');
    GoogleMapsLoader.KEY = 'your-api-key';
    GoogleMapsLoader.LIBRARIES = ['geometry'];

    GoogleMapsLoader.load(function(google) {
      var options = { google: google };
      var filtered = Distance.filter(data, options); // data is an array of coordinates
      var points = Distance.mapToGoogle(filtered, options);
      var distance = Distance.computeDistance(points, options);
    };

To compute distance on a raw dataset, without filtering, pass your raw data to
`mapToGoogle` directly, instead of passing it through `filter` first.

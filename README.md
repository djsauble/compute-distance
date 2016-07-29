Find the distance associated with an array of geospatial coordinates.

There are three methods associated with this library.

**`filter(data)`**

A filter designed to smooth abberations from a GPS trace. It discards
coordinates with accuracy less than 20 meters and coordinates that are more than
20 meters from their nearest neighbor.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double,
      accuracy: Double // optional
    }

**`mapToGoogle(data)`**

Take an array of coordinates and convert them to google.maps.LatLng objects.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double
    }

**`computeDistance(data)`**

Take an array of google.maps.LatLng objects and compute the distance they
represent in meters.

## Usage

This library depends on the Google Maps Javascript API, so be sure to include it
using the directions on [this page](https://developers.google.com/maps/documentation/javascript/).

To filter a set of data before computing distance, use the following code:

    var Distance = require(`compute-distance`);

    var filtered = Distance.filter(data); // data is an array of coordinates
    var points = Distance.mapToGoogle(filtered);
    var distance = Distance.computeDistance(points);

To compute distance on a raw dataset, without filtering, do the following:

    var Distance = require(`compute-distance`);

    var points = Distance.mapToGoogle(data);
    var distance = Distance.computeDistance(points);

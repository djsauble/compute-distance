Find the distance associated with an array of geospatial coordinates.

There are three methods associated with this library:

**filter(data)**

A filter designed to smooth abberations from a GPS trace. It discards
coordinates with accuracy less than 20 meters and coordinates that are more than
20 meters from their nearest neighbor.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double,
      accuracy: Double // optional
    }

**map(data)**

Take an array of coordinates and convert them to
[sgeo](https://www.npmjs.com/package/sgeo) objects.

Each object in the array should have the following attributes set:

    {
      longitude: Double,
      latitude: Double
    }

**computeDistance(data)**

Take an array of [sgeo](https://www.npmjs.com/package/sgeo) objects and compute
the distance they represent in meters.

## Usage

To filter a set of data before computing distance, use the following code:

    var Distance = require('compute-distance');

    var filtered = Distance.filter(data); // data is an array of coordinates
    var points = Distance.map(filtered);
    var distance = Distance.computeDistance(points);

To compute distance on a raw dataset, without filtering, pass your raw data to
`map` directly, instead of passing it through `filter` first.

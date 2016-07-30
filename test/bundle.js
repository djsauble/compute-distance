(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  mapToGoogle: getCoordinates,
  computeDistance: computeDistance
};

},{"sgeo":2}],2:[function(require,module,exports){

//Original version of this module came from following website by Chris Veness
//http://www.movable-type.co.uk/scripts/latlong.html

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2012                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51 28 40.12 N');                                                    */
/*    var lon = Geo.parseDMS('000 00 05.31 W');                                                   */
/*    var p1 = new latlon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2012            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new latlon(51.5136, -0.0983);                                                      */
/*    var p2 = new latlon(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/*    var brng = p1.bearingTo(p2);           // in degrees clockwise from north                   */
/*    ... etc                                                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Note that minimal error checking is performed in this example code!                           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Parses string representing degrees/minutes/seconds into numeric degrees
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W)
 * or fixed-width format without separators (eg 0033709W). Seconds and minutes may be omitted.
 * (Note minimal validation is done).
 *
 * @param   {String|Number} dmsStr: Degrees or deg/min/sec in variety of formats
 * @returns {Number} Degrees as decimal number
 * @throws  {TypeError} dmsStr is an object, perhaps DOM object without .value?
 */

exports.parseDMS = function(dmsStr) {
    if (typeof deg == 'object') throw new TypeError('geo.parseDMS - dmsStr is [DOM?] object');

    // check for signed decimal degrees without NSEW, if so return it directly
    if (typeof dmsStr === 'number' && isFinite(dmsStr)) return Number(dmsStr);

    // strip off any sign or compass dir'n & split out separate d/m/s
    var dms = String(dmsStr).trim().replace(/^-/,'').replace(/[NSEW]$/i,'').split(/[^0-9.,]+/);
    if (dms[dms.length-1]=='') dms.splice(dms.length-1);  // from trailing symbol

    if (dms == '') return NaN;

    // and convert to decimal degrees...
    switch (dms.length) {
    case 3:  // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600;
      break;
    case 2:  // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60;
      break;
    case 1:  // just d (possibly decimal) or non-separated dddmmss
      var deg = dms[0];
      // check for fixed-width unseparated format eg 0033709W
      //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
      break;
    default:
      return NaN;
    }
    if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
    return Number(deg);
}


/**
 * Convert decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added
 *
 * @private
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} deg formatted as deg/min/secs according to specified format
 * @throws  {TypeError} deg is an object, perhaps DOM object without .value?
 */
exports.toDMS = function(deg, format, dp) {
  if (typeof deg == 'object') throw new TypeError('geo.toDMS - deg is [DOM?] object');
  if (isNaN(deg)) return null;  // give up here if we can't make a number from deg

    // default values
  if (typeof format == 'undefined') format = 'dms';
  if (typeof dp == 'undefined') {
    switch (format) {
      case 'd': dp = 4; break;
      case 'dm': dp = 2; break;
      case 'dms': dp = 0; break;
      default: format = 'dms'; dp = 0;  // be forgiving on invalid format
    }
  }

  deg = Math.abs(deg);  // (unsigned result ready for appending compass dir'n)

  switch (format) {
    case 'd':
      d = deg.toFixed(dp);     // round degrees
      if (d<100) d = '0' + d;  // pad with leading zeros
      if (d<10) d = '0' + d;
      dms = d + '\u00B0';      // add º symbol
      break;
    case 'dm':
      var min = (deg*60).toFixed(dp);  // convert degrees to minutes & round
      var d = Math.floor(min / 60);    // get component deg/min
      var m = (min % 60).toFixed(dp);  // pad with trailing zeros
      if (d<100) d = '0' + d;          // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      dms = d + '\u00B0' + m + '\u2032';  // add º, ' symbols
      break;
    case 'dms':
      var sec = (deg*3600).toFixed(dp);  // convert degrees to seconds & round
      var d = Math.floor(sec / 3600);    // get component deg/min/sec
      var m = Math.floor(sec/60) % 60;
      var s = (sec % 60).toFixed(dp);    // pad with trailing zeros
      if (d<100) d = '0' + d;            // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      if (s<10) s = '0' + s;
      dms = d + '\u00B0' + m + '\u2032' + s + '\u2033';  // add º, ', " symbols
      break;
  }

  return dms;
}


/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
exports.toLat = function(deg, format, dp) {
  var lat = exports.toDMS(deg, format, dp);
  return lat==null ? '.' : lat.slice(1) + (deg<0 ? 'S' : 'N');  // knock off initial '0' for lat!
}

/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
exports.toLon = function(deg, format, dp) {
  var lon = exports.toDMS(deg, format, dp);
  return lon==null ? '.' : lon + (deg<0 ? 'W' : 'E');
}


/**
 * Convert numeric degrees to deg/min/sec as a bearing (0º..360º)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
exports.toBrng = function(deg, format, dp) {
  deg = (Number(deg)+360) % 360;  // normalise -ve values to 180º..360º
  var brng =  exports.toDMS(deg, format, dp);
  return brng==null ? '.' : brng.replace('360', '0');  // just in case rounding took us up to 360º!
}

/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lat: latitude in numeric degrees
 * @param {Number} lon: longitude in numeric degrees
 */

//radius of earth
var radius = 6371;

var latlon = exports.latlon = function(lat, lon) {
  // only accept numbers or valid numeric strings
  this.lat = typeof(lat)=='number' ? lat : typeof(lat)=='string' && lat.trim()!='' ? +lat : NaN;
  this.lng = typeof(lon)=='number' ? lon : typeof(lon)=='string' && lon.trim()!='' ? +lon : NaN;
  //this._radius = typeof(rad)=='number' ? rad : typeof(rad)=='string' && trim(lon)!='' ? +rad : NaN;
}

/**
 * Returns the distance from this point to the supplied point, in km
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @param   {Number} [precision=4]: no of significant digits to use for returned value
 * @returns {Number} Distance in km between this point and destination point
 */
exports.latlon.prototype.distanceTo = function(point, precision) {
    // default 4 sig figs reflects typical 0.3% accuracy of spherical model
    if (typeof precision == 'undefined') precision = 4;

    var c = this.distanceRadTo(point);
    var d = radius * c;
    return d.toPrecisionFixed(precision);
}

exports.latlon.prototype.distanceRadTo = function(point) {
    var lat1 = this.lat.toRad(), lon1 = this.lng.toRad();
    var lat2 = point.lat.toRad(), lon2 = point.lng.toRad();
    var dLat = lat2 - lat1;
    var dLon = lon2 - lon1;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return c;
}


/**
 * Returns the (initial) bearing from this point to the supplied point, in degrees
 *   see http://williams.best.vwh.net/avform.htm#Crs
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {Number} Initial bearing in degrees from North
 */
exports.latlon.prototype.bearingTo = function(point) {
    var brng = this.bearingRadTo(point);
    return (brng.toDeg()+360) % 360;
}
exports.latlon.prototype.bearingRadTo = function(point) {
    var lat1 = this.lat.toRad()
    var lat2 = point.lat.toRad();
    var dLon = (point.lng-this.lng).toRad();

    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)*Math.cos(dLon);
    var y = Math.cos(lat2) * Math.sin(dLon);
    var brng = Math.atan2(y, x);
    return brng;
}


/**
 * Returns final bearing arriving at supplied destination point from this point; the final bearing
 * will differ from the initial bearing by varying degrees according to distance and latitude
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {Number} Final bearing in degrees from North
 */
exports.latlon.prototype.finalBearingTo = function(point) {
  // get initial bearing from supplied point back to this point...
  var lat1 = point.lat.toRad(), lat2 = this.lat.toRad();
  var dLon = (this.lng-point.lng).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);

  // ... & reverse it by adding 180°
  return (brng.toDeg()+180) % 360;
}


/**
 * Returns the midpoint between this point and the supplied point.
 *   see http://mathforum.org/library/drmath/view/51822.html for derivation
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {latlon} Midpoint between this point and the supplied point
 */
exports.latlon.prototype.midpointTo = function(point) {
    var lat1 = this.lat.toRad();
    var lat2 = point.lat.toRad();
    var dLon = (point.lng-this.lng).toRad();

    var Bx = Math.cos(lat2) * Math.cos(dLon);
    var By = Math.cos(lat2) * Math.sin(dLon);

    var lon1 = this.lng.toRad();

    lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2), Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) );
    lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
    lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

    return new exports.latlon(lat3.toDeg(), lon3.toDeg());
}

exports.midpoint = function(points) {
    var X = 0;
    var Y = 0;
    var Z = 0;

    for(var i in points) {
        var point = points[i];
        //console.log(i);
        //console.dir(point);

        var lat = point.lat * Math.PI / 180;
        var lon = point.lng * Math.PI / 180;
        //console.log("lat:"+lat);
        //console.log("lon:"+lon);

        var x = Math.cos(lat) * Math.cos(lon);
        var y = Math.cos(lat) * Math.sin(lon);
        var z = Math.sin(lat);
        //console.log("x:"+x);

        X += x;
        Y += y;
        Z += z;
    }

    X = X / points.length;
    Y = Y / points.length;
    Z = Z / points.length;

    var Lon = Math.atan2(Y, X);
    var Hyp = Math.sqrt(X * X + Y * Y);
    var Lat = Math.atan2(Z, Hyp);

    return new exports.latlon(Lat * 180 / Math.PI, Lon * 180 / Math.PI);
}

/*
Returns list of latlon between this point and the supplied endpoint
*/
exports.latlon.prototype.interpolate = function(point, num) {

    var distance = this.distanceRadTo(point);
    var bearing = this.bearingRadTo(point);

    var lat1 = this.lat.toRad();
    var lon1 = this.lng.toRad();
    var lat2 = point.lat.toRad();
    var lon2 = point.lng.toRad();

    var alatRadSin = Math.sin(lat1);
    var blatRadSin = Math.sin(lat2);
    var alatRadCos = Math.cos(lat1);
    var blatRadCos = Math.cos(lat2);

    var points = [];

    for(var i = 0;i < num;i++) {
        var t = 1/(num-1) * i;
        // Find new point
        var angularDistance=distance*t;
        var angDistSin=Math.sin(angularDistance);
        var angDistCos=Math.cos(angularDistance);
        var xlatRad = Math.asin( alatRadSin*angDistCos + alatRadCos*angDistSin*Math.cos(bearing) );
        var xlonRad = lon1 + Math.atan2( Math.sin(bearing)*angDistSin*alatRadCos, angDistCos-alatRadSin*Math.sin(xlatRad));

        // Convert radians to deg
        var xlat=xlatRad.toDeg();
        var xlon=xlonRad.toDeg();

        //normalize
        if(xlat>90)xlat=90;
        if(xlat<-90)xlat=-90;
        while(xlon>180)xlon-=360;
        while(xlon<=-180)xlon+=360;

        points.push(new exports.latlon(xlat, xlon));
    }
    return points;
}

/**
 * Returns the destination point from this point having travelled the given distance (in km) on the
 * given initial bearing (bearing may vary before destination is reached)
 *
 *   see http://williams.best.vwh.net/avform.htm#LL
 *
 * @param   {Number} brng: Initial bearing in degrees
 * @param   {Number} dist: Distance in km
 * @returns {latlon} Destination point
 */
exports.latlon.prototype.destinationPoint = function(brng, dist) {
  dist = typeof(dist)=='number' ? dist : typeof(dist)=='string' && dist.trim()!='' ? +dist : NaN;
  dist = dist/radius;  // convert dist to angular distance in radians
  brng = brng.toRad();  //
  var lat1 = this.lat.toRad(), lon1 = this.lng.toRad();

  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist) +
                        Math.cos(lat1)*Math.sin(dist)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist)*Math.cos(lat1),
                               Math.cos(dist)-Math.sin(lat1)*Math.sin(lat2));
  lon2 = (lon2+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

  return new exports.latlon(lat2.toDeg(), lon2.toDeg());
}


/**
 * Returns the point of intersection of two paths defined by point and bearing
 *
 *   see http://williams.best.vwh.net/avform.htm#Intersection
 *
 * @param   {latlon} p1: First point
 * @param   {Number} brng1: Initial bearing from first point
 * @param   {latlon} p2: Second point
 * @param   {Number} brng2: Initial bearing from second point
 * @returns {latlon} Destination point (null if no unique intersection defined)
 */
exports.latlon.intersection = function(p1, brng1, p2, brng2) {
  brng1 = typeof brng1 == 'number' ? brng1 : typeof brng1 == 'string' && trim(brng1)!='' ? +brng1 : NaN;
  brng2 = typeof brng2 == 'number' ? brng2 : typeof brng2 == 'string' && trim(brng2)!='' ? +brng2 : NaN;
  lat1 = p1.lat.toRad(), lon1 = p1.lng.toRad();
  lat2 = p2.lat.toRad(), lon2 = p2.lng.toRad();
  brng13 = brng1.toRad(), brng23 = brng2.toRad();
  dLat = lat2-lat1, dLon = lon2-lon1;

  dist12 = 2*Math.asin( Math.sqrt( Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2) ) );
  if (dist12 == 0) return null;

  // initial/final bearings between points
  brngA = Math.acos( ( Math.sin(lat2) - Math.sin(lat1)*Math.cos(dist12) ) /
    ( Math.sin(dist12)*Math.cos(lat1) ) );
  if (isNaN(brngA)) brngA = 0;  // protect against rounding
  brngB = Math.acos( ( Math.sin(lat1) - Math.sin(lat2)*Math.cos(dist12) ) /
    ( Math.sin(dist12)*Math.cos(lat2) ) );

  if (Math.sin(lon2-lon1) > 0) {
    brng12 = brngA;
    brng21 = 2*Math.PI - brngB;
  } else {
    brng12 = 2*Math.PI - brngA;
    brng21 = brngB;
  }

  alpha1 = (brng13 - brng12 + Math.PI) % (2*Math.PI) - Math.PI;  // angle 2-1-3
  alpha2 = (brng21 - brng23 + Math.PI) % (2*Math.PI) - Math.PI;  // angle 1-2-3

  if (Math.sin(alpha1)==0 && Math.sin(alpha2)==0) return null;  // infinite intersections
  if (Math.sin(alpha1)*Math.sin(alpha2) < 0) return null;       // ambiguous intersection

  //alpha1 = Math.abs(alpha1);
  //alpha2 = Math.abs(alpha2);
  // ... Ed Williams takes abs of alpha1/alpha2, but seems to break calculation?

  alpha3 = Math.acos( -Math.cos(alpha1)*Math.cos(alpha2) +
                       Math.sin(alpha1)*Math.sin(alpha2)*Math.cos(dist12) );
  dist13 = Math.atan2( Math.sin(dist12)*Math.sin(alpha1)*Math.sin(alpha2),
                       Math.cos(alpha2)+Math.cos(alpha1)*Math.cos(alpha3) )
  lat3 = Math.asin( Math.sin(lat1)*Math.cos(dist13) +
                    Math.cos(lat1)*Math.sin(dist13)*Math.cos(brng13) );
  dLon13 = Math.atan2( Math.sin(brng13)*Math.sin(dist13)*Math.cos(lat1),
                       Math.cos(dist13)-Math.sin(lat1)*Math.sin(lat3) );
  lon3 = lon1+dLon13;
  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

  return new exports.latlon(lat3.toDeg(), lon3.toDeg());
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Returns the distance from this point to the supplied point, in km, travelling along a rhumb line
 *
 *   see http://williams.best.vwh.net/avform.htm#Rhumb
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {Number} Distance in km between this point and destination point
 */
exports.latlon.prototype.rhumbDistanceTo = function(point) {
  var R = radius;
  var lat1 = this.lat.toRad(), lat2 = point.lat.toRad();
  var dLat = (point.lat-this.lat).toRad();
  var dLon = Math.abs(point.lng-this.lng).toRad();

  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (isFinite(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0

  // if dLon over 180° take shorter rhumb across anti-meridian:
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  }

  var dist = Math.sqrt(dLat*dLat + q*q*dLon*dLon) * R;

  return dist.toPrecisionFixed(4);  // 4 sig figs reflects typical 0.3% accuracy of spherical model
}

/**
 * Returns the bearing from this point to the supplied point along a rhumb line, in degrees
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {Number} Bearing in degrees from North
 */
exports.latlon.prototype.rhumbBearingTo = function(point) {
  var lat1 = this.lat.toRad(), lat2 = point.lat.toRad();
  var dLon = (point.lng-this.lng).toRad();

  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  if (Math.abs(dLon) > Math.PI) dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  var brng = Math.atan2(dLon, dPhi);

  return (brng.toDeg()+360) % 360;
}

/**
 * Returns the destination point from this point having travelled the given distance (in km) on the
 * given bearing along a rhumb line
 *
 * @param   {Number} brng: Bearing in degrees from North
 * @param   {Number} dist: Distance in km
 * @returns {latlon} Destination point
 */
exports.latlon.prototype.rhumbDestinationPoint = function(brng, dist) {
  var R = radius;
  var d = parseFloat(dist)/R;  // d = angular distance covered on earth.s surface
  var lat1 = this.lat.toRad(), lon1 = this.lng.toRad();
  brng = brng.toRad();

  var dLat = d*Math.cos(brng);
  // nasty kludge to overcome ill-conditioned results around parallels of latitude:
  if (Math.abs(dLat) < 1e-10) dLat = 0; // dLat < 1 mm

  var lat2 = lat1 + dLat;
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (isFinite(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  var dLon = d*Math.sin(brng)/q;

  // check for some daft bugger going past the pole, normalise latitude if so
  if (Math.abs(lat2) > Math.PI/2) lat2 = lat2>0 ? Math.PI-lat2 : -Math.PI-lat2;

  lon2 = (lon1+dLon+3*Math.PI)%(2*Math.PI) - Math.PI;

  return new exports.latlon(lat2.toDeg(), lon2.toDeg());
}

/**
 * Returns the loxodromic midpoint (along a rhumb line) between this point and the supplied point.
 *   see http://mathforum.org/kb/message.jspa?messageID=148837
 *
 * @param   {latlon} point: Latitude/longitude of destination point
 * @returns {latlon} Midpoint between this point and the supplied point
 */
exports.latlon.prototype.rhumbMidpointTo = function(point) {
  lat1 = this.lat.toRad(), lon1 = this.lng.toRad();
  lat2 = point.lat.toRad(), lon2 = point.lng.toRad();

  if (Math.abs(lon2-lon1) > Math.PI) lon1 += 2*Math.PI; // crossing anti-meridian

  var lat3 = (lat1+lat2)/2;
  var f1 = Math.tan(Math.PI/4 + lat1/2);
  var f2 = Math.tan(Math.PI/4 + lat2/2);
  var f3 = Math.tan(Math.PI/4 + lat3/2);
  var lon3 = ( (lon2-lon1)*Math.log(f3) + lon1*Math.log(f2) - lon2*Math.log(f1) ) / Math.log(f2/f1);

  if (!isFinite(lon3)) lon3 = (lon1+lon2)/2; // parallel of latitude

  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

  return new exports.latlon(lat3.toDeg(), lon3.toDeg());
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
exports.latlon.prototype.lat = function(format, dp) {
  if (typeof format == 'undefined') return this.lat;

  return exports.toLat(this.lat, format, dp);
}

/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per toLon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
exports.latlon.prototype.lon = function(format, dp) {
  if (typeof format == 'undefined') return this.lng;

  return exports.toLon(this.lng, format, dp);
}

/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 */
exports.latlon.prototype.toString = function(format, dp) {
  if (typeof format == 'undefined') format = 'dms';

  return exports.toLat(this.lat, format, dp) + ', ' + exports.toLon(this.lng, format, dp);
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

/** Converts radians to numeric (signed) degrees */
if (typeof Number.prototype.toDeg == 'undefined') {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }
}

/**
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 *
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if (typeof Number.prototype.toPrecisionFixed == 'undefined') {
  Number.prototype.toPrecisionFixed = function(precision) {

    // use standard toPrecision method
    var n = this.toPrecision(precision);

    // ... but replace +ve exponential format with trailing zeros
    n = n.replace(/(.+)e\+(.+)/, function(n, sig, exp) {
      sig = sig.replace(/\./, '');       // remove decimal from significand
      l = sig.length - 1;
      while (exp-- > l) sig = sig + '0'; // append zeros from exponent
      return sig;
    });

    // ... and replace -ve exponential format with leading zeros
    n = n.replace(/(.+)e-(.+)/, function(n, sig, exp) {
      sig = sig.replace(/\./, '');       // remove decimal from significand
      while (exp-- > 1) sig = '0' + sig; // prepend zeros from exponent
      return '0.' + sig;
    });

    return n;
  }
}

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
  String.prototype.trim = function() {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}

},{}],3:[function(require,module,exports){
var Distance = require('../index');

QUnit.test( 'Filter a GPS track to ensure the filter works', function(assert) {
  var filtered = Distance.filter(data);

  var raw = Distance.mapToGoogle(data);
  var civilized = Distance.mapToGoogle(filtered);

  var rawDistance = Distance.computeDistance(raw);
  var filteredDistance = Distance.computeDistance(civilized);

  assert.equal(rawDistance, 103.89499999999998, 'Passed!');
  assert.equal(filteredDistance, 97.44399999999999, 'Passed!');
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

},{"../index":1}]},{},[3]);

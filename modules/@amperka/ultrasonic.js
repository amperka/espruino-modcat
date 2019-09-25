var C = {
  MAX_DISTANCE: 4,
  SOUND_SPEED: 340
};

C.MAX_ROUNDTRIP_MS = (1000 * C.MAX_DISTANCE * 2) / C.SOUND_SPEED;

function convertUnits(s, units) {
  if (units === undefined) {
    return s;
  }

  switch (units) {
    case 'm':
      return (s / 2) * C.SOUND_SPEED;
    case 'cm':
      return (s / 2) * C.SOUND_SPEED * 100;
    case 'mm':
      return (s / 2) * C.SOUND_SPEED * 1000;
    case 's':
      return s;
    case 'ms':
      return s * 1000;
    case 'us':
      return s * 1000000;
  }
}

/*
 *
 * Class Ultrasonic
 *
 */
var Ultrasonic = function(pins) {
  this._trigPin = pins.trigPin;
  this._echoPin = pins.echoPin;

  this._startTime = null;
  this._riseWatchID = null;
  this._fallWatchID = null;
  this._timeoutID = null;

  this._trigPin.mode('output');
  this._echoPin.mode('input');
};

Ultrasonic.prototype.ping = function(cb, units) {
  var self = this;

  if (self._timeoutID) {
    cb(new Error('busy'));
    return this;
  }

  this._riseWatchID = setWatch(
    function(e) {
      self._riseWatchID = null;
      // Roundtrip is measured between the moment
      // when echo line is set high and the moment
      // when it is returned to low state
      self._startTime = e.time;
      self._fallWatchID = setWatch(
        function(e) {
          self._fallWatchID = null;
          clearTimeout(self._timeoutID); // cancel error handling
          self._timeoutID = null;
          var roundtripTime = e.time - self._startTime;
          self._startTime = null;
          cb(null, convertUnits(roundtripTime, units));
        },
        self._echoPin,
        { edge: 'falling' }
      );
    },
    self._echoPin,
    { edge: 'rising' }
  );

  // Timeout for the cases when we're not getting echo back
  self._timeoutID = setTimeout(function() {
    self._timeoutID = null;
    if (self._riseWatchID) {
      // Sensor not even rised echo line
      clearWatch(self._riseWatchID);
      self._riseWatchID = null;
      cb(new Error('wrong connection'));
    } else {
      // Measure started, but we've got
      // no echo within maximum roundtrip time frame
      self._startTime = null;
      clearWatch(self._fallWatchID);
      self._fallWatchID = null;
      cb(new Error('timeout'));
    }
  }, C.MAX_ROUNDTRIP_MS);

  digitalPulse(self._trigPin, 1, 0.01);

  return this;
};

/*
 *
 * module exports
 *
 */
exports.connect = function(pins) {
  return new Ultrasonic(pins);
};

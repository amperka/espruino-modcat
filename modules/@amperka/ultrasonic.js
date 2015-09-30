
var C = {
  MAX_DISTANCE: 4,
  SOUND_SPEED: 340
};

C.MAX_ROUNDTRIP_MS = 1000 * C.MAX_DISTANCE * 2 / C.SOUND_SPEED;

function convertUnits(s, units) {
  if (units === undefined) {
    return s;
  }

  switch (units) {
    case 'm': return s / 2 * C.SOUND_SPEED;
    case 'cm': return s / 2 * C.SOUND_SPEED * 100;
    case 'mm': return s / 2 * C.SOUND_SPEED * 1000;
    case 's': return s;
    case 'ms': return s * 1000;
    case 'us': return s * 1000000;
  }
}

/*
*
* Class Ultrasonic
*
*/
var Ultrasonic = function(trigPin, echoPin) {
  this._trigPin = trigPin;
  this._echoPin = echoPin;

  this._startTime = null;
  this._watchID = null;
  this._timeoutID = null;

  this._trigPin.mode('output');
  this._echoPin.mode('input');
};

Ultrasonic.prototype.ping = function(cb, units) {
  var self = this;

  if (self._startTime) {
    cb(new Error('busy'));
    return this;
  }

  setWatch(function(e) {
    self._startTime = e.time;

    self._watchID = setWatch(function(e) {
      self._watchID = null;
      var roundtripTime = e.time - self._startTime;
      self._startTime = null;
      cb(null, convertUnits(roundtripTime, units));
    }, self._echoPin, {edge: 'falling'});

  }, self._echoPin, {edge: 'rising'});

  self._timeoutID = setTimeout(function() {
    self._timeoutID = null;
    if (!self._watchID) {
      return;
    }

    clearWatch(self._watchID);
    self._watchID = null;
    self._startTime = null;
    cb(new Error('timeout'));
  }, C.MAX_ROUNDTRIP_MS);

  digitalPulse(self._trigPin, 1, 0.01);

  return this;
};

/*
*
* module exports
*
*/
exports.connect = function(trigPin, echoPin) {
  return new Ultrasonic(trigPin, echoPin);
};

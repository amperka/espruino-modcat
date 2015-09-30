
// TODO: replace with require()
function lerp(k, from, to) {
  return from + k * (to - from);
}

function map(val, fromMin, fromMax, toMin, toMax, clip) {
  var k = (val - fromMin) / (fromMax - fromMin);
  val = lerp(k, toMin, toMax);
  if (clip) {
    val = E.clip(toMin, toMax);
  }

  return val;
}

var Servo = function(pin) {
  this._pin = pin;
  this._pulse = 1.5;
  this._intervalID = null;
  this._pin.mode('output');
};

Servo.prototype.C = {
  PULSE_MIN: 0.5,
  PULSE_MAX: 2.5,
  ANGLE_MIN: 0,
  ANGLE_MAX: 180
};

Servo.prototype.write = function(val, units) {
  units = units || 'deg';

  switch (units) {
    case 'deg':
      this._pulse = map(
        val, this.C.ANGLE_MIN, this.C.ANGLE_MAX,
      this.C.PULSE_MIN, this.C.PULSE_MAX);
      break;

    case 'ms':
      this._pulse = val;
      break;

    case 'us':
      this._pulse = val / 1000;
      break;
  }

  this._pulse = E.clip(this._pulse, this.C.PULSE_MIN, this.C.PULSE_MAX);
  this._update();
  return this;
};

Servo.prototype._update = function() {
  if (this._intervalID) {
    return;
  }

  var self = this;
  this._intervalID = setInterval(function() {
    digitalPulse(self._pin, 1, self._pulse);
  }, 20);
};

exports.connect = function(pin) {
  return new Servo(pin);
};

// Stepper object constructor
// @constructor
// @param {object} pins - an object with properties step, direction, enable of type Pin
// @param {Object} opts - an object with pps (speed) and holdPower (pwm) properties
var Stepper = function(pins, opts) {
  this._pins = pins;
  opts = opts || {};

  this._pps = opts.pps || 20;
  this._holdPower = opts.holdPower || 0;

  this._pins.step.mode('output');
  this._pins.enable.mode('output');
  this._pins.direction.mode('output');

  this.hold();

  this._intervalId = null;
};

// Adjusts the PWM power supply to the motor
// @param {float} power - PWM duty cycle from 0 to 1
Stepper.prototype.hold = function(power) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (typeof power === 'undefined') {
    power = this._holdPower;
  }

  analogWrite(this._pins.enable, power);
};

// Turns the shaft step by step, and then executes a callback.
// @param {number} steps - number of steps. If the value is negative, it moves backwards.
// @param {function} callback - function performed after turning the shaft
Stepper.prototype.rotate = function(steps, callback) {
  this.hold(1);

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0) {
    this._pins.direction.write(1);
    steps *= -1;
  } else {
    this._pins.direction.write(0);
  }

  var self = this;
  this._intervalId = setInterval(function() {
    if (steps > 0) {
      digitalPulse(self._pins.step, 1, 1);
      steps--;
    } else {
      self.hold();
      if (callback) {
        callback();
      }
    }
  }, 1000 / this._pps);
};

// Adjusts the number of steps per second
Stepper.prototype.pps = function(pps) {
  if (pps === undefined) return this._pps;
  this._pps = pps;
  return this;
};

// Resets the shaft holding value set during initialization
Stepper.prototype.holdPower = function(holdPower) {
  if (holdPower === undefined) return this._holdPower;
  this._holdPower = holdPower;
  return this;
};

// Exporting the Stepper Object Creation Function
// @param {object} pins - an object with properties step, direction, enable of type Pin
// @param {Object} opts - an object with pps (speed) and holdPower (pwm) properties
exports.connect = function(pins, opts) {
  return new Stepper(pins, opts);
};

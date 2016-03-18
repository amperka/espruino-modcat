var Motor = function(opts) {
  this._pinPWM = opts.pwm;
  this._pinPWM.mode('output');
  this._pinPhase = opts.phase;
  this._pinPhase.mode('output');
};

Motor.prototype.write = function(u) {
  u < 0 ? this._pinPhase.write(1) : this._pinPhase.write(0);
  var self = this;
  analogWrite(self._pinPWM, E.clip(Math.abs(u), 0, 1));
};

exports.MotorShield = {
  M1: {
    pwm: P5,
    phase: P4
  },
  M2: {
    pwm: P6,
    phase: P7
  }
};

exports.connect = function(pin) {
  return new Motor(pin);
};

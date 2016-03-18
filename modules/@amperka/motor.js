var Motor = function(opts) {
  this._pinPWM = opts.pwm;
  this._pinPWM.mode('output');
  this._pinPhase = opts.phase;
  this._pinPhase.mode('output');
  if (opts.prestart !== undefined) {
    this._prestart = opts.prestart;
  } else {
    this._prestart = 0.1;
  }
  this._current = 0;
};

Motor.prototype.write = function(u) {
  u < 0 ? this._pinPhase.write(1) : this._pinPhase.write(0);
  var self = this;
  var prestart = 0;
  if (( ((this._current<0 && u>0) || (this._current>0 && u<0)) || this._current === 0) && u !== 0){
    prestart = this._prestart;
    analogWrite(this._pinPWM, 1);
  }

  setTimeout(function() {
    analogWrite(self._pinPWM, E.clip(Math.abs(u), 0, 1));
  }, prestart*1000);
  this._current = u;
};

exports.MotorShield = {
  M1: {
    pwm: P5,
    phase: P4,
    prestart: 0.1
  },
  M2: {
    pwm: P6,
    phase: P7,
    prestart: 0.1
  }
};
exports.connect = function(pin) {
  return new Motor(pin);
};

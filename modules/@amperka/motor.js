var Motor = function(opts) {
  this._pwmPin = opts.pwmPin;
  this._pwmPin.mode('output');
  this._phasePin = opts.phasePin;
  this._phasePin.mode('output');
  if (opts.freq) {
    analogWrite(this._pwmPin, 0, { freq: opts.freq });
  }
};

Motor.prototype.write = function(u) {
  this._phasePin.write(u > 0);
  analogWrite(this._pwmPin, E.clip(Math.abs(u), 0, 1));
};

exports.MotorShield = {
  M1: {
    pwmPin: P5,
    phasePin: P4,
    freq: 100
  },
  M2: {
    pwmPin: P6,
    phasePin: P7,
    freq: 100
  }
};

exports.connect = function(pin) {
  return new Motor(pin);
};

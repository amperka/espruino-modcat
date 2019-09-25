var MultiServoDevice = function(i2c, address, pin, options) {
  this._i2c = i2c;
  this._address = address;
  this._pin = pin;

  this._freq = 50;
  this._pulseMin = 0.675;
  this._pulseMax = 2.325;
  this._valueMin = 0;
  this._valueMax = 180;

  if (options && options.pulseMin) {
    this._pulseMin = options.pulseMin;
  }
  if (options && options.pulseMax) {
    this._pulseMax = options.pulseMax;
  }
  if (options && options.valueMin) {
    this._valueMin = options.valueMin;
  }
  if (options && options.valueMax) {
    this._valueMax = options.valueMax;
  }

  this._period = 1000 / this._freq;
  this._valueStart = this._pulseMin * 1000;
  var pulsDiff = this._pulseMax - this._pulseMin;
  this._valueStep = (pulsDiff / (this._valueMax - this._valueMin)) * 1000;
};

MultiServoDevice.prototype.write = function(value, units) {
  var us = 1500;
  switch (units) {
    case 'us':
      us = E.clip(value, this._pulseMin * 1000, this._pulseMax * 1000);
      break;
    case 'ms':
      us = E.clip(value, this._pulseMin, this._pulseMax) * 1000;
      break;
    default:
      value = E.clip(value, this._valueMin, this._valueMax);
      us = this._valueStart + this._valueStep * (value - this._valueMin);
  }

  us = Math.floor(us);

  this._i2c.writeTo(this._address, [this._pin, us >> 8, us & 0xff]);
};

var MultiServo = function(i2c, address) {
  this._i2c = i2c || PrimaryI2C;
  this._address = address || 0x47;
};

MultiServo.prototype.connect = function(pin, options) {
  return new MultiServoDevice(this._i2c, this._address, pin, options);
};

exports.connect = function(i2c, address) {
  return new MultiServo(i2c, address);
};

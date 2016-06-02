var ServoHW = function(pin, options) {
  this._pin = pin;
  this._freq = 50;
  this._pulseMin = 0.675;
  this._pulseMax = 2.325;
  this._valueMin = 0;
  this._valueMax = 180;

  if (options && options.freq) {
    this._freq = options.freq;
  }
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
  this._valueStart = this._pulseMin / this._period;
  var pulsDiff = (this._pulseMax - this._pulseMin);
  this._valueStep = pulsDiff / (this._valueMax - this._valueMin) / this._period;

  this._dutyCycle = 0;
};

ServoHW.prototype.attach = function(activate) {
  if (activate === undefined || activate) {
    console.log('enable');
    analogWrite(this._pin, this._dutyCycle, {freq: this._freq});
  } else {
    console.log('disable');
    digitalWrite(this._pin, 0);
  }
  return this;
};

ServoHW.prototype.write = function(value, units) {
  if (value === false) {
    digitalWrite(this._pin, 0);
  }

  switch (units) {
    case 'us':
      value = E.clip(value, this._pulseMin * 1000, this._pulseMax * 1000);
      this._dutyCycle = (value / 1000) / this._period;
      break;
    case 'ms':
      value = E.clip(value, this._pulseMin, this._pulseMax);
      this._dutyCycle = value / this._period;
      break;
    default:
      value = E.clip(value, this._valueMin, this._valueMax);
      this._dutyCycle = this._valueStart + this._valueStep * (value - this._valueMin);
  }
  
  analogWrite(this._pin, this._dutyCycle, {freq: this._freq});

  return this;
};

exports.connect = function(pin, options) {
  return new ServoHW(pin, options);
};

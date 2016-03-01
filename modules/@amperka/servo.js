var ServoHW = function(pin, options) {
  this._pin = pin;
  
  options !== undefined && options.freq !== undefined ? this._freq = options.freq : this._freq = 50;
  
  options !== undefined && options.pulseMin !== undefined ? this._pulseMin = options.pulseMin : this._pulseMin = 0.675;
  options !== undefined && options.pulseMax !== undefined ? this._pulseMax = options.pulseMax : this._pulseMax = 2.325;
  options !== undefined && options.valueMin !== undefined ? this._valueMin = options.valueMin : this._valueMin = 0;
  options !== undefined && options.valueMax !== undefined ? this._valueMax = options.valueMax : this._valueMax = 180;

  this._period = 1000 / this._freq;
  this._valueStart = this._pulseMin / this._period;
  this._valueStep = ( this._pulseMax - this._pulseMin ) / ( this._valueMax - this._valueMin ) / this._period;

};
ServoHW.prototype.write = function(value, units) {
  switch(units) {
    case 'us':
      value = E.clip(value, this._pulseMin * 1000, this._pulseMax * 1000);
      analogWrite (this._pin, (value / 1000) / this._period, {freq: this._freq});
      break;
    case 'ms':
      value = E.clip(value, this._pulseMin, this._pulseMax);
      analogWrite (this._pin, value / this._period, {freq: this._freq});
      break;
    default:
      value = E.clip(value, this._valueMin, this._valueMax);
      analogWrite (this._pin, this._valueStart + this._valueStep * (value - this._valueMin), {freq: this._freq});
    };
};
exports.connect = function(pin, options) {
  return new ServoHW(pin, options);
};

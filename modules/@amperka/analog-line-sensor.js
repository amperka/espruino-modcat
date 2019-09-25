var AnalogLineSensor = function(pin) {
  this._pin = pin;
  this._pin.mode('analog');
  this._min = 0;
  this._max = 1;
};

AnalogLineSensor.prototype.read = function(units) {
  if (units === 'mV') {
    return analogRead(this._pin) * E.getAnalogVRef() * 1000;
  } else if (units === 'V') {
    return analogRead(this._pin) * E.getAnalogVRef();
  } else if (units === 'u') {
    return analogRead(this._pin);
  } else {
    var calibratedValue = analogRead(this._pin);
    if (this._min !== 0 || this._max !== 1) {
      calibratedValue = E.clip(
        (calibratedValue - this._min) / (this._max - this._min),
        0,
        1
      );
    }
    return calibratedValue;
  }
};

AnalogLineSensor.prototype.calibrate = function(opts) {
  if (opts && opts.white !== undefined) {
    this._min = opts.white === true ? analogRead(this._pin) : opts.white;
  }
  if (opts && opts.black !== undefined) {
    this._max = opts.black === true ? analogRead(this._pin) : opts.black;
  }
};

exports.connect = function(pin) {
  return new AnalogLineSensor(pin);
};

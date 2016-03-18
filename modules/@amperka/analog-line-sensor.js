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
    return E.clip(analogRead(this._pin), this._min, this._max);
  }
};

AnalogLineSensor.prototype.calibrate = function(opts) {
  if (opts && opts.white !== undefined) {
    opts.white === true ? this._min = analogRead(this._pin) : this._min = opts.white;
  }
  if (opts && opts.black !== undefined) {
    opts.black === true ? this._max = analogRead(this._pin) : this._max = opts.black;
  }
};


exports.connect = function(pin) {
  return new AnalogLineSensor(pin);
};

var Thermometer = function(pin) {
  this._pin = pin;
  this._pin.mode('analog');
};

Thermometer.prototype.read = function(units) {
  var val = analogRead(this._pin);
  if (typeof units === 'undefined') {
    return val;
  }

  var v = val * E.getAnalogVRef();

  switch (units) {
    case 'V':
      return v;
    case 'mV':
      return 1000 * v;
    case 'C':
      return v * 100 - 50;
  }
};

exports.connect = function(pin) {
  return new Thermometer(pin);
};

var LightSensor = function(pin) {
  this._pin = pin;
  this._pin.mode('analog');
};

LightSensor.prototype.C = {
  R_DIVIDER: 10.0, // constant resistor value
  LDR_10LUX: 14.0, // LDR resistance at 10 lux
  LDR_GAMMA: 0.6 // gamma slope (log10) K
};

LightSensor.prototype.read = function(units) {
  var val = analogRead(this._pin);
  if (typeof units === 'undefined') {
    return val;
  }

  switch (units) {
    case 'V':
      return val * E.getAnalogVRef();
    case 'mV':
      return 1000 * val * E.getAnalogVRef();
    case 'lx':
      var resistance = this.C.R_DIVIDER / (1.0 / val - 1);
      return (
        10.0 * Math.pow(this.C.LDR_10LUX / resistance, 1.0 / this.C.LDR_GAMMA)
      );
  }
};

exports.connect = function(pin) {
  return new LightSensor(pin);
};

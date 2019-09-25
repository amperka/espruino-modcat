var Pot = function(pin) {
  this._pin = pin;
  pin.mode('analog');
};

Pot.prototype.read = function() {
  return analogRead(this._pin);
};

exports.connect = function(pin) {
  return new Pot(pin);
};

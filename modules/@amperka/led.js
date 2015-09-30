
var Led = function(pin) {
  this._pin = pin;
  this._on = false;
  this._brightness = 1.0;

  this._pin.mode('output');
};

Led.prototype.toggle = function() {
  if (arguments.length === 0) {
    return this.toggle(!this._on);
  }

  this._on = !!arguments[0];
  this._update();

  return this;
};

Led.prototype.turnOn = function() {
  return this.toggle(true);
};

Led.prototype.turnOff = function() {
  return this.toggle(false);
};

Led.prototype.isOn = function() {
  return this._on;
};

Led.prototype.brightness = function(value) {
  if (arguments.length === 0) {
    return this._brightness;
  }

  value = Math.max(0.0, Math.min(value, 1.0));
  this._brightness = value;
  this._update();

  return this;
};

Led.prototype._update = function() {
  var b = this._brightness;
  analogWrite(this._pin, b * b * b * this._on, {freq: 100});
};

exports.connect = function(pin) {
  return new Led(pin);
};

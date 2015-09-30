
var Buzzer = function(pin) {
  this._pin = pin;
  this._on = false;
  this._frequency = 2000;

  this._pin.mode('output');
};

Buzzer.prototype.toggle = function() {
  if (arguments.length === 0) {
    return this.toggle(!this._on);
  }

  this._on = !!arguments[0];
  this._update();

  return this;
};

Buzzer.prototype.turnOn = function() {
  return this.toggle(true);
};

Buzzer.prototype.turnOff = function() {
  return this.toggle(false);
};

Buzzer.prototype.isOn = function() {
  return this._on;
};

Buzzer.prototype.frequency = function() {
  if (arguments.length === 0) {
    return this._frequency;
  }

  this._frequency = Math.clip(arguments[0], 0.0, 20000.0);
  this._update();

  return this;
};

Buzzer.prototype._update = function() {
  analogWrite(this._pin, 0.5 * this._on, {freq: this._frequency});
};

exports.connect = function(pin) {
  return new Buzzer(pin);
};

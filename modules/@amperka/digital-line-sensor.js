var DigitalLineSensor = function(pin) {
  this._pin = pin;
  this._pin.mode('input');
  setWatch(DigitalLineSensor.prototype._watch, this._pin, {repeat: true});
};

DigitalLineSensor.prototype.read = function() {
  return this._pin.read() ? 'black' : 'white';
};

DigitalLineSensor.prototype._watch = function(e) {
  this.emit(e.state ? 'black' : 'white');
};

exports.connect = function(pin) {
  return new DigitalLineSensor(pin);
};

var DigitalLineSensor = function(pin) {
  this._pin = pin;
  this._pin.mode('input');
  var self = this;
  setWatch(
    function(e) {
      self.emit(e.state ? 'black' : 'white');
    },
    this._pin,
    {
      repeat: true,
      edge: 'both',
      debounce: 10
    }
  );
};

DigitalLineSensor.prototype.read = function() {
  return this._pin.read() ? 'black' : 'white';
};

exports.connect = function(pin) {
  return new DigitalLineSensor(pin);
};

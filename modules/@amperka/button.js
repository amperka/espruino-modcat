
var Button = function(pin) {
  this._pin = pin;
  this._pin.mode('input');

  this._watch();
};

Button.prototype.read = function() {
  return this._pin.read() ? 'up' : 'down';
};

Button.prototype._watch = function() {
  var onChange = function(e) {
    this.emit(e.state ? 'up' : 'down');
  };

  setWatch(onChange.bind(this), this._pin, {
    repeat: true,
    edge: 'both',
    debounce: 10
  });
};

exports.connect = function(pin) {
  return new Button(pin);
};

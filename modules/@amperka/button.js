
var Button = function(pin, opts) {
  this._pin = pin;
  this._pin.mode('input');

  this._holdTime = opts ? opts.holdTime : null;
  this._holdTimeoutID = null;

  this._watch();
};

Button.prototype.read = function() {
  return this._pin.read() ? 'up' : 'down';
};

Button.prototype._watch = function() {
  setWatch(this._onChange.bind(this), this._pin, {
    repeat: true,
    edge: 'both',
    debounce: 10
  });
};

Button.prototype._onChange = function(e) {
  var pressed = !e.state;
  var self = this;

  if (this._holdTime && pressed) {
    // emit hold event after timeout specified in options
    this._holdTimeoutID = setTimeout(function() {
      self.emit('hold');
      self._holdTimeoutID = null;
    }, this._holdTime * 1000);
  } else if (!pressed) {
    // emit click only if hold was not already emitted
    if (this._holdTimeoutID) {
      clearTimeout(this._holdTimeoutID);
      this._holdTimeoutID = null;
      this.emit('click');
    }
  }

  this.emit(pressed ? 'press' : 'release');
};

exports.connect = function(pin, opts) {
  return new Button(pin, opts);
};

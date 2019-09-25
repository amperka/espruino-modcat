var Button = function(pin, opts) {
  opts = opts || {};
  this._pin = pin;

  this._normalSignal = opts.normalSignal === 0 ? 0 : 1;
  this._pin.mode(this._normalSignal ? 'input_pullup' : 'input_pulldown');

  this._holdTime = opts.holdTime || 1;
  this._holdTimeoutID = null;

  var debounce = opts.debounce === undefined ? 10 : opts.debounce;
  setWatch(this._onChange.bind(this), this._pin, {
    repeat: true,
    edge: 'both',
    debounce: debounce
  });
};

/* Deprecated: use `isPressed` intead */
Button.prototype.read = function() {
  return this.isPressed() ? 'down' : 'up';
};

Button.prototype.isPressed = function() {
  return this._pin.read() !== !!this._normalSignal;
};

Button.prototype._onChange = function(e) {
  var pressed = this._normalSignal === 0 ? e.state : !e.state;
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

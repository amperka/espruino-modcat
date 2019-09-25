var WaterLevel = function(pin, opts) {
  this._pin = pin;

  this._pin.mode('input_pullup');

  opts = opts || {};

  this._mountedOnTop = opts.mounted === 'onTop';
  this._debounce = opts.debounce ? opts.debounce * 1000 : 3000;
  this._toggleTimerID = null;

  this._watch();
};

WaterLevel.prototype.read = function() {
  if (this._mountedOnTop) {
    return this._pin.read() ? 'up' : 'down';
  } else {
    return this._pin.read() ? 'down' : 'up';
  }
};

WaterLevel.prototype._watch = function() {
  setWatch(this._onChange.bind(this), this._pin, {
    repeat: true,
    edge: 'both'
  });
};

WaterLevel.prototype._onChange = function(e) {
  if (this._toggleTimerID == null) {
    var prevState = e.state;
    var self = this;
    this._toggleTimerID = setTimeout(function() {
      if (self._pin.read() === prevState) {
        if (self._mountedOnTop) {
          self.emit(prevState ? 'up' : 'down');
        } else {
          self.emit(prevState ? 'down' : 'up');
        }
      }
      clearTimeout(self._toggleTimerID);
      self._toggleTimerID = null;
    }, this._debounce);
  }
};

exports.connect = function(pin, opts) {
  return new WaterLevel(pin, opts);
};

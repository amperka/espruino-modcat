var Animation = function(opts) {
  opts = opts || {};
  this._high = opts.high || 0;
  this._low = opts.low || 0;
  this._inLowState = true;
  this._playing = false;
  this._timeoutID = null;
};

Animation.prototype.toggle = function() {
  if (!arguments.length) {
    return this.toggle(!this._playing);
  }

  this._playing = !!arguments[0];
  if (this._timeoutID && !this._playing) {
    clearTimeout(this._timeoutID);
    this._timeoutID = null;
  } else if (!this._timeoutID && this._playing) {
    this._setTimeout();
  }

  return this;
};

Animation.prototype.play = function() {
  return this.toggle(true);
};

Animation.prototype.stop = function() {
  return this.toggle(false);
};

Animation.prototype.setup = function(opts) {
  this._high = opts.high || 0;
  this._low = opts.low || 0;
  return this;
};

Animation.prototype._setTimeout = function() {
  if (!this._high && !this._low) {
    return;
  }

  var t = this._inLowState ? this._low : this._high;
  var self = this;
  this._timeoutID = setTimeout(function() {
    self._inLowState = !self._inLowState;
    self.emit('change', self._inLowState ? 'low' : 'high');
    self._timeoutID = null;
    self._setTimeout();
  }, t * 1000);
};

exports.create = function(opts) {
  return new Animation(opts);
};

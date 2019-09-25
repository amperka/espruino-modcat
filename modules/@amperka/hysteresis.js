var C = {
  HIGH: 1,
  BETWEEN: 0,
  LOW: -1
};

var Hysteresis = function(opts) {
  this._low = opts.low !== undefined ? opts.low : opts.high;
  this._high = opts.high !== undefined ? opts.high : opts.low;
  this._lowLag = opts.lowLag || 0;
  this._highLag = opts.highLag || 0;
  this._lagStart = 0;
  this._state = C.BETWEEN;
  this._stable = false;
};

Hysteresis.prototype.push = function(val) {
  var newState =
    val > this._high ? C.HIGH : val < this._low ? C.LOW : C.BETWEEN;

  var t = getTime();
  var dt = t - this._lagStart;
  if (newState === this._state) {
    if (this._stable) {
      return this;
    }

    if (this._state === C.HIGH && dt > this._highLag) {
      this._stabilize('high');
    } else if (this._state === C.LOW && dt > this._lowLag) {
      this._stabilize('low');
    }
  } else {
    this._state = newState;
    this._lagStart = t;
    this._stable = false;
  }

  return this;
};

Hysteresis.prototype._stabilize = function(val) {
  this.emit(val);
  this.emit('change', val);
  this._stable = true;
};

exports.create = function(opts) {
  return new Hysteresis(opts);
};

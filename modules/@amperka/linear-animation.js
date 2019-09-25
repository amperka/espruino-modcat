function lerp(k, from, to) {
  return from + k * (to - from);
}

var Animation = function(opts) {
  opts = opts || {};
  this._from = opts.from || 0;
  this._to = opts.to === undefined ? 1 : opts.to;
  this._period = opts.period || 1;
  this._updateInterval = opts.updateInterval || 0.01;
  this._intervalID = null;
  this._startTime = null;
};

Animation.prototype.toggle = function() {
  if (!arguments.length) {
    return this.toggle(!this._playing);
  }

  var on = !!arguments[0];
  if (on && !this._intervalID) {
    this._setInterval();
  } else if (!on && this._intervalID) {
    clearInterval(this._intervalID);
    this._intervalID = null;
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

Animation.prototype._setInterval = function() {
  this._startTime = getTime();
  this._update();
  this._intervalID = setInterval(
    this._update.bind(this),
    this._updateInterval * 1000
  );
};

Animation.prototype._update = function() {
  var dt = getTime() - this._startTime;
  var mod = Math.wrap(dt, this._period);
  var k = mod / this._period;
  var val = lerp(k, this._from, this._to);
  this.emit('update', val);
};

exports.create = function(opts) {
  return new Animation(opts);
};

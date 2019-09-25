// TODO: extract to library
function lerp(k, from, to) {
  return from + k * (to - from);
}

// TODO: extract to library
var extend = function(obj) {
  var length = arguments.length;
  if (length < 2 || obj == null) {
    return obj;
  }

  for (var index = 1; index < length; index++) {
    var source = arguments[index],
      keys = Object.keys(source),
      l = keys.length;
    for (var i = 0; i < l; i++) {
      var key = keys[i];
      obj[key] = source[key];
    }
  }
  return obj;
};

var defaultTransition = {
  from: 0,
  to: 1,
  duration: 1,
  updateInterval: 0.01,
  loop: false
};

var Animation = function(transition) {
  var trans = extend({}, defaultTransition, transition || {});
  this._queue = [trans];
  this._qi = 0;
  this._phase = 0;
  this._intervalID = null;
  this._lastUpdate = null;
  this._reversed = false;
};

Animation.prototype.queue = function(transition) {
  if (transition.from === undefined) {
    transition.from = this._queue[this._queue.length - 1].to || 0;
  }
  var trans = extend({}, this._queue[this._queue.length - 1], transition || {});
  this._queue.push(trans);
  return this;
};

Animation.prototype.play = function() {
  if (!this._intervalID) {
    this._setInterval();
  }

  return this;
};

Animation.prototype.reverse = function() {
  this._reversed = !this._reversed;
  return this;
};

Animation.prototype.stop = function(skip) {
  if (this._reversed) {
    this._phase = 0;
    this._qi = 0;
    if (skip !== false) {
      this.emit('update', this._queue[this._qi].from);
    }
  } else {
    this._phase = 1;
    this._qi = this._queue.length - 1;
    if (skip !== false) {
      this.emit('update', this._queue[this._qi].to);
    }
  }

  this._clearInterval();
  return this;
};

Animation.prototype._setInterval = function() {
  this._lastUpdate = getTime();
  this._update();
  this._intervalID = setInterval(
    this._update.bind(this),
    this._queue[this._qi].updateInterval * 1000
  );
};

Animation.prototype._clearInterval = function() {
  if (this._intervalID) {
    clearInterval(this._intervalID);
    this._intervalID = null;
  }
};

Animation.prototype._update = function() {
  var t = getTime();
  var dt = t - this._lastUpdate;
  this._lastUpdate = t;

  var trans = this._queue[this._qi];
  var dphase = dt / trans.duration;
  var phase = this._reversed ? 1 - this._phase : this._phase;
  var qlast = this._queue.length - 1;
  var qi = this._reversed ? qlast - this._qi : this._qi;
  phase += dphase;
  var animationCompleted = false;
  var qiChanged = false;
  if (phase > 1) {
    // phase overflow
    if (trans.loop) {
      // we're in loop transition, just wrap around
      phase -= Math.floor(phase);
    } else if (this._qi < qlast) {
      // we have subsequent transition
      phase -= Math.floor(phase);
      ++qi;
      qiChanged = true;
    } else {
      // animation completed
      phase = 1;
      animationCompleted = true;
      this._clearInterval();
    }
  }

  this._phase = this._reversed ? 1 - phase : phase;
  this._qi = this._reversed ? qlast - qi : qi;
  if (qiChanged) {
    trans = this._queue[this._qi];
    changeInterval(
      this._intervalID,
      this._queue[this._qi].updateInterval * 1000
    );
  }

  var val = lerp(this._phase, trans.from, trans.to);
  this.emit('update', val);
  if (animationCompleted) {
    this._phase = this._reversed ? 1 : 0;
    this._qi = this._reversed ? this._queue.length - 1 : 0;
  }
};

exports.create = function(transition) {
  return new Animation(transition);
};

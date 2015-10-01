
// TODO: extract to library
function lerp(k, from, to) {
  return from + k * (to - from);
}

// TODO: extract to library
var extend = function(obj) {
  var length = arguments.length;
  if (length < 2 || obj == null) return obj;
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
  updateInterval: 0.01
};

var Animation = function(target, transition) {
  this._target = target;
  var trans = extend({}, defaultTransition, transition || {});
  this._queue = [trans];
  this._qi = 0;
  this._intervalID = null;
  this._startTime = null;
};

Animation.prototype.queue = function(transition) {
  var trans = extend(
    {}, this._queue[this._queue.length - 1], transition || {})
  this._queue.push(trans);
};

Animation.prototype.play = function() {
  if (!this._intervalID) {
    this._setInterval();
  }
};

Animation.prototype._setInterval = function() {
  this._startTime = getTime();
  this._update();
  this._intervalID = setInterval(
    this._update.bind(this),
    this._queue[this._qi].updateInterval * 1000);
};

Animation.prototype._update = function() {
  var trans = this._queue[this._qi];
  var dt = getTime() - this._startTime;
  var mod = Math.wrap(dt, trans.duration);
  var k = mod / trans.duration;
  var val = lerp(k, trans.from, trans.to);
  this._target(val);
};

exports.create = function(opts) {
  return new Animation(opts);
};


var Timer = function(interval) {
  this._interval = interval;
  this._intervalID = null;
};

Timer.prototype.isRunning = function() {
  return !!this._intervalID;
}

Timer.prototype.run = function() {
  if (this.isRunning()) return;
  var self = this;
  this._intervalID = setInterval(
    this.emit.bind(this, 'tick'),
    this._interval * 1000);

  return this;
};

Timer.prototype.stop = function() {
  if (this.isRunning()) {
    clearInterval(this._intervalID);
    this._intervalID = null;
  }

  return this;
};

Timer.prototype.tick = function() {
  this.reset().emit('tick');
  return this;
};

Timer.prototype.reset = function() {
  if (this.isRunning()) this.stop().run();
  return this;
};

exports.create = function(interval) {
  return new Timer(interval);
};

var Timer = function(interval) {
  this._interval = interval;
  this._intervalID = null;
};

Timer.prototype.isRunning = function() {
  return !!this._intervalID;
};

Timer.prototype.run = function() {
  if (this.isRunning()) {
    return this;
  }

  this._intervalID = setInterval(
    this.emit.bind(this, 'tick'),
    this._interval * 1000
  );

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
  if (this.isRunning()) {
    this.stop().run();
  }

  return this;
};

Timer.prototype.interval = function(val, units) {
  if (!val) {
    return this._interval;
  }
  switch (units) {
    case 'ms':
      this._interval = val / 1000;
      break;
    case 'm':
      this._interval = val * 60;
      break;
    default:
      this._interval = val;
  }
  if (this.isRunning()) {
    changeInterval(this._intervalID, this._interval * 1000);
  }
};

exports.create = function(interval) {
  return new Timer(interval);
};

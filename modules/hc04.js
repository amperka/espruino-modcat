var HC04 = function(opts) {
  opts = opts || {};
  this._echo = opts.echo;
  this._trigger = opts.trigger;
};

HC04.prototype.read = function(callback, units) {
  if (!this._trigger) {
    return new Error('Trigger pin is not selected');
  }
  if (!this._echo) {
    return new Error('Echo pin is not selected');
  }
  if (!callback) {
    return new Error('No callback for result');
  }

  var id = setWatch(function(info) {
    if (!info.state) {
      clearWatch(id);
      var result = info.time - info.lastTime;
      switch (units) {
        case 'mm':
          result = result / 2 * 340 * 1000;
          break;
        case 'sm':
          result = result / 2 * 340 * 100;
          break;
        case 'm':
          result = result / 2 * 340;
          break;
        case 'ms':
          result = result * 1000;
          break;
        case 'us':
          result = result * 1000000;
          break;
      }
      callback(result);
    }
  }, this._echo, {
    edge: 'both',
    repeat: true
  });
  digitalPulse(this._trigger, 1, 0.01);
};

exports.connect = function(opts) {
  return new HC04(opts);
};

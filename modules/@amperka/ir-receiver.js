var C = {
  REPEAT_CODE: 1
};

var KEY_CODES = {
  POWER: 378130479,
  MINUS: 378134559,
  PLUS: 378132519,
  RED: 378077439,
  GREEN: 378126399,
  BLUE: 378110079,
  CROSS: 378114159,
  SQUARE: 378118239,
  TRIANGLE: 378093759,
  TOP_LEFT: 378097839,
  TOP: 378101919,
  TOP_RIGHT: 378099879,
  LEFT: 378081519,
  PLAY: 378091719,
  RIGHT: 378116199,
  BOTTOM_LEFT: 378083559,
  BOTTOM: 378124359,
  BOTTOM_RIGHT: 378085599,
  X: 378089679,
  Y: 378122319,
  Z: 378105999
};

var Receiver = function(pin, opts) {
  this._pin = pin;
  this._currentCode = 0;
  this._lastCode = 0;
  this._timeoutID = null;

  opts = opts || {};
  this._controller = opts.controller || 'amperka';
  this.keys = null;
  if (this._controller === 'amperka') {
    this.keys = KEY_CODES;
  } else {
    this.keys = opts.keys;
  }

  this._pin.mode('input_pullup');
  this._watch();
};

Receiver.prototype._watch = function() {
  setWatch(this._onPulse.bind(this), this._pin, {
    repeat: true,
    edge: 'falling'
  });

  return this;
};

Receiver.prototype._onPulse = function(e) {
  var self = this;
  var dt = e.time - e.lastTime;

  if (this._timeoutID !== null) {
    clearTimeout(this._timeoutID);
    this._timeoutID = null;
  }

  if (dt > 0.04) {
    this._complete();
  } else {
    this._currentCode = (this._currentCode << 1) | +(dt > 0.0008);
    this._timeoutID = setTimeout(function() {
      self._timeoutID = null;
      self._complete();
    }, 50);
  }
};

Receiver.prototype._complete = function() {
  if (!this._currentCode) {
    return;
  }

  if (this._currentCode === C.REPEAT_CODE) {
    this.emit('receive', this._lastCode, true);
  } else {
    this.emit('receive', this._currentCode, false);
    this._lastCode = this._currentCode;
  }

  this._currentCode = 0;
};

exports.connect = function(pin, opts) {
  return new Receiver(pin, opts);
};

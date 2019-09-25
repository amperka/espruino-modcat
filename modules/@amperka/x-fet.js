var defaultOpts = {
  cs: P8,
  spi: SPI2,
  qtyMod: 1
};
//
var X_fet = function(opts) {
  if (typeof opts === 'number') {
    defaultOpts.cs = opts;
  }
  opts = this.extend(defaultOpts, opts || {});
  this._spi = opts.spi;
  this._cs = opts.cs;
  this._qtyMod = opts.qtyMod;
  this._valuePins = [];
  this._blinkOnTime = [];
  this._blinkOffTime = [];
  this._blinkTimeoutID = [];
  for (var i = 0; i < this._qtyMod; i++) {
    this._valuePins[i] = 0;
    this._blinkOnTime[i] = [0, 0, 0, 0, 0, 0, 0, 0];
    this._blinkOffTime[i] = [0, 0, 0, 0, 0, 0, 0, 0];
    this._blinkTimeoutID[i] = [0, 0, 0, 0, 0, 0, 0, 0];
  }
  this._spi.send(this._valuePins, this._cs);
};

X_fet.prototype.extend = function(obj) {
  var length = arguments.length;
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

X_fet.prototype.turnOn = function(pin, numMod) {
  numMod |= 0;
  this._mask = this._getMask(pin);
  this._clearBlink(pin, numMod);
  this._valuePins[this._valuePins.length - numMod - 1] |= this._mask;
  this._spi.send(this._valuePins, this._cs);
};

X_fet.prototype.turnOff = function(pin, numMod) {
  numMod |= 0;
  this._mask = this._getMask(pin);
  this._clearBlink(pin, this._numMod);
  this._valuePins[this._valuePins.length - numMod - 1] &= ~this._mask;
  this._spi.send(this._valuePins, this._cs);
};

X_fet.prototype.toggle = function(pin, numMod) {
  numMod |= 0;
  this._mask = this._getMask(pin);
  this._clearBlink(pin, numMod);
  this._valuePins[this._valuePins.length - numMod - 1] ^= this._mask;
  this._spi.send(this._valuePins, this._cs);
};

X_fet.prototype.turnAllOff = function(numMod) {
  this._setAllpins(0, numMod);
};

X_fet.prototype.turnAllOn = function(numMod) {
  this._setAllpins(255, numMod);
};

X_fet.prototype._setAllpins = function(value, numMod) {
  var i;
  if (Array.isArray(numMod)) {
    for (i = 0; i < numMod.length; i++) {
      this._clearAllBlink(i);
      this._valuePins[this._valuePins.length - numMod[i] - 1] = value;
    }
  } else if (typeof numMod === 'number') {
    numMod |= 0;
    this._clearAllBlink(numMod);
    this._valuePins[this._valuePins.length - numMod - 1] = value;
  } else {
    for (i = 0; i < this._qtyMod; i++) {
      this._clearAllBlink(i);
      this._valuePins[this._valuePins.length - i - 1] = value;
    }
  }
  this._spi.send(this._valuePins, this._cs);
};

X_fet.prototype._getMask = function(pin) {
  if (Array.isArray(pin)) {
    var mask = 0;
    for (var i = 0; i < pin.length; i++) {
      mask |= 1 << pin[i];
    }
  } else {
    mask = 1 << pin;
  }
  return mask;
};

X_fet.prototype.blink = function(pin, numMod, onTime, offTime) {
  if (Array.isArray(pin)) {
    for (var i = 0; i < pin.length; i++) {
      this._blinkPin(pin[i], numMod, onTime, offTime);
    }
  } else {
    this._blinkPin(pin, numMod, onTime, offTime);
  }
};

X_fet.prototype._blinkPin = function(pin, numMod, onTime, offTime) {
  if (
    this._blinkOnTime[numMod][pin] === onTime &&
    this._blinkOffTime[numMod][pin] &&
    this._blinkOffTime[numMod][pin] === offTime
  ) {
    return;
  }
  this._clearBlinkPin(pin, numMod);
  this._blinkOnTime[numMod][pin] = onTime;
  this._blinkOffTime[numMod][pin] = offTime;

  if (this._isOn(pin, numMod)) {
    this._blinkOff(pin, numMod);
  } else {
    this._blinkOn(pin, numMod);
  }
};

X_fet.prototype._isOn = function(pin, numMod) {
  var mask = 1 << pin;
  numMod |= 0;
  if ((this._valuePins[this._valuePins.length - numMod - 1] & mask) > 0) {
    return true;
  } else {
    return false;
  }
};

X_fet.prototype._clearAllBlink = function(numMod) {
  for (var i = 0; i < 8; i++) {
    this._clearBlinkPin(i, numMod);
  }
};

X_fet.prototype._clearBlink = function(pin, numMod) {
  if (Array.isArray(pin)) {
    for (var i = 0; i < pin.length; i++) {
      this._clearBlinkPin(pin[i], numMod);
    }
  } else {
    this._clearBlinkPin(pin, numMod);
  }
};

X_fet.prototype._clearBlinkPin = function(pin, numMod) {
  if (this._blinkTimeoutID[numMod][pin]) {
    clearTimeout(this._blinkTimeoutID[numMod][pin]);
    this._blinkTimeoutID[numMod][pin] = null;
    this._blinkOnTime[numMod][pin] = 0;
    this._blinkOffTime[numMod][pin] = 0;
  }
};

X_fet.prototype._blinkOn = function(pin, numMod) {
  this._update(pin, numMod);
  this._blinkTimeoutID[numMod][pin] = setTimeout(
    this._blinkOff.bind(this, pin, numMod),
    this._blinkOnTime[numMod][pin] * 1000
  );
};

X_fet.prototype._blinkOff = function(pin, numMod) {
  this._update(pin, numMod);

  if (this._blinkOffTime[numMod][pin]) {
    this._blinkTimeoutID[numMod][pin] = setTimeout(
      this._blinkOn.bind(this, pin, numMod),
      this._blinkOffTime[numMod][pin] * 1000
    );
  } else {
    this._blinkTimeoutID[numMod][pin] = null;
  }
};

X_fet.prototype._update = function(pin, numMod) {
  numMod |= 0;
  this._mask = this._getMask(pin);
  this._valuePins[this._valuePins.length - numMod - 1] ^= this._mask;
  this._spi.send(this._valuePins, this._cs);
};

exports.connect = function(opts) {
  return new X_fet(opts);
};

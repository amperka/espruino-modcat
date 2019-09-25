var Octoliner = function(opts) {
  opts = opts || {};
  if (opts.i2c === undefined) {
    I2C1.setup({
      sda: SDA,
      scl: SCL,
      bitrate: 100000
    });
    opts.i2c = I2C1;
  }
  this.expander = require('@amperka/gpio-expander').connect(opts);
  this.expander.pwmFreq(60000);
  this._sensePin = 0;
  this._ledBrightnessPin = 9;
  this._sensorPinMap = [4, 5, 6, 8, 7, 3, 2, 1];
  this._lineState = [];
  this.setSensitivity(0.91);
  this.setBrightness(1);
};

Octoliner.prototype.setSensitivity = function(sense) {
  this.expander.analogWrite(this._sensePin, sense);
};

Octoliner.prototype.setBrightness = function(brightness) {
  this.expander.analogWrite(this._ledBrightnessPin, brightness);
};

Octoliner.prototype.analogRead = function(sensor) {
  sensor &= 0x07;
  return this.expander.analogRead(this._sensorPinMap[sensor]);
};

Octoliner.prototype.digitalRead = function(sensor) {
  sensor &= 0x07;
  return this.expander.digitalRead(this._sensorPinMap[sensor]);
};

Octoliner.prototype.changeAddr = function(nAddr) {
  this.expander.changeAddr(nAddr);
};

Octoliner.prototype.saveAddr = function() {
  this.expander.saveAddr();
};

Octoliner.prototype.getBinaryLine = function(treshold) {
  treshold = treshold || 0.5;
  var result = 0;
  for (var i = 0; i < 8; ++i) {
    var value = this.analogRead(i);
    if (treshold < value) result |= 1 << i;
  }
  return result;
};

Octoliner.prototype.mapLine = function(Line) {
  var sum = 0;
  var avg = 0;
  var weight = [4, 3, 2, 1, -1, -2, -3, -4];
  var i;
  if (Array.isArray(Line)) {
    for (i = 0; i < 8; i++) {
      sum += Line[i];
      avg += Line[i] * weight[i];
    }
    if (sum != 0) {
      return avg / sum / 4.0;
    }
    return 0;
  } else {
    this._lineState = [];
    for (i = 0; i < 8; i++) {
      var mask = 1 << i;
      if (Line & mask) {
        this._lineState[i] = 1;
      } else {
        this._lineState[i] = 0;
      }
    }
    return this.mapLine(this._lineState);
  }
};

Octoliner.prototype.reset = function() {
  this.expander.reset();
};

exports.connect = function(opts) {
  return new Octoliner(opts);
};

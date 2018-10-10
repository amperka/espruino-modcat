var Octoliner = function(opts) {
  opts = opts || {};
  this.expander = require("@amperka/gpio-expander").connect(opts);
  this.expander.pwmFreq(60000);
  this._sensePin = 0;
  this._ledBrightnessPin = 9;
  this._sensorPinMap = [4, 5, 6, 8, 7, 3, 2, 1];
  this._lineState = [];
  this.setSensitivity(0.8);
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

Octoliner.prototype.digitalRead = function(sensor){
  sensor &= 0x07;
  return this.expander.digitalRead(this._sensorPinMap[sensor]);
};

Octoliner.prototype.changeAddr = function(nAddr) {
  this.expander.changeAddr(nAddr);
};

Octoliner.prototype.saveAddr = function(){
  this.expander.saveAddr();
};

Octoliner.prototype.getBinaryLine = function(treshold) {
  treshold = treshold || 0.5;
  var result = 0;
  for (var i = 0; i < 8; ++i) {
    var value = this.analogRead(i);
    if (treshold < value)
      result |= 1 << i;
  }
  return result;
};

Octoliner.prototype.mapLine = function(binaryLine) {
  var sum = 0;
  var avg = 0;
  var weight = [4, 3, 2, 1, -1, -2, -3, -4];
  if (Array.isArray(binaryLine)) {
    for (var i = 0; i < 8; i++) {
      if (binaryLine[i]) {
        sum += binaryLine[i];
        avg += binaryLine[i] * weight[i];
      }
    }
    if (sum != 0) {
      return avg / sum / 4.0;
    }
      return 0;
  } else {
    this._lineState = [];
    for (var i = 0; i < 8; i++) {
      var mask = 1 << i;
      if (binaryLine & mask) {
        this._lineState[i] = 1;
      }
    }
    return this.mapLine(this._lineState);
  }
};

Octoliner.prototype.reset = function(){
  this.expander.reset();
};

exports.connect = function(opts) {
  return new Octoliner(opts);
};

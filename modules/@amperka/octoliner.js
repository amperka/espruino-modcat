var Octoliner = function (opts) {
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
  this.expander.analogWrite(this._ledBrightnessPin, 1);
  this._sensorPinMap = [4, 5, 6, 8, 7, 3, 2, 1];
  this._lineState = [];
  this.setSensitivity(0.91);
  this.mapPatternToLine = this.defaultMapPatternToLine;
  this.mapAnalogToPattern = this.defaultMapAnalogToPattern;
};

Octoliner.prototype.setSensitivity = function (sense) {
  this.expander.analogWrite(this._sensePin, sense);
};

// deprecated
Octoliner.prototype.setBrightness = function (brightness) {};

Octoliner.prototype.analogRead = function (sensor) {
  return this.expander.analogRead(this._sensorPinMap[sensor & 0x07]);
};

Octoliner.prototype.analogReadAll = function (analogArray) {
  for (var i = 0; i < 8; i++) {
    analogArray[i] = this.analogRead(_sensorPinMap[i]);
  }
}

Octoliner.prototype.digitalReadAll = function () {
  var pattern = [0, 0, 0, 0, 0, 0, 0, 0];
  this.analogReadAll(pattern);
  return this.mapAnalogToPattern(pattern);
}

Octoliner.prototype.changeAddr = function (nAddr) {
  this.expander.changeAddr(nAddr);
};

Octoliner.prototype.saveAddr = function () {
  this.expander.saveAddr();
};

Octoliner.prototype.getBinaryLine = function (treshold) {
  treshold = treshold || 0.5;
  var result = 0;
  for (var i = 0; i < 8; ++i) {
    var value = this.analogRead(i);
    if (treshold < value) result |= 1 << i;
  }
  return result;
};

// deprecated
Octoliner.prototype.mapLine = function (analogArray) {
  return this.trackLine(analogArray);
}

Octoliner.prototype.reset = function () {
  this.expander.reset();
};

Octoliner.prototype.defaultMapAnalogToPattern = function (analogArray) {
  var pattern = 0;
  // search min and max values
  var min = 32767;
  var max = 0;
  for (var i = 0; i < 8; i++) {
      if (analogArray[i] < min)
          min = analogArray[i];
      if (analogArray[i] > max)
          max = analogArray[i];
  }
  // calculate threshold level
  var threshold = min + (max - min) / 2;
  // create bit pattern
  for (var i = 0; i < 8; i++) {
      pattern = (pattern << 1) + ((analogArray[i] < threshold) ? 0 : 1);
  }
  return pattern;
}

Octoliner.prototype.defaultMapPatternToLine = function (pattern) {
  switch (pattern) {
    case 0x18 /*0b00011000*/:
      return 0;
    case 0x10 /*0b00010000*/:
      return 0.25;
    case 0x38 /*0b00111000*/:
      return 0.25;
    case 0x08 /*0b00001000*/:
      return -0.25;
    case 0x1c /*0b00011100*/:
      return -0.25;
    case 0x30 /*0b00110000*/:
      return 0.375;
    case 0x0c /*0b00001100*/:
      return -0.375;
    case 0x20 /*0b00100000*/:
      return 0.5;
    case 0x70 /*0b01110000*/:
      return 0.5;
    case 0x04 /*0b00000100*/:
      return -0.5;
    case 0x0e /*0b00001110*/:
      return -0.5;
    case 0x60 /*0b01100000*/:
      return 0.625;
    case 0xe0 /*0b11100000*/:
      return 0.625;
    case 0x06 /*0b00000110*/:
      return -0.625;
    case 0x07 /*0b00000111*/:
      return -0.625;
    case 0x40 /*0b01000000*/:
      return 0.75;
    case 0xf0 /*0b11110000*/:
      return 0.75;
    case 0x02 /*0b00000010*/:
      return -0.75;
    case 0x0f /*0b00001111*/:
      return -0.75;
    case 0xc0 /*0b11000000*/:
      return 0.875;
    case 0x03 /*0b00000011*/:
      return -0.875;
    case 0x80 /*0b10000000*/:
      return 1.0;
    case 0x01 /*0b00000001*/:
      return -1.0;
    default:
      return NaN;
  }
}

Octoliner.prototype.trackLine = function (argument) {
  if (!argument) { // no argument
    return this.mapPatternToLine(this.digitalReadAll());
  } else if (Array.isArray(argument)) { // argument is analog array
    return this.mapPatternToLine(this.mapAnalogToPattern(argument));
  } else if (typeof (argument) === 'number') { // argument is pattern
    return this.mapPatternToLine(argument);
  } else {
    return NaN;
  }
}

exports.connect = function (opts) {
  return new Octoliner(opts);
};
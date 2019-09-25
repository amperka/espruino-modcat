var Matrix = function(i2c, opts) {
  opts = opts || {};
  this._i2c = i2c || PrimaryI2C; //
  this._address = opts.address || 96;

  this._analogInput = false;
  this._off = false;
  this.pixels = new Uint8Array(8);
  this._brightness = 8; // eqv default value
  this._brightnessByte = 0x00;
  this._gain = 1; // eqv default value
  this._gainByte = 0x00;

  return this;
};

Matrix.prototype.writeReg = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

Matrix.prototype.power = function(state) {
  this._off = !state;
  this.writeReg(0x00, (this._off << 7) | (this._analogInput << 2));
  return this;
};

Matrix.prototype.analogInput = function(state) {
  this._analogInput = !!state;
  this.writeReg(0x00, (this._off << 7) | (this._analogInput << 2));
  return this;
};

Matrix.prototype.equalizer = function(state) {
  this.writeReg(0x0f, !!state << 6);
  return this;
};

Matrix.prototype.audioGain = function(value) {
  value = (E.clip(value, 0, 1) * 7).toFixed(0); // map [0.0 … 1.0] to [0 … 7]
  if (this._gain === value) {
    return this;
  }
  this._gain = value;

  if (this._gain === 0) {
    this._gainByte = 0x07; // -6 dB
  } else {
    this._gainByte = 0x00 + (this._gain - 1); // 0 … +18 dB
  }
  this._gainByte <<= 4;

  this.writeReg(0x0d, this._gainByte | this._brightnessByte);

  return this;
};

Matrix.prototype.brightness = function(value) {
  value = (E.clip(value, 0, 1) * 15).toFixed(0); // map [0.0 … 1.0] to [0 … 15]
  if (this._brightness === value) {
    return this;
  }
  this._brightness = value;
  this._brightnessByte = 0x00;

  if (this._brightness === '0') {
    this._powerAsBrightness = true;
    this.power(false);
  } else {
    if (this._brightness < 8) {
      this._brightnessByte = 0x08 + (this._brightness - 1); // 5 … 35 mA
    } else {
      this._brightnessByte = 0x00 + (this._brightness - 8); // 40 … 75 mA
    }

    this.writeReg(0x0d, this._gainByte | this._brightnessByte);

    if (this._powerAsBrightness) {
      this._powerAsBrightness = false;
      this.power(true);
    }
  }

  return this;
};

Matrix.prototype.clear = function() {
  for (var x = 0; x < 8; ++x) {
    this.pixels[x] = 0x00;
    this.writeReg(0x01 + x, this.pixels[x]);
  }
  this.update();
  return this;
};

Matrix.prototype.read = function() {
  return this.pixels;
};

Matrix.prototype.print = function(byteArray) {
  for (var x = 0; x < 8; ++x) {
    this.pixels[x] = E.reverseByte(byteArray[x]);
    this.writeReg(0x01 + x, this.pixels[x]);
  }
  this.update();
  return this;
};

Matrix.prototype.write = function(x, y, state) {
  if (state) {
    this.pixels[x] |= 1 << y;
  } else {
    this.pixels[x] &= ~(1 << y);
  }
  this.writeReg(0x01 + x, this.pixels[x]);
  this.update();
  return this;
};

Matrix.prototype.update = function() {
  this.writeReg(0x0c, 0x00);
  return this;
};

exports.connect = function(i2c, opts) {
  return new Matrix(i2c, opts);
};

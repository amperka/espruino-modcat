var Strip = function(spi, length, order) {
  this._spi = spi;
  this._length = length || 0;
  this._arrayLength = this._length * 3;

  this._brightness = 255;

  this._color = new Array(this._arrayLength || 0);
  this._result = new Uint8ClampedArray(this._arrayLength || 0);

  for (var i = 0; i < 3; i++) {
    switch (order.charAt(i)) {
      case 'R':
        this._r = i;
        break;
      case 'G':
        this._g = i;
        break;
      case 'B':
        this._b = i;
        break;
      default:
        break;
    }
  }
};

Strip.prototype.putColor = function(index, color) {
  var i = index * 3;

  if (color instanceof Array) {
    this._color[i + this._r] = color[0];
    this._color[i + this._g] = color[1];
    this._color[i + this._b] = color[2];
  } else {
    color = color || {};
    this._color[i + this._r] = color.red || 0;
    this._color[i + this._g] = color.green || 0;
    this._color[i + this._b] = color.blue || 0;
  }

  this._result[i + this._r] = this._color[i + this._r] * this._brightness;
  this._result[i + this._g] = this._color[i + this._g] * this._brightness;
  this._result[i + this._b] = this._color[i + this._b] * this._brightness;

  return this;
};

Strip.prototype.brightness = function(brightness) {
  if (brightness !== undefined) {
    if (brightness >= 0 && brightness <= 1) {
      brightness *= 255;
      for (var i = 0; i < this._arrayLength; ++i) {
        this._result[i] = this._color[i] * brightness;
      }
      this._brightness = brightness;
    }
  } else {
    return this._brightness / 255;
  }
};

Strip.prototype.clear = function() {
  for (var i = 0; i < this._arrayLength; ++i) {
    this._result[i] = this._color[i] = 0;
  }
  this.apply();
};

Strip.prototype.apply = function() {
  this._spi.send4bit(this._result, 0x01, 0x03);
};

Strip.prototype.getColor = function(index, type) {
  var i = index * 3;

  type = type || 'object';
  if (type === 'object') {
    return {
      red: this._color[i + this._r],
      green: this._color[i + this._g],
      blue: this._color[i + this._b]
    };
  }
  if (type === 'array') {
    return [
      this._color[i + this._r],
      this._color[i + this._g],
      this._color[i + this._b]
    ];
  }
};

exports.connect = function(spi, length, order) {
  return new Strip(spi, length, order);
};


// SPI2.setup({baud:3200000, mosi:B15, sck:B13, miso:B14});
// var arr = new Uint8ClampedArray(numberLed * 3);
//   for (var i = numberLed - 1, j = 0; j < halfNumberLed; i -= 1, j += 1) {
//     var left = i * 3;
//     var right = j * 3;
//     if(cm - minDistance < j * step) {
//       arr[left  ] = arr[right  ] = colors[right  ];
//       arr[left+1] = arr[right+1] = colors[right+1];
//       arr[left+2] = arr[right+2] = colors[right+2];

var Strip = function(spi, length, type) {
  this._spi = spi || SPI2;
  this._length = length || 0;

  this._brightness = 255;

  this._color = new Array(length * 3 || 0);
  this._result = new Uint8ClampedArray(length * 3 || 0);

  this._type = 0;
  if (type === 'BGR') {
    this._r = 2;
    this._g = 1;
    this._b = 0;
  }
  if (type === 'RGB') {
    this._r = 0;
    this._g = 1;
    this._b = 2;
  }
  if (type === 'RBG') {
    this._r = 0;
    this._g = 2;
    this._b = 1;
  }

};

Strip.prototype.putColor = function(index, color) {
  var i = index * 3;

  if (color instanceof Array) {
    this._color[i+this._r] = color[0];
    this._color[i+this._g] = color[1];
    this._color[i+this._b] = color[2];
  } else {
    color = color || {};
    this._color[i+this._r] = color.red || 0;
    this._color[i+this._g] = color.green || 0;
    this._color[i+this._b] = color.blue || 0;
  }

  this._result[i+this._r] = this._color[i+this._r] * this._brightness;
  this._result[i+this._g] = this._color[i+this._g] * this._brightness;
  this._result[i+this._b] = this._color[i+this._b] * this._brightness;

  return this;
};

Strip.prototype.brightness = function(brightness) {
  if (brightness !== undefined) {
    if (brightness >= 0 && brightness <= 1) {
      brightness *= 255;
      for (var i in this._color) {
        this._result[i] = this._color[i] * brightness;
      }
      this._brightness = brightness;
    }
  } else {
    return this._brightness / 255;
  }
};

Strip.prototype.clear = function() {
  for (var i in this._color) {
    this._result[i] = this._color[i] = 0;
  }
  this.apply();
};

Strip.prototype.apply = function() {
  this._spi.send4bit(this._result, 0x01, 0x03);
};

Strip.prototype.getColor = function(index, type) {
  var i = index * 3;

  if (type === 'object') {
    return {
      red: this._color[i+this._r],
      green: this._color[i+this._g],
      blue: this._color[i+this._b]
    };
  }
  if (type === 'array') {
    return [
      this._color[i+this._r],
      this._color[i+this._g],
      this._color[i+this._b]
    ];
  }
};

exports.connect = function(spi, length, type) {
  return new Strip(spi, length, type);
};

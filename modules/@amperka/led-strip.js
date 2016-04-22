
// SPI2.setup({baud:3200000, mosi:B15, sck:B13, miso:B14});
// var arr = new Uint8ClampedArray(numberLed * 3);
//   for (var i = numberLed - 1, j = 0; j < halfNumberLed; i -= 1, j += 1) {
//     var left = i * 3;
//     var right = j * 3;
//     if(cm - minDistance < j * step) {
//       arr[left  ] = arr[right  ] = colors[right  ];
//       arr[left+1] = arr[right+1] = colors[right+1];
//       arr[left+2] = arr[right+2] = colors[right+2];

var Strip = function(spi, length) {
  this._spi = spi || SPI2;
  this._length = length || 0;

  this._brightness = 1.0;
};

exports.connect = function(spi, length) {
  return new Strip(spi, length);
};

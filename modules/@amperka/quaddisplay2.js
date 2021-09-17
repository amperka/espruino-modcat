var SYMBOLS = {
  ' ': 255,
  '-': 127,
  '^': 253,
  _: 239,
  '*': 57,
  '0': 129,
  '1': 243,
  '2': 73,
  '3': 97,
  '4': 51,
  '5': 37,
  '6': 5,
  '7': 241,
  '8': 1,
  '9': 33,
  A: 17,
  a: 65,
  B: 1,
  b: 7,
  C: 141,
  c: 79,
  D: 67,
  d: 67,
  E: 13,
  e: 13,
  F: 29,
  f: 29,
  G: 133,
  g: 133,
  H: 19,
  h: 23,
  I: 243,
  i: 243,
  J: 227,
  j: 227,
  K: 19,
  k: 23,
  L: 143,
  l: 143,
  M: 13,
  m: 13,
  N: 87,
  n: 87,
  O: 129,
  o: 71,
  P: 25,
  p: 25,
  Q: 49,
  q: 49,
  R: 95,
  r: 95,
  S: 37,
  s: 37,
  T: 15,
  t: 15,
  U: 131,
  u: 199,
  V: 131,
  v: 199,
  W: 131,
  w: 199,
  X: 19,
  x: 23,
  Y: 35,
  y: 35,
  Z: 73,
  z: 73,
  '.': 254
};

var QuadDisplay = function(opts) {
  if (typeof opts === 'number') {
    SPI2.setup({ mosi: B15, miso: B14, sck: B13 });
    this._spi = SPI2;
    this._cs = opts;
    this._cs.mode('output');
  } else {
    opts = opts || {};
    this._spi = opts.spi;
    this._cs = opts.cs;
    this._cs.mode('output');
  }
  this._intervalID = null;
  this._shift = 0;
  this.display('    ');
};

QuadDisplay.prototype.display = function(str, alignRight) {
  alignRight = alignRight || false;
  var s = str.toString();
  this._data = [];

  for (var i = 0, d = -1; i < s.length; i++) {
    if (s[i] !== '.') {
      d++;
      this._data[d] = SYMBOLS[s[i]];
    } else {
      // prevent dot-dot and space-dot collapsing
      if (d !== -1 && (this._data[d] !== 0xfe && this._data[d] !== 0xff)) {
        this._data[d] &= 0xfe;
      } else {
        d++;
        this._data[d] = SYMBOLS['.'];
      }
    }
  }

  if (alignRight) {
    if (this._data.length < 4) {
      this._data = new Array(4 - this._data.length)
        .fill(SYMBOLS[' '], 0)
        .concat(this._data);
    }
    this.frame(this._data.length - 4);
  } else {
    if (this._data.length < 4) {
      this._data = this._data.concat(
        new Array(4 - this._data.length).fill(SYMBOLS[' '], 0)
      );
    }
    this.frame(0);
  }
};

QuadDisplay.prototype.marquee = function(str, period) {
  period = period || 300;
  if (this._intervalID) {
    this._intervalID = clearInterval(this._intervalID);
    this._shift = 0;
  }
  this.display('   ' + str + '   ', false);
  var self = this;
  this._intervalID = setInterval(function() {
    self._shift++;
    if (self._shift > self._data.length - 4) {
      self._shift = 0;
    }
    // eslint-disable-next-line
    self.frame.call(self, self._shift);
  }, period);
};

QuadDisplay.prototype.frame = function(shift) {
  this._shift = shift;
  if (this._shift < 0) {
    this._shift = 0;
  }
  if (this._shift > this._data.length - 4) {
    this._shift = this._data.length;
  }
  this._spi.send(this._data.slice(this._shift, this._shift + 4), this._cs);
  digitalWrite(this._cs, 0);
};

exports.connect = function(opts) {
  return new QuadDisplay(opts);
};

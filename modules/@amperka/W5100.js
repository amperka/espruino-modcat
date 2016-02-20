var W5100 = function(spi, cs) {
  this._spi = spi;
  this._cs = cs;
};

exports.connect = function(spi, cs) {
  return new W5100(spi, cs);
};


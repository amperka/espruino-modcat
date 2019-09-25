var DS18B20 = function(oneWire) {
  this._oneWire = oneWire;
};

DS18B20.prototype.getC = function(device) {
  // Get temp
  this._oneWire.reset();
  this._oneWire.select(device);
  this._oneWire.write(0x44);

  // Read register
  this._oneWire.reset();
  this._oneWire.select(device);
  this._oneWire.write(0xbe);
  var regs = this._oneWire.read(9);

  // Convert
  var temp = regs[0] | (regs[1] << 8);
  if (temp > 32767) {
    temp -= 65536;
  }
  temp = temp / 16;
  return temp;
};

exports.connect = function(oW) {
  return new DS18B20(oW);
};

function TroykaI2CHub(opts) {
  opts = opts || {};
  var _channel = 0;
  var _address = opts.address || 0x70;
  var _i2c = opts.i2c || PrimaryI2C;
  var _enableMask = 0x08;

  this.setBusChannel = function(channel) {
    if (channel < 0 || channel >= 8) {
      return;
    }
    _channel = channel;
    _i2c.writeTo(_address, _channel | _enableMask);
  };

  this.getBusChannel = function() {
    return _channel;
  };
  this.setBusChannel(0);
}

exports.connect = function(opts) {
  return new TroykaI2CHub(opts);
};

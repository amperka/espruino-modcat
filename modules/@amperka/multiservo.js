var MultiServo = function(i2c, address) {
    i2c === undefined ? this._i2c = PrimaryI2C: this._i2c = i2c;
    address === undefined ? this._address = 0x47: this._address = address;
};

MultiServo.prototype.attach = function(pin) {
    return new MultiServoDevice(pin, this._i2c, this._address);
}

var MultiServoDevice = function(pin, i2c, address) {
    this._i2c = i2c;
    this._address = address;
    this._pin = pin;
};

MultiServoDevice.prototype.write = function(val) {
    var ms = 490 + 7.46 * val;
    this._i2c.writeTo(this._address, [this._pin, ms >> 8, ms % 0xFF]);
};

exports.connect = function(i2c, address) {
    return new MultiServo(i2c, address);
};

var IOcommand = {
  WHO_AM_I: 0, // Gave the UID
  RESET: 1, // Discharge
  CHANGE_I2C_ADDR: 2, // Change I2C address manually
  SAVE_I2C_ADDR: 3, // Save the current address to flash to start on subsequent power-ups from it
  PORT_MODE_INPUT: 4, // Set up pins to enter
  PORT_MODE_PULLUP: 5, // .. entrance with pull up
  PORT_MODE_PULLDOWN: 6,
  PORT_MODE_OUTPUT: 7, // .. to the exit
  DIGITAL_READ: 8, // Read the state of the virtual port
  DIGITAL_WRITE_HIGH: 9, // Set the pins of the virtual port to a high level
  DIGITAL_WRITE_LOW: 10, // .. to a low level
  ANALOG_WRITE: 11, // Start PWM
  ANALOG_READ: 12, // Read value from ADC
  PWM_FREQ: 13, // Setting the PWM frequency (common to all PWM pins)
  ADC_SPEED: 14
};

var Expander = function(connect) {
  connect = connect || {};

  this._i2c = connect.i2c;
  this._ADDRESS = connect.address || 42;
};

Expander.prototype._writeCmdPin = function(command, pin) {
  var send = new Uint8Array([command, pin], 0, 2);
  this._i2c.writeTo(this._ADDRESS, send);
};

Expander.prototype._writeCmdPin16Val = function(command, pin, value) {
  var send = new Uint8Array(
    [command, pin, (value >> 8) & 0xff, value & 0xff],
    0,
    4
  );
  this._i2c.writeTo(this._ADDRESS, send);
};

Expander.prototype._writeCmd16BitData = function(command, data) {
  var send = new Uint8Array([command, (data >> 8) & 0xff, data & 0xff], 0, 3);
  this._i2c.writeTo(this._ADDRESS, send);
};

Expander.prototype._writeCmd8BitData = function(command, data) {
  var send = new Uint8Array([command, data], 0, 2);
  this._i2c.writeTo(this._ADDRESS, send);
};

Expander.prototype._writeCmd = function(command) {
  var send = new Uint8Array([command], 0, 1);
  this._i2c.writeTo(this._ADDRESS, send);
};

Expander.prototype._read16Bit = function() {
  var result = 0;
  var data = new Uint8Array(2);
  data = this._i2c.readFrom(this._ADDRESS, 2);
  result = data[0];
  result <<= 8;
  result |= data[1];
  return result;
};

Expander.prototype.digitalWritePort = function(value) {
  this._writeCmd16BitData(IOcommand.DIGITAL_WRITE_HIGH, value);
  this._writeCmd16BitData(IOcommand.DIGITAL_WRITE_LOW, ~value);
};

Expander.prototype.digitalWrite = function(pin, value) {
  var sendData = 1 << pin;
  if (value) {
    this._writeCmd16BitData(IOcommand.DIGITAL_WRITE_HIGH, sendData);
  } else {
    this._writeCmd16BitData(IOcommand.DIGITAL_WRITE_LOW, sendData);
  }
};

Expander.prototype.digitalReadPort = function() {
  this._writeCmd(IOcommand.DIGITAL_READ);
  return this._read16Bit();
};

Expander.prototype.digitalRead = function(pin) {
  var result = this.digitalReadPort();
  if (result >= 0) {
    result = result & (1 << pin) ? 1 : 0;
  }
  return result;
};

Expander.prototype.pinMode = function(pin, mode) {
  var sendData = 1 << pin;
  if (mode === 'input') {
    this._writeCmd16BitData(IOcommand.PORT_MODE_INPUT, sendData);
  } else if (mode === 'output') {
    this._writeCmd16BitData(IOcommand.PORT_MODE_OUTPUT, sendData);
  } else if (mode === 'input_pullup') {
    this._writeCmd16BitData(IOcommand.PORT_MODE_PULLUP, sendData);
  } else if (mode === 'input_pulldown') {
    this._writeCmd16BitData(IOcommand.PORT_MODE_PULLDOWN, sendData);
  }
};

Expander.prototype.analogWrite = function(pin, pulseWidth) {
  var val = Math.floor(pulseWidth * 65535);
  this._writeCmdPin16Val(IOcommand.ANALOG_WRITE, pin, val);
};

Expander.prototype.servoWrite = function(pin, angle) {
  var val = Math.floor(angle * 43.69); // === angle / 1500 * 65535
  this._writeCmdPin16Val(IOcommand.ANALOG_WRITE, pin, val);
};

Expander.prototype.analogRead = function(pin) {
  this._writeCmdPin(IOcommand.ANALOG_READ, pin);
  return this._read16Bit() / 4092;
};

Expander.prototype.pwmFreq = function(freq) {
  this._writeCmd16BitData(IOcommand.PWM_FREQ, freq);
};

Expander.prototype.adcSpeed = function(speed) {
  // speed must be < 8. Smaller is faster, but dirty
  this._writeCmd8BitData(IOcommand.ADC_SPEED, speed);
};

Expander.prototype.changeAddr = function(newAddr) {
  this._writeCmd8BitData(IOcommand.CHANGE_I2C_ADDR, newAddr);
  this._ADDRESS = newAddr;
};

Expander.prototype.saveAddr = function() {
  this._writeCmd(IOcommand.SAVE_I2C_ADDR);
};

Expander.prototype.reset = function() {
  this._writeCmd(IOcommand.RESET);
};

Expander.prototype.getUID = function() {
  this._writeCmd(IOcommand.WHO_AM_I);
  var result = 0;
  var data = new Uint8Array(4);
  data = this._i2c.readFrom(this._ADDRESS, 4);
  for (var i = 0; i < 3; ++i) {
    result = data[i];
    result <<= 8;
  }
  result |= data[3];
  return result;
};

exports.connect = function(opts) {
  return new Expander(opts);
};

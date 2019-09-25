var RS485 = function(opts) {
  opts = opts || {};
  this._serial = opts.serial || Serial3;
  this._speed = opts.speed || 9600;
  this._dirPin = opts.dirPin || P5;
  this._lineEnding = opts.lineEnding;
  this._endPrintID = null;
  this._serial.setup(this._speed);
  this._timeTransmission = (12 / this._speed) * 1000 + 2;
};

RS485.prototype.on = function(event, callback) {
  switch (event) {
    case 'data':
      this._serial.on('data', callback);
      break;
    case 'parity':
      this._serial.on('parity', callback);
      break;
    case 'framing':
      this._serial.on('framing', callback);
      break;
  }
};

RS485.prototype.available = function() {
  return this._serial.available();
};

RS485.prototype.read = function(chars) {
  return this._serial.read(chars);
};

RS485.prototype.print = function(data) {
  this._transmissionOn(data);
  this._serial.print(data);
};

RS485.prototype.println = function(data) {
  this._transmissionOn(data);
  if (this._lineEnding) {
    this._serial.print(data + this._lineEnding);
  } else {
    this._serial.println(data);
  }
};

RS485.prototype.write = function(data) {
  this._transmissionOn(data);
  this._serial.write(data);
};

RS485.prototype._transmissionOn = function(data) {
  var time = data.length * this._timeTransmission;
  this._dirPin.write(true);
  var self = this;
  this._endPrintID = setTimeout(function() {
    self._dirPin.write(false);
  }, time);
};

exports.connect = function(opts) {
  return new RS485(opts);
};

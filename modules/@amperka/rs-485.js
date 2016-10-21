var RS485 = function(opts) {
  if (!opts) {
    pts = {};
  }
  this._serial = opts.serial || Serial3;
  this._speed = opts.speed || 9600;
  this._dirPin = opts.dirPin || P5;
  this._lineEnding = opts.lineEnding || '\r\n';
  this._kPin = opts.kPin;
  this._endPrintID = null;
  this._serial.setup(this._speed);
  var self = this;

  this._serial.on('data', function(data) {
    self.emit('data', data);
  });
  this._serial.on('parity', function() {
    self.emit('error', 'parity');
  });
  this._serial.on('framing', function() {
    self.emit('error', 'speed');
  });
};

RS485.prototype.print = function(data) {
  var time = (data.length * 12 / this._speed) * 1000;
  console.log(time);
  this._dirPin.write(true);
  this._serial.print(data);
  var self = this;
  this._endPrintID = setTimeout(function() {
    self._dirPin.write(false);
  }, time);
};

RS485.prototype.println = function(data) {
  var time = (data.length * 12 / this._speed) * 1000;
  console.log(time);
  this._dirPin.write(true);  
  if (this._lineEnding) {
    this._serial.print(data + this._lineEnding);
  } else {
    this._serial.println(data);
  }
  var self = this;
  this._endPrintID = setTimeout(function() {
    self._dirPin.write(false);
  }, time);
};

exports.connect = function(opts) {
  return new RS485(opts);
};

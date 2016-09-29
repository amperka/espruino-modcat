var HC05 = function(opts) {
  if (!opts) {
    opts = {};
  }
  this._serial = opts.serial || Serial3;
  this._speed = opts.speed || 9600;
  this._kPin = opts.kPin || undefined;
  this._lineend = opts.lineend || undefined;
  this._lastData = getTime();
  this._serial.setup(this._speed);

  this._command = undefined;

  this._buffer = '';
  var self = this;

  this._serial.on('data', function(data) {
    self._lastData = getTime();
    if (!self._lineend && !self._command) {
      self.emit('data', data);
      return;
    }
    self._buffer += data;
    var delimiter = self._lineend;
    if (self._command) {
      delimiter = '\r\n';
    }
    var lines = self._buffer.split(delimiter);
    self._buffer = lines[lines.length - 1];

    for (var l = 0; l < lines.length - 1; l++) {

      if (self._command && lines[l] == 'OK') {
        self._kPin.write(0);
        self._command = undefined;
      } else if (self._command && lines[l].substr(0, 5) == 'ERROR') {
        self._command(new Error('Command error: ' + lines[l]));
        self._command = undefined;
        self._kPin.write(0);
      } else if (self._command) {
        self._command(lines[l]);
      } else {
        self.emit('data', lines[l]);
      }
    }
  });
  this._serial.on('parity', function() {
    self.emit('error', 'parity');
  });
  this._serial.on('framing', function() {
    self.emit('error', 'speed');
  });
};

HC05.prototype.write = function(data) {
  this._serial.print(data);
};

HC05.prototype.writeln = function(data) {
  if (this._lineend) {
    this._serial.print(data + this._lineend);
  } else {
    this._serial.println(data);
  }
};

HC05.prototype.command = function(cmd, callback) {
  if (!this._kPin) {
    callback(new Error('kPin is not selected'));
  }


  this._kPin.write(1);
  this._command = callback;
  this._buffer = '';
  var timeout = 0;
  var self = this;
  if (getTime() - this._lastData < 1) {
    timeout = 1001 - (getTime() - this._lastData) * 1000;
  }
  // Запускать выполнение команды можно только через секунду от переключения пина
  // или предыдущей команды
  setTimeout(function() {
    self.writeln(cmd);
  }, timeout);

};

exports.connect = function(opts) {
  return new HC05(opts);
};

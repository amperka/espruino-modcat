var HC05 = function(opts) {
  if (!opts) {
    opts = {};
  }
  this._serial = opts.serial || Serial3;
  this._speed = opts.speed || 9600;
  this._kPin = opts.kPin;
  this._lineEnding = opts.lineEnding;
  this._lastDataTime = getTime();
  this._serial.setup(this._speed);
  this._commandList = [];
  this._commandTimeout = null;
  this._commandCallback = null;
  this._commandDelay = 1000;
  this._buffer = '';
  var self = this;
  this._serial.on('data', function(data) {
    self._lastDataTime = getTime();
    if (!self._lineEnding && !self._commandCallback) {
      self.emit('data', data);
      return null;
    }
    self._buffer += data;
    var delimiter = self._lineEnding;
    if (self._commandCallback) {
      delimiter = '\r\n';
    }
    var lines = self._buffer.split(delimiter);
    self._buffer = lines[lines.length - 1];

    for (var l = 0; l < lines.length - 1; l++) {
      if (self._commandCallback && lines[l] === 'OK') {
        self._kPin.write(0);
        self._commandCallback = null;
      } else if (self._commandCallback && lines[l].substr(0, 5) === 'ERROR') {
        self._commandCallback(new Error('Command error: ' + lines[l]));
        self._commandCallback = null;
        self._kPin.write(0);
      } else if (self._commandCallback) {
        self._commandCallback(lines[l]);
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

HC05.prototype.print = function(data) {
  this._serial.print(data);
};

HC05.prototype.println = function(data) {
  if (this._lineEnding) {
    this._serial.print(data + this._lineEnding);
  } else {
    this._serial.println(data);
  }
};

HC05.prototype.command = function(cmd, callback) {
  if (!this._kPin) {
    callback(new Error('kPin is not selected'));
  }
  this._commandList.push(cmd);
  this._buffer = '';
  var timeout = 0;
  var self = this;
  // Запускать выполнение команды можно только через секунду после старта
  if (getTime() - this._lastDataTime < 1) {
    timeout = this._commandDelay + 1 - (getTime() - this._lastDataTime) * 1000;
  }

  if (this._commandTimeout !== null) {
    clearTimeout(this._commandTimeout);
  }

  this._commandTimeout = setTimeout(function() {
    var commandsInterval = setInterval(function() {
      var currentCommand = self._commandList.shift();
      if (currentCommand === undefined) {
        clearInterval(commandsInterval);
      } else {
        self._kPin.write(1);
        self.println(currentCommand);
        self._commandCallback = callback;
      }
    }, self._commandDelay);
    self._commandTimeout = null;
  }, timeout);
};

HC05.prototype.read = function(param, callback) {
  param = (param || '').toUpperCase();
  var cmd = 'AT+';
  switch (param) {
    case 'VERSION':
    case 'NAME':
    case 'PSWD':
    case 'ROLE':
    case 'STATE':
    case 'BIND':
    case 'UART':
      cmd += param + '?';
      break;
    default:
      callback(new Error('ERROR IN COMMAND'));
      return null;
  }
  this.command(cmd, function(data) {
    callback(data);
  });
};

HC05.prototype.firmware = function(callback) {
  this.read('VERSION', callback);
};

HC05.prototype.speed = function(baud, callback) {
  switch (baud) {
    case 4800:
    case 9600:
    case 19200:
    case 38400:
    case 57600:
    case 115200:
      break;
    default:
      callback(new Error('WRONG BAUD RATE'));
      return null;
  }
  print('AT+UART=' + baud + ',0,0');
  this.command('AT+UART=' + baud + ',0,0', callback);
};

HC05.prototype.name = function(name, callback) {
  if (name && name !== '') {
    this.command('AT+NAME=' + name, callback);
  } else {
    callback(new Error('WRONG NAME'));
  }
};

HC05.prototype.password = function(pinCode, callback) {
  if (pinCode && pinCode !== '') {
    this.command('AT+PSWD=' + pinCode, callback);
  } else {
    callback(new Error('WRONG PASSWORD'));
  }
};

HC05.prototype.mode = function(role, callback) {
  var roleVal;
  switch (role) {
    case 'slave':
      roleVal = '0';
      break;
    case 'master':
      roleVal = '1';
      break;
    case 'loop':
      roleVal = '2';
      break;
    default:
      callback(new Error('WRONG ROLE'));
      return null;
  }
  this.command('AT+ROLE=' + roleVal, callback);
};

HC05.prototype.connect = function(address, pinCode, callback) {
  if (address) {
    this.command('AT+RMAAD'); // delete all address from memory
    this.mode('master'); // now we can connect to remote device
    this.password(pinCode); // set the remote device password
    this.command('AT+CMODE=0'); // connect by address only
    this.command('AT+LINK=' + address.replace(':', ','), callback);
  } else {
    callback(new Error('WRONG ADDRESS'));
  }
};

HC05.prototype.disconnect = function(callback) {
  this.command('AT+DISC', callback);
};

exports.connect = function(opts) {
  return new HC05(opts);
};

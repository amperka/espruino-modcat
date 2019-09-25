var Sim900r = function(options) {
  if (!options) {
    options = {};
  }
  this._debug = options.debug || false;
  this._powerPin = options.powerPin || P2;
  this._statusPin = options.statusPin || P3;

  this._serial = options.port || Serial3;
  this._serial.setup(options.serialSpeed || 9600);

  this._smsEvent = false;
  this._smsPhone = undefined;
  this._smsDate = undefined;
  this._smsText = undefined;

  this._currentCommand = null;
  this._currentCommandData = [];
  this._currentCommandCallback = undefined;
  this._currentCommandResponse = false;

  var self = this;

  /**
   * Настройка триггера пина статуса
   */
  pinMode(this._statusPin, 'input_pulldown');
  setWatch(
    function(e) {
      if (e.state === true) {
        self.emit('powerOn');
      } else {
        self.emit('powerOff');
      }
    },
    this._statusPin,
    {
      repeat: true,
      edge: 'both',
      debounce: 10
    }
  );

  /**
   * При поступлении данные на порт, суммируем их в буффер
   * и разделяем по переходу на новую строку, после чего
   * обрабатываем их построчно.
   */
  var dataBuffer = '';
  this._serial.on('data', function(data) {
    dataBuffer += data;
    var lines = dataBuffer.split('\r\n');
    for (var i = 0; i < lines.length - 1; i++) {
      if (lines[i] !== '') {
        self._onDataLine(lines[i]);
      }
    }
    dataBuffer = lines[lines.length - 1];
  });
};

Sim900r.prototype._onDataLine = function(line) {
  var data = line.split(': ');
  switch (data[0]) {
    case 'RING':
      this.emit('ring');
      break;
    case '+CLIP':
      this.emit('clip', this.parsePhone(data[1]));
      break;
    case 'NO CARRIER':
      this.emit('noCarrier');
      break;
    case 'BUSY':
      this.emit('busy');
      break;
    case '+CUSD':
      this.emit('ussd', data[1]);
      break;
    case '+CMTI':
      var index = parseInt(data[1].split(',')[1]);
      this.emit('sms', index);
      break;
    case '+CPIN':
      if (data[1] === 'READY') {
        this.emit('simReady');
      } else if (data[1] === 'SIM PIN') {
        this.emit('simPin');
      } else {
        this.emit('simError', data[1]);
      }
      break;
    case 'Call Ready':
      this.emit('simNetwork');
      break;
    // Если строка равна строке запроса команды,
    // то дальше будут передаваться данные
    case this._currentCommand:
      this._currentCommandResponse = true;
      break;
    // Конец ответа на команду
    case 'OK':
      this._currentCommandResponse = false;
      this._currentCommandCallback(undefined, this._currentCommandData);
      break;
    // Ошибка при выполнении команды
    case 'ERROR':
      this._currentCommandResponse = false;
      this._currentCommandCallback(new Error('CMD Error'));
      break;
    default:
      if (this._currentCommandResponse) {
        this._currentCommandData.push(line);
      } else {
        this.emit('unknown', line);
      }
  }
};

/*
 * Стук к пину включения/выключения
 */
Sim900r.prototype.power = function() {
  digitalPulse(this._powerPin, 1, 1000);
};

/**
 * Включение модуля
 */
Sim900r.prototype.powerOn = function() {
  if (!this.isReady()) {
    this.power();
  }
};

/**
 * Выключение модуля
 */
Sim900r.prototype.powerOff = function() {
  if (this.isReady()) {
    this.power();
  }
};

/**
 * Состояние готовности к взаимодейтвию
 */
Sim900r.prototype.isReady = function() {
  return !!digitalRead(this._statusPin);
};

/**
 * Вызов команды
 */
Sim900r.prototype.cmd = function(command, callback) {
  // Нельзя отправлять новую команду, пока данные от предыдущей не получены
  if (!this.isReady()) {
    callback(new Error('powerOff'));
  } else if (!this._currentCommandResponse) {
    if (!callback) {
      callback = function() {};
    }
    this._currentCommand = command.toUpperCase();
    this._currentCommandData = [];
    this._currentCommandCallback = callback;
    this._serial.println(command);
  } else {
    if (callback) {
      callback(new Error('busy'));
    }
  }
};

/**
 * Отправка СМС на номер
 */
Sim900r.prototype.smsSend = function(phone, text, callback) {
  var serial = this._serial;
  this.cmd('AT+CMGS="' + phone + '"', callback);
  setTimeout(function() {
    serial.println(text + '\u001a');
  }, 500);
};

/**
 * Получение списка SMS
 */
Sim900r.prototype.smsList = function(callback) {
  var self = this;
  this.cmd('AT+CMGF=1', function(error) {
    if (!error) {
      this.cmd('AT+CMGL="ALL",1', function(error, data) {
        if (!error) {
          var smsList = [];
          for (var s = 0; s < data.length; s = s + 2) {
            var sms = self.parseSMS(data[s], data[s + 1]);
            smsList.push(sms);
          }
          callback(undefined, smsList);
        } else {
          callback(error);
        }
      });
    } else {
      callback(error);
    }
  });
};

/**
 * Чтение СМС с SIM-карты
 */
Sim900r.prototype.smsRead = function(index, callback) {
  var self = this;
  this.cmd('AT+CMGR=' + index, function(error, result) {
    if (result.length === 0) {
      callback(new Error('SMS is not found'));
    } else {
      callback(undefined, self.parseSMS(result[0], result[1], index));
    }
  });
};

/**
 * Удаление СМС с SIM-карты
 */
Sim900r.prototype.smsDelete = function(index) {
  var command = 'AT+CMGD=' + index;
  if (index === 'all') {
    command = 'AT+CMGD=0,4';
  }
  this.cmd(command, function(err, result) {
    print(err, result);
  });
};

/**
 * Набор номера
 */
Sim900r.prototype.call = function(phone, callback) {
  this.cmd('ATD' + phone + ';', callback);
};

/**
 * Ответ на входящий звонок
 */
Sim900r.prototype.answer = function(callback) {
  this.cmd('ATA', callback);
};

/**
 * Разрыв соединения
 */
Sim900r.prototype.cancel = function(callback) {
  this.cmd('ATH0', callback);
};

/**
 * Отправка USSD команды
 */
Sim900r.prototype.ussd = function(phone, callback) {
  this.cmd('AT+CUSD=1,"' + phone + '"', callback);
};

/**
 * Оператор SIM-карты
 */
Sim900r.prototype.netProvider = function(callback) {
  this.cmd('AT+CSPN?', callback);
};

/**
 * Оператор, в сети которого зарегистрирована SIM-карта
 */
Sim900r.prototype.netCurrent = function(callback) {
  this.cmd('AT+COPS?', callback);
};

/**
 * Статус регистрации в сети
 */
Sim900r.prototype.netStatus = function(callback) {
  this.cmd('AT+CREG?', callback);
};

/**
 * Качество приема сигнала
 */
Sim900r.prototype.netQuality = function(callback) {
  this.cmd('AT+CSQ', callback);
};

Sim900r.prototype.getImei = function(callback) {
  this.cmd('AT+GSN', function(data) {
    var imei = Sim900r.prototype.parse.first(data);
    if (callback) {
      callback(imei);
    }
  });
};

Sim900r.prototype.getFirmware = function(callback) {
  this.cmd('AT+GMR', function(error, data) {
    if (!error) {
      data = data[0];
    }
    callback(error, data);
  });
};

Sim900r.prototype.getTime = function(callback) {
  this.cmd('AT+CCLK?', function(error, data) {
    if (!error) {
      var date = this.parseSimDateToDate(data[0].split('"')[1]);
      callback(undefined, date);
    } else {
      callback(error);
    }
  });
};

Sim900r.prototype.setTime = function(dt, callback) {
  var date = this.parseDateToSimDate(dt);
  this.cmd('AT+CCLK="' + date + '"', callback);
};

Sim900r.prototype.setCallerID = function(val, callback) {
  this.cmd('AT+CLIP=' + val, callback);
};

Sim900r.prototype.getCallerID = function(callback) {
  this.cmd('AT+CLIP?', callback);
};

/**
 * Методы обработки ответов
 */

Sim900r.prototype.parseSMS = function(fLine, lLine, index) {
  var data = fLine.split('"');
  var indexData = data[0].split(': ');
  var message = {
    index: index || indexData[1],
    phone: data[3],
    date: this.parseSimDateToDate(data[7]),
    text: lLine
  };
  return message;
};

Sim900r.prototype.parsePhone = function(phone) {
  phone = phone.split('"');
  if (phone[1]) {
    phone = phone[1];
  } else {
    phone = undefined;
  }
  return phone;
};

Sim900r.prototype.parseDateToSimDate = function(dt) {
  var year = (dt.getFullYear() + '').substr(-2);
  var month = ('0' + dt.getMonth()).substr(-2, 2);
  var day = ('0' + dt.getDate()).substr(-2, 2);
  var hh = ('0' + dt.getHours()).substr(-2, 2);
  var mm = ('0' + dt.getMinutes()).substr(-2, 2);
  var ss = ('0' + dt.getSeconds()).substr(-2, 2);
  var date =
    year + '/' + month + '/' + day + ',' + hh + ':' + mm + ':' + ss + '+00';
  return date;
};

Sim900r.prototype.parseSimDateToDate = function(dt) {
  // 00/01/01,07:51:29+00
  var date =
    '20' +
    dt.substr(0, 2) +
    '-' +
    dt.substr(3, 2) +
    '-' +
    dt.substr(6, 2) +
    'T';
  date += dt.substr(9, 2) + ':' + dt.substr(12, 2) + ':' + dt.substr(15, 2);
  return new Date(Date.parse(date));
};

Sim900r.prototype.parsePhoneToPDU = function(phone) {
  phone = phone.split('');

  if (phone[0] === '+') {
    phone.splice(0, 1);
  }

  var len = phone.length;

  if (len % 2 > 0) {
    phone.push('F');
  }

  for (var c = 0; c < phone.length / 2; c++) {
    var tmp = phone[c * 2];
    phone[c * 2] = phone[c * 2 + 1];
    phone[c * 2 + 1] = tmp;
  }

  return phone;
};

exports.connect = function(_uart, _powerPin, _statusPin) {
  return new Sim900r(_uart, _powerPin, _statusPin);
};

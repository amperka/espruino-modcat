var Sim900r = function(options) {
  this._debug = options && options.debug ? options.debug : false;
  this._serial = options && options.serialPort ? options.serialPort : Serial3;
  this._powerPin = options && options.powerPin ? options.powerPin : P2;
  this._statusPin = options && options.statusPin ? options.statusPin : P3;

  pinMode(this._statusPin, 'input');
  this._serial.setup(options && options.serialSpeed ? options.serialSpeed : 9600);

  this._currentPhone = undefined;
  this._currentRing = 0;


  this._smsEvent = false;
  this._smsPhone = undefined;
  this._smsDate = undefined;
  this._smsText = undefined;

  this._currentCommand = undefined;
  this._currentCommandData = undefined;
  this._currentCommandCallback = undefined;
  this._currentCommandResponse = false;


  var buffer = '';
  var self = this;
  /**
   * При поступлении данные на порт, суммируем их
   * и разделяем по переходу на новую строку.
   * На каждую новую строку вызываем обработчик новой
   * строки, передавая туда параметры
   */
  this._serial.on('data', function(data){
    buffer += data;
    var lines = buffer.split('\r\n');
    for (var i = 0; i < lines.length - 1; i++) {
      if (lines[i] !== '') {
        self._onLine(lines[i]);
      }
    }
    buffer = lines[lines.length];
  });
};

/**
 * Метод, исполняющийся при получении новой строки
 */
Sim900r.prototype._onLine = function(line) {
  if (this._debug) {
    print(line);
  }
  switch (line) {
    // Если строка равна строке запроса команды, то дальше будут передаваться данные
    case this._currentCommand:
      this._currentCommandResponse = true;
      break;
    // Конец ответа на команду
    case 'OK':
      this._currentCommandResponse = false;
      if (this._currentCommandCallback) {
        this._currentCommandCallback(undefined, this._currentCommandData);
      }
      this._currentCommand = undefined;
      this._currentCommandData = undefined;
      this._currentCommandCallback = undefined;
      break;
    // Ошибка при выполнении команды
    case 'ERROR':
      this._currentCommandResponse = false;
      if (this._currentCommandCallback) {
        this._currentCommandCallback(new Error('CMD Error'));
      }
      this._currentCommand = undefined;
      this._currentCommandData = undefined;
      this._currentCommandCallback = undefined;

      break;
    default:
      if (this._currentCommandResponse) {
        // Новые данные от команды
        this._currentCommandData.push(line);
      } else {
        // Новые данные инициированные модулем
        this._notCommand(line);
      }
  }
};


/**
 * Обработка строк, инициированных модулем
 */
Sim900r.prototype._notCommand = function(line) {
  var params = line.split(': ');
  switch (params[0]) {
    case 'RING':
      // Первый звонок пропускаем, так как возможно далее определиться номер
      if (this._currentRing > 0) {
        this.emit('ring', this.parsePhone(this._currentPhone), this._currentRing);
      }
      this._currentRing++;
      break;
    case '+CLIP':
      this._currentPhone = params[1];
      break;
    case 'NO CARRIER':
      this._currentRing = 0;
      this._currentPhone = undefined;
      this.emit('noCarrier');
      break;
    case 'RDY':
      this.emit('powerOn');
      break;
    case 'Call Ready':
      this.emit('ready');
      break;
    case '+CPIN':
      if (params[1] === 'READY') {
        this.emit('simReady');
      } else {
        this.emit('simError', params[1]);
      }
      break;
    case 'NORMAL POWER DOWN':
      this.emit('powerOff');
      break;
    case '+CMT':
      var parts = params[1].split('"');
      this._smsEvent = true;
      this._smsPhone = parts[1];
      this._smsDate = parts[5];
      break;
    default:
      if (this._smsEvent) {
        this.emit('sms', this._smsPhone, this._smsDate, params[0]);
        this._smsPhone = undefined;
        this._smsDate = undefined;
        this._smsEvent = false;
      } else {
        this.emit('unknown', params[0], params[1]);
      }
  }
};


/**
 * Включение модуля
 */
Sim900r.prototype.powerOn = function(callback) {
  if (!this.isReady()) {
    if (callback) {
      this.on('ready', callback);
    }
    digitalPulse(this._powerPin, 1, 1000);
  }
};

/**
 * Выключение модуля
 */
Sim900r.prototype.powerOff = function() {
  if (this.isReady()) {
    digitalPulse(this._powerPin, 1, 1000);
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
  if (!this.isReady()){
    callback(new Error('powerOff'));
  } else if (!this._currentCommandResponse) {
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
 * Набор номера
 */
Sim900r.prototype.voiceCall = function(phone, callback) {
  this.cmd('ATD' + phone + ';', callback);
};

/**
 * Ответ на входящий звонок
 */
Sim900r.prototype.voiceAnswer = function(callback) {
  this.cmd('ATA', callback);
};

/**
 * Разрыв соединения
 */
Sim900r.prototype.voiceReset = function(callback) {
  this.cmd('ATH0', callback);
};

/**
 * Оператор SIM-карты
 */
Sim900r.prototype.networkProvider = function(callback) {
  this.cmd('AT+CSPN?', callback);
};

/**
 * Статус регистрации в сети
 */
Sim900r.prototype.networkStatus = function(callback) {
  this.cmd('AT+CREG?', callback);
};

/**
 * Качество приема сигнала
 */
Sim900r.prototype.networkQuality = function(callback) {
  this.cmd('AT+CSQ', callback);
};

/**
 * Оператор, в сети которого зарегистрирована SIM-карта
 */
Sim900r.prototype.networkCurrent = function(callback) {
  this.cmd('AT+COPS?', callback);
};

Sim900r.prototype.infoImei = function(callback) {
  this.cmd('AT+GSN', function(data) {
    var imei = Sim900r.prototype.parse.first(data);
    if (callback) {
      callback(imei);
    }
  });
};

Sim900r.prototype.infoFirmware = function(callback) {
  this.cmd('AT+GMR', function(error, data) {
    if (!error) {
      data = data[0];
    }
    callback(error, data);
  });
};

Sim900r.prototype.infoTime = function(callback) {
  this.cmd('AT+CCLK?', function(error, data) {
    if (!error) {
      data = this.parseTime(data);
    }
    callback(error, data);
  });
};


/**
 * Отправка СМС на номер
 */
Sim900r.prototype.smsSend = function(phone, text, callback) {
  var serial = this._serial;
  this.cmd('AT+CMGS="'+phone+'"', callback);
  setTimeout(function() {
    serial.println(text+'\u001a');
  }, 500);
};

/**
 * Получение списка SMS
 */
Sim900r.prototype.smsList = function(callback) {
  this.cmd('AT+CMGF=1', function(error, data){
    if (!error) {
      this.cmd('AT+CMGL="ALL"', callback);
    } else {
      callback(error);
    }
  });
};


/**
 * Удаление SMS по индексу
 */
Sim900r.prototype.smsDelete = function(index, callback) {
  this.cmd('AT+CMGF=1', function(error, data){
    if (!error) {
      this.cmd('AT+CMGD='+index, callback);
    } else {
      callback(error);
    }
  });
};

Sim900r.prototype.setCallerID = function(val, callback) {
  this.cmd('AT+CLIP='+val, callback);
};

Sim900r.prototype.getCallerID = function(callback) {
  this.cmd('AT+CLIP?', callback);
};

/**
 * Метод обработки ответов
 */
Sim900r.prototype.parseTime = function(data) {
  data = '20' + data[0].split('"')[1];
  return new Date(data.replace(',', 'T').replace('/', '-').replace('/', '-'));
};

Sim900r.prototype.parsePhone = function(phone) {
  if (phone) {
    phone = phone.split('"')[1];
  }
  return phone;
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

  for (var c = 0; c < (phone.length / 2); c++) {
    var tmp = phone[c * 2];
    phone[c * 2] = phone[c * 2 + 1];
    phone[c * 2 + 1] = tmp;
  }

  return phone;
};


exports.connect = function(_uart, _powerPin, _statusPin) {
  return new Sim900r(_uart, _powerPin, _statusPin);
};

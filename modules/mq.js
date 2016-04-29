var MQ = function(model, dataPin, heatPin) {
  this._model = model;
  this._dataPin = dataPin;
  this._heatPin = heatPin;
  this._heater = undefined;
};

MQ.prototype.read = function(gas) {
  return gas;
};

MQ.prototype.calibrate = function() {
  
};

// Управление нагревателем для MQ-7 и MQ-9
MQ.prototype.heater = function(callback) {
  // Если не настрое пин - ошибка
  if (!this._heatPin) {
    return new Error('Heater Pin is undefined');
  }

  // Если передан 'stop' - прекращаем нагрев и возвращаем null
  if (callback && callback === 'stop') {
    if (this._heater) {
      clearInterval(this._heater);
    }
    this._heater = undefined;
    return null;
  }

  var self = this;

  // Запускае выполнение раз в 150 секунд
  this._heater = setInterval(function(){
    // Нагреваем 5-ю вольтами
    analogWrite(this._heatPin, 1);
    setTimeout(function(){
      // Через 90 секунд подаем 1.5 вольта
      analogWrite(this._heatPin, 0.075);
      setTimeout(function(){
        // При окончании охлаждения, если есть коллбек - возвращаем в него данные
        if (callback) {
          callback(self.read());
        }
      }, 60000);
    }, 90000);
  }, 150000);

  // Возвращаем ID интервала
  return this._heater;
};

MQ.prototype.params = {
  mq2: {
    res: 5,
    clean: 9.83,
    min: 
    LPG: [-0.45, 2.95], // Пропан + Бутан
    CH4: [-0.38, 3.21], // Метан
    H2: [-0.48, 3.32],  // Водород
    Smoke: [-0.42, 3.54] // Дым
  },
  mq3: {
    res: 200,
    clean: 60,
    C2H5OH: []
  },
  mq4: {
    res: 20,
    clean: 4.4,
    LPG: [-0.32, 2.71], // Пропан + Бутан
    CH4: [-0.36, 2.54]  // Метан
  },
  mq5: {
    res: 20,
    clean: 6.5,
    LPG: [-0.39, 1.73], // Пропан + Бутан
    CH4: [-0.38, 1.97]  // Метан
  },
  mq6: {
    res: 20,
    clean: 10,
    LPG: [-0.42, 2.91]  // Пропан + Бутан
  },
  mq7: {
    res: 10,
    clean: 20,
    CO: [-0.77, 3.38]   // Угарный газ
  },
  mq8: {
    res: 10,
    clean: 20,
    H2: [-1.52, 10.49]  // Водород
  },
  mq9: {
    res: 10,
    clean: 9.8,
    LPG: [-0.48, 3.33], // Пропан + Бутан
    CH4: [-0.38, 3.21], // Метан
    CO: [-0.48, 3.10]   // Угарный газ
  }
};

exports.connect = function(model, dataPin, heatPin) {
  return new MQ(model, dataPin, heatPin);
};

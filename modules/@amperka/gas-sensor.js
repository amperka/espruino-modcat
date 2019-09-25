var Sensors = {
  MQ2: {
    rLoad: 5000,
    rClear: 9.83,
    gas: {
      LPG: { coef: [-0.45, 2.95], ppm: 1 }, // Сжиженный газ
      CH4: { coef: [-0.38, 3.21], ppm: 1 }, // Метан
      H2: { coef: [-0.48, 3.32], ppm: 1 }, // Водород
      SMOKE: { coef: [-0.42, 3.54], ppm: 1 } // Дым
    }
  },
  MQ3: {
    rLoad: 200000,
    rClear: 60,
    gas: {
      C2H5OH: { coef: [-0.66, -0.62], ppm: 1 } // Пары спирта
    }
  },
  MQ4: {
    rLoad: 20000,
    rClear: 4.4,
    gas: {
      CH4: { coef: [-0.36, 2.54], ppm: 1 } // Метан
    }
  },
  MQ5: {
    rLoad: 20000,
    rClear: 6.5,
    gas: {
      LPG: { coef: [-0.39, 1.73], ppm: 1 }, // Сжиженный газ
      CH4: { coef: [-0.42, 2.91], ppm: 1 } // Метан
    }
  },
  MQ6: {
    rLoad: 20000,
    rClear: 10,
    gas: {
      LPG: { coef: [-0.42, 2.91], ppm: 1 } // Сжиженный газ
    }
  },
  MQ7: {
    rLoad: 10000,
    rClear: 27,
    gas: {
      CO: { coef: [-0.77, 3.38], ppm: 1 } // Угарный газ;
    }
  },
  MQ8: {
    rLoad: 10000,
    rClear: 70,
    gas: {
      H2: { coef: [-1.52, 10.49], ppm: 1 } // Водород
    }
  },
  MQ9: {
    rLoad: 10000,
    rClear: 9.8,
    gas: {
      LPG: { coef: [-0.48, 3.33], ppm: 1 }, // Сжиженный газ
      CH4: { coef: [-0.38, 3.21], ppm: 1 }, // Метан
      CO: { coef: [-0.48, 3.1], ppm: 1 } // Угарный газ;
    }
  },
  MQ135: {
    rLoad: 1000,
    rClear: 76.63,
    gas: {
      CO2: { coef: [-0.42, 6.87], ppm: 1 }
    }
  }
};

var GasSensor = function(opts) {
  opts = opts || {};
  if (opts.dataPin === undefined) {
    return new Error('Data pin is undefined');
  }

  if (opts.heatPin === undefined) {
    return new Error('Heat pin is undefined');
  }

  if (Sensors[opts.model] === undefined) {
    return new Error(
      'Error in model name. Use MQ2, MQ3, MQ4, MQ5, MQ6, MQ7, MQ8, MQ9'
    );
  }

  this._dataPin = opts.dataPin;
  this._heatPin = opts.heatPin;
  this._model = Sensors[opts.model];
  this._intId = null;

  this._coef = 1; // Соотношение текущих показаний к показаниям по даташиту
  this._times = 5; // Количество считываний для фильтрации
  this._preheat = 30; // Время в секундах для разогрева
};

// Функция калибрует датчик, если значение coef не передано
// Возвращается соотношение текущего сопротивления к сопротивлению по даташиту
GasSensor.prototype.calibrate = function(coef) {
  if (coef) {
    this._coef = coef;
  } else {
    this._coef = this.calculateResistance() / this._model.rClear;
  }

  return this._coef;
};

// Метод возвращает возвращает отфильтрованное сопротивление датчика
GasSensor.prototype.calculateResistance = function() {
  var r = 0;
  for (var i = 0; i < this._times; i++) {
    r += this.getResistance();
  }
  r = r / this._times;
  return r;
};

// Метод возвращает сопротивление датчика
GasSensor.prototype.getResistance = function() {
  var vTemp = E.getAnalogVRef();
  var v = vTemp * analogRead(this._dataPin);
  var r = ((vTemp - v) / v) * this._model.rLoad;
  return r;
};

// Возвращает значение в PPM для газа gas
GasSensor.prototype.read = function(gas) {
  if (gas && this._model.gas[gas] === undefined) {
    return Error('Gas is undefined');
  } else if (!gas) {
    gas = Object.keys(this._model.gas)[0];
  }
  var ratio = this.calculateResistance() / this._coef;
  var res = Math.pow(
    Math.E,
    (Math.log(ratio) - this._model.gas[gas].coef[1]) /
      this._model.gas[gas].coef[0]
  );
  return res * this._model.gas[gas].ppm;
};

// Принудительно управляет нагревом c использованием PWM
GasSensor.prototype.heat = function(pwr) {
  analogWrite(this._heatPin, pwr);
};

// Включает предварительный разогрев датчика, после чего выполняет callback
GasSensor.prototype.preheat = function(callback) {
  this.heat(1);
  if (callback) {
    setTimeout(function() {
      callback();
    }, this._preheat * 1000);
  }
};

// Функция циклического разогрева для MQ-7 и MQ-9
// Реализована через setTimeout для того, чтобы не ждать 150 секунд до запуска
GasSensor.prototype.cycleHeat = function(callback) {
  if (!callback) {
    try {
      clearTimeout(this._intId);
      this.heat(0);
    } catch (e) {
      // Нет у нас запущенного таймаута
    }
    return;
  }

  // Запускаем нагрев от 5 вольт
  this.heat(1);
  this._intId = setTimeout(function() {
    // Через 60 секунд запускаем нагрев от 1.5 вольт
    this.heat(0.294);
    this._intId = setTimeout(function() {
      // Через 90 секунд выполняем
      callback();
      // И запускаем цикл повторно
      this.cycleHeat(callback);
    }, 90000);
  }, 60000);
};

exports.connect = function(opts) {
  return new GasSensor(opts);
};

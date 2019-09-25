/**
 * Конструктор объекта stepper
 * @constructor
 * @param {object} pins - объект со свойствами step, direction, enable типа Pin
 * @param {Object} opts - объект со свойствами pps (скорость) и holdPower (pwm)
 */
var Stepper = function(pins, opts) {
  this._pins = pins;
  opts = opts || {};

  this._pps = opts.pps || 20;
  this._holdPower = opts.holdPower || 0;

  this._pins.step.mode('output');
  this._pins.enable.mode('output');
  this._pins.direction.mode('output');

  this.hold();

  this._intervalId = null;
};

/**
 * Регулирует ШИМ подачи питания на двигатель
 * @param {float} power - Скважность ШИМ от 0 до 1
 */
Stepper.prototype.hold = function(power) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (typeof power === 'undefined') {
    power = this._holdPower;
  }

  analogWrite(this._pins.enable, power);
};
/**
 * Проворачивает вал на step шагов, после чего выполняет callback.
 * @param {number} steps - количество шагов. При отрицательном значении происходит движение назад
 * @param {function} callback - функция, выполняемая после проворота вала
 */
Stepper.prototype.rotate = function(steps, callback) {
  this.hold(1);

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0) {
    this._pins.direction.write(1);
    steps *= -1;
  } else {
    this._pins.direction.write(0);
  }

  var self = this;
  this._intervalId = setInterval(function() {
    if (steps > 0) {
      digitalPulse(self._pins.step, 1, 1);
      steps--;
    } else {
      self.hold();
      if (callback) {
        callback();
      }
    }
  }, 1000 / this._pps);
};

/**
 * Регулирует количество шагов в секунду
 */
Stepper.prototype.pps = function(pps) {
  if (pps === undefined) return this._pps;
  this._pps = pps;
  return this;
};

/**
 * Переустанавливает значение удержания вала заданное при инициализации
 */
Stepper.prototype.holdPower = function(holdPower) {
  if (holdPower === undefined) return this._holdPower;
  this._holdPower = holdPower;
  return this;
};

/**
 * Экспорт функции создания объекта Stepper
 * @param {object} pins - объект со свойствами step, direction, enable типа Pin
 * @param {Object} opts - объект со свойствами pps (скорость) и holdPower (pwm)
 */
exports.connect = function(pins, opts) {
  return new Stepper(pins, opts);
};

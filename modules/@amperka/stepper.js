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

  this.power(this._holdPower);

  this._intervalId = null;
};

/**
 * Регулирует ШИМ подачи питания на двигатель
 * @param {float} power - Скважность ШИМ от 0 до 1
 */
Stepper.prototype.power = function(power) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (!power) {
    power = this._holdPower;
  }

  analogWrite(this._pins.enable, power);
};

/**
 * Проворачивает вал на step шагов, после чего выполняет callback.
 * @param {integer} steps - количество шагов. При отрицательном значении происходит движение назад
 * @param {function} callback - функция, выполняемая после проворота вала
 */
Stepper.prototype.rotate = function(steps, callback) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0) {
    digitalWrite(this._pins.direction, 1);
  } else if (this._directionPin) {
    digitalWrite(this._pins.direction, 0);
  }

  this.power(1);

  var self = this;
  self._intervalId = setInterval(function(){
    if (steps > 0){
      digitalPulse(self._pins.step, 1, 1);
      steps--;
    } else {
      if (callback) {
        callback();
      }
      self.power();
    }
  }, this._delay);
};

/**
 * Экспорт функции создания объекта Stepper
 * @param {object} pins - объект со свойствами step, direction, enable типа Pin
 * @param {Object} opts - объект со свойствами pps (скорость) и holdPower (pwm)
 */
exports.connect = function(pins, opts) {
  return new Stepper(pins, opts);
};

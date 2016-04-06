/**
 * Конструктор объекта stepper
 * @constructor
 * @param {Pin} stepPin - объект пина, при подаче напряжения двигатель * сдвигается на один шаг.
 * @param {Pin} directionPin - объект пина. 1 - движение вперед, 0 - движение назад
 * @param {Pin} enablePin - объект пина, 1 - на двигатель подается напряжение
 * @param {Object} opts - объект со свойствами pps (количество шагов в секунду) и holdPower (значение ШИМ для удержания)
 */
var Stepper = function(stepPin, directionPin, enablePin, opts) {
  this._stepPin = stepPin;
  this._directionPin = directionPin;
  this._enablePin = enablePin;
  opts = opts || {};

  this._pps = opts.pps || 20;
  this._holdPower = opts.enablePin || 0;

  this._stepPin.mode('output');
  this._directionPin.mode('output');
  this._enablePin.mode('output');

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

  analogWrite(this._enablePin, power);
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
    digitalWrite(this._directionPin, 1);
  } else if (this._directionPin) {
    digitalWrite(this._directionPin, 0);
  }

  this.power(1);

  var self = this;
  self._intervalId = setInterval(function(){
    if (steps > 0){
      digitalPulse(self._stepPin, 1, 1);
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
 * @param {Pin} stepPin - объект пина, при подаче напряжения двигатель * сдвигается на один шаг.
 * @param {Pin} directionPin - объект пина. 1 - движение вперед, 0 - движение назад
 * @param {Pin} enablePin - объект пина, 1 - на двигатель подается напряжение
 * @param {Object} opts - объект со свойствами pps (количество шагов в секунду) и holdPower (значение ШИМ для удержания)
 */
exports.connect = function(stepPin, directionPin, enablePin, opts) {
  return new Stepper(stepPin, directionPin, enablePin, opts);
};

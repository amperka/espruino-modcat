
var Stepper = function(stepPin, directionPin, enablePin, opts) {
  this._stepPin = stepPin;
  this._directionPin = directionPin;
  this._enablePin = enablePin;

  opts && opts.ppm ? this._ppm = opts.ppm : this._ppm = 100;
  opts && opts.holdPWM ? this._holdPWM = opts.holdPWM : this._holdPWM = 0;

  this._stepPin.mode('output');
  this._directionPin.mode('output');
  this._enablePin.mode('output');

  this.power(this._holdPWM);
  this._intervalId = null;
};

// Функция ограничивает подачу тока на двигатель
// до holdPower процентов
Stepper.prototype.power = function(power) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
  analogWrite(this._enablePin, power);
};

// Функция осуществляет поворот вала на steps шагов,
// через каждые delay микросекунд.
Stepper.prototype.rotate = function(steps, callback) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0) {
    steps = -1 * steps;
    digitalWrite(this._directionPin, 1);
  } else {
    digitalWrite(this._directionPin, 0);
  }

  this.power(1);

  var self = this;
  self._intervalId = setInterval(function(){
    if (steps > 0){
      digitalPulse(self._stepPin, 1, 1);
      steps--;
    } else {
      self.power(self._holdPWM);
      if (callback !== undefined) {
        callback();
      }
    }
  }, 1000 / this._ppm);
};

exports.connect = function(stepPin, directionPin, enablePin, opts) {
  return new Stepper(stepPin, directionPin, enablePin, opts);
};

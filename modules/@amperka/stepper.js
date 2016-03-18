
var L293D = function(stepPin, directionPin, opts) {
  this._stepPin = stepPin;
  this._directionPin = directionPin;

  opts && opts.delay ? this._delay = opts.delay : this._delay = 5;
  opts && opts.enable ? this._enablePin = opts.enable : this._enablePin = undefined;
  opts && opts.enable && opts.hold ? this._holdPower = opts.hold : this._holdPower = 0;

  this._stepPin.mode('output');
  this._directionPin.mode('output');

  if (this._enablePin) {
    this._enablePin.mode('output');
    this.power();
  }

  this._intervalId = null;
};


// Функция ограничивает подачу тока на двигатель до holdPower процентов
L293D.prototype.power = function(holdPower) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (holdPower === undefined) {
    holdPower = this._holdPower;
  }

  if (this._enablePin) {
    analogWrite(this._enablePin, holdPower);
  }
};



// Функция осуществляет поворот вала на steps шагов, через каждые delay микросекунд.
L293D.prototype.rotate = function(steps, callback) {
  if (this._intervalId !== null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0 && this._directionPin) {
    steps = -1 * steps;
    digitalWrite(this._directionPin, 1);
  } else if(this._directionPin) {
    digitalWrite(this._directionPin, 0);
  }

  this.power(100);

  var self = this;
  self._intervalId = setInterval(function(){
    if (steps > 0){
      digitalPulse(self._stepPin, 1, 1);
      steps--;
    } else {
      if (callback !== undefined) {
        callback();
      } else {
        self.power();
      }
    }
  }, this._delay);
};

exports.connect = function(stepPin, directionPin, opts) {
  return new L293D(stepPin, directionPin, opts);
};

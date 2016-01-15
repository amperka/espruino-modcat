
var L293D = function(stepPin, directionPin, opts) {
  this.__stepPin = stepPin;
  this.__directionPin = directionPin;

  opts && opts.delay ? this.__delay = opts.delay : this.__delay = 5;
  opts && opts.enable ? this.__enablePin = opts.enable : this.__enablePin = undefined;
  opts && opts.enable && opts.hold ? this.__holdPower = opts.hold : this.__holdPower = 0;

  this.__stepPin.mode('output');
  this.__directionPin.mode('output');

  if (this.__enablePin) {
    this.__enablePin.mode('output');
    this.power();
  }

  this.__intervalId = null;
};


// Функция ограничивает подачу тока на двигатель до holdPower процентов
L293D.prototype.power = function(holdPower) {
  if (this.__intervalId !== null) {
    clearInterval(this.__intervalId);
    this.__intervalId = null;
  }

  if (holdPower === undefined) {
    holdPower = this.__holdPower;
  }

  if (this.__enablePin) {
    analogWrite(this.__enablePin, holdPower);
  }
};



// Функция осуществляет поворот вала на steps шагов, через каждые delay микросекунд.
L293D.prototype.rotate = function(steps, callback) {
  if (this.__intervalId !== null) {
    clearInterval(this.__intervalId);
    this.__intervalId = null;
  }

  if (steps === undefined) {
    steps = 1;
  }

  if (steps < 0 && this.__directionPin) {
    steps = -1 * steps;
    digitalWrite(this.__directionPin, 1);
  } else if(this.__directionPin) {
    digitalWrite(this.__directionPin, 0);
  }

  this.power(100);

  var self = this;
  self.__intervalId = setInterval(function(){
    if (steps > 0){
      digitalPulse(self.__stepPin, 1, 1);
      steps--;
    } else {
      if (callback !== undefined) {
        callback();
      } else {
        self.power();
      }
    }
  }, this.__delay);
};

exports.connect = function(stepPin, directionPin, opts) {
  return new L293D(stepPin, directionPin, opts);
};

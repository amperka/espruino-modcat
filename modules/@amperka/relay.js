
var Relay = function(pin) {
  this.__pin = pin;
  this.__on = false;

  this.__blinkTimeoutID = null;

  this.__pin.mode('output');
};

// Переключает реле на противоположное значение и значение val
Relay.prototype.toggle = function(val) {
  if (val === undefined) {
    this.__blinkStop();
    this.__on = !this.__on;
  } else {
    this.__on = !!val;
  }
  digitalWrite(this.__pin, this.__on);
  return this;
};

// Включает реле
Relay.prototype.turnOn = function() {
  this.__blinkStop();
  this.toggle(true);
};

// Отключает реле
Relay.prototype.turnOff = function() {
  this.__blinkStop();
  this.toggle(false);
};

// Возвращает текущее состояние реле
Relay.prototype.isOn = function() {
  return this.__on;
};

// Останавливает действия по таймауту
Relay.prototype.__blinkStop = function() {
  if (this.__blinkTimeoutID) {
    clearTimeout(this.__blinkTimeoutID);
    this.__blinkTimeoutID = null;
  }
};

// Включает реле на onTime секунд раз в period секунд
Relay.prototype.blink = function(onTime, period) {
  if (onTime < 0.2) {
    return new Error('onTime must be > 0.2s');
  }

  if (period && period < onTime + 0.2) {
    return new Error('Period must be > onTime + 0.2s');
  }
  this.__blinkStop();
  var self = this;
  if (period) {
    this.__blinkTimeoutID = setInterval(function(){
      self.toggle(true);
      setTimeout(function(){
        self.toggle(false);
      }, onTime*1000);
    }, period * 1000);
  } else {
    this.toggle(true);
    setTimeout(function(){
      self.toggle(false);
    }, onTime*1000);
  }
};

exports.connect = function(pin) {
  return new Relay(pin);
};

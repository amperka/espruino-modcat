var Relay = function(pin) {
  this._pin = pin;
  this._on = false;

  this._blinkTimeoutID = null;

  this._pin.mode('output');
};

// Переключает реле на противоположное значение и значение val
Relay.prototype.toggle = function(val) {
  if (val === undefined) {
    this._blinkStop();
    this._on = !this._on;
  } else {
    this._on = !!val;
  }
  digitalWrite(this._pin, this._on);
  return this;
};

// Включает реле
Relay.prototype.turnOn = function() {
  this._blinkStop();
  this.toggle(true);
};

// Отключает реле
Relay.prototype.turnOff = function() {
  this._blinkStop();
  this.toggle(false);
};

// Возвращает текущее состояние реле
Relay.prototype.isOn = function() {
  return this._on;
};

// Останавливает действия по таймауту
Relay.prototype._blinkStop = function() {
  if (this._blinkTimeoutID) {
    clearTimeout(this._blinkTimeoutID);
    this._blinkTimeoutID = null;
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
  this._blinkStop();
  var self = this;
  if (period) {
    this._blinkTimeoutID = setInterval(function() {
      self.toggle(true);
      setTimeout(function() {
        self.toggle(false);
      }, onTime * 1000);
    }, period * 1000);
  } else {
    this.toggle(true);
    setTimeout(function() {
      self.toggle(false);
    }, onTime * 1000);
  }
};

exports.connect = function(pin) {
  return new Relay(pin);
};

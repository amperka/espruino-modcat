var Relay = function(pin) {
  this._pin = pin;
  this._on = false;

  this._blinkTimeoutID = null;

  this._pin.mode('output');
};

// Switches the relay to the opposite value and val value
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

// Turns on the relay
Relay.prototype.turnOn = function() {
  this._blinkStop();
  this.toggle(true);
};

// Disables the relay
Relay.prototype.turnOff = function() {
  this._blinkStop();
  this.toggle(false);
};

// Returns the current state of the relay
Relay.prototype.isOn = function() {
  return this._on;
};

// Stops actions by timeout
Relay.prototype._blinkStop = function() {
  if (this._blinkTimeoutID) {
    clearTimeout(this._blinkTimeoutID);
    this._blinkTimeoutID = null;
  }
};

// Turns on relay on onTime seconds once in period seconds
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

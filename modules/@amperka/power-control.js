var Power = function(pin) {
  this._pin = pin;
  this._on = false;
  this._duty = 1.0;

  this._blinkTimeoutID = null;
  this._blinkOnTime = 0;
  this._blinkOffTime = 0;

  this._pin.mode('output');
};

Power.prototype.toggle = function() {
  if (arguments.length === 0) {
    return this.toggle(!this._on);
  }

  this._clearBlink();
  this._blinkOnTime = 0;
  this._blinkOffTime = 0;
  this._on = !!arguments[0];
  this._update();

  return this;
};

Power.prototype.turnOn = function() {
  return this.toggle(true);
};

Power.prototype.turnOff = function() {
  return this.toggle(false);
};

Power.prototype.isOn = function() {
  return this._on;
};

Power.prototype._clearBlink = function() {
  if (this._blinkTimeoutID) {
    clearTimeout(this._blinkTimeoutID);
    this._blinkTimeoutID = null;
  }
};

Power.prototype._blinkOn = function() {
  this._on = true;
  this._update();
  this._blinkTimeoutID = setTimeout(
    this._blinkOff.bind(this),
    this._blinkOnTime * 1000
  );
};

Power.prototype._blinkOff = function() {
  this._on = false;
  this._update();

  if (this._blinkOffTime) {
    this._blinkTimeoutID = setTimeout(
      this._blinkOn.bind(this),
      this._blinkOffTime * 1000
    );
  } else {
    this._blinkTimeoutID = null;
  }
};

Power.prototype.pulse = function(onTime, offTime) {
  if (
    this._blinkOnTime === onTime &&
    this._blinkOffTime &&
    this._blinkOffTime === offTime
  ) {
    return;
  }

  this._blinkOnTime = onTime;
  this._blinkOffTime = offTime;
  this._clearBlink();

  if (this._on) {
    this._blinkOff();
  } else {
    this._blinkOn();
  }
};

Power.prototype.power = function(value) {
  if (arguments.length === 0) {
    return this._duty;
  }

  value = Math.max(0.0, Math.min(value, 1.0));
  this._duty = value;
  this._update();

  return this;
};

Power.prototype._update = function() {
  var b = this._duty;
  if (b > 0 && b < 1.0) {
    analogWrite(this._pin, b * b * b * this._on, { freq: 100 });
  } else {
    digitalWrite(this._pin, this._on);
  }
};

exports.connect = function(pin) {
  return new Power(pin);
};

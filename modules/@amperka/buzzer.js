var Buzzer = function(pin) {
  this._pin = pin;
  this._on = false;
  this._frequency = 2000;

  this._beepTimeoutID = null;
  this._beepOnTime = 0;
  this._beepOffTime = 0;

  this._pin.mode('output');
};

Buzzer.prototype.toggle = function() {
  if (arguments.length === 0) {
    return this.toggle(!this._on);
  }

  this._clearBeep();
  this._beepOnTime = 0;
  this._beepOffTime = 0;
  this._on = !!arguments[0];
  this._update();

  return this;
};

Buzzer.prototype.turnOn = function() {
  return this.toggle(true);
};

Buzzer.prototype.turnOff = function() {
  return this.toggle(false);
};

Buzzer.prototype.isOn = function() {
  return this._on;
};

Buzzer.prototype._clearBeep = function() {
  if (this._beepTimeoutID) {
    clearTimeout(this._beepTimeoutID);
    this._beepTimeoutID = null;
  }
};

Buzzer.prototype._beepOn = function() {
  this._on = true;
  this._update();
  this._beepTimeoutID = setTimeout(
    this._beepOff.bind(this),
    this._beepOnTime * 1000
  );
};

Buzzer.prototype._beepOff = function() {
  this._on = false;
  this._update();

  if (this._beepOffTime) {
    this._beepTimeoutID = setTimeout(
      this._beepOn.bind(this),
      this._beepOffTime * 1000
    );
  } else {
    this._beepTimeoutID = null;
  }
};

Buzzer.prototype.beep = function(onTime, offTime) {
  if (
    this._beepOnTime === onTime &&
    this._beepOffTime &&
    this._beepOffTime === offTime
  ) {
    return;
  }

  this._beepOnTime = onTime;
  this._beepOffTime = offTime;
  this._clearBeep();

  if (this._on) {
    this._beepOff();
  } else {
    this._beepOn();
  }
};

Buzzer.prototype.frequency = function() {
  if (arguments.length === 0) {
    return this._frequency;
  }

  this._frequency = Math.clip(arguments[0], 0.0, 20000.0);
  this._update();

  return this;
};

Buzzer.prototype._update = function() {
  analogWrite(this._pin, 0.5 * this._on, { freq: this._frequency });
};

exports.connect = function(pin) {
  return new Buzzer(pin);
};

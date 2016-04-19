
var WaterFlow = function(pin, opts) {
  this._pin = pin;

  this._pin.mode('input_pullup');

  this._litres = 0;
  this._pulses = 0;

  this._pulseTimerID = null;

  this._speed = 0;

  opts = opts || {};

  this._avg = opts.averageLength || 100;
  this._pulsesPerLitre = opts.pulsesPerLitre || 450;
  this._minimumSpeed = opts.minimumSpeed || 1;

  this._lastTime = getTime();

  this._speedNumerator = this._avg / this._pulsesPerLitre;
  this._litresPerPulse = 1 / this._pulsesPerLitre;
  this._updatePeriod = 60 / (this._minimumSpeed * this._pulsesPerLitre * 1000);

  this._watch();
};

WaterFlow.prototype._watch = function() {
  setWatch(this._onChange.bind(this), this._pin, {
    repeat: true,
    edge: 'rising',
    debounce: 1
  });
};

WaterFlow.prototype._onChange = function() {
  this._pulses++;
  this._litres += this._litresPerPulse;

  if (this._pulseTimerID !== null) {
    clearTimeout(this._pulseTimerID);
    this._pulseTimerID = null;
    var time = getTime();
    this._speed = this._speedNumerator / (time - this._lastTime);
    this._lastTime = time;
  }

  var self = this;
  this._pulseTimerID = setTimeout(function() {
    self._pulseTimerID = null;
    self._speed = 0;
    this.emit('drain');
  }, this._updatePeriod);

  this.emit('pulse');
};

WaterFlow.prototype.volume = function(units) {
  switch (units) {
    case 'l': return this._litres;
    case 'cm^3': return this._litres * 1000;
    case 'm^3': return this._litres / 1000;
    default: return this._litres;
  }
};

WaterFlow.prototype.reset = function() {
  this._litres = 0;
  this._pulses = 0;
  this._lastTime = getTime();
};

WaterFlow.prototype.speed = function(units) {
  switch (units) {
    case 'l/min': return this._speed * 60 * 1000;
    case 'cm^3/min': return this._speed * 60 * 1000000;
    case 'm^3/min': return this._speed * 60;
    default: return this._speed * 60 * 1000;
  }
};

exports.connect = function(pin, opts) {
  return new WaterFlow(pin, opts);
};


var WaterFlow = function(pin, opts) {
  this._pin = pin;

  this._pin.mode('input_pulldown');

  this._litres = 0;
  this._pulses = 0;
  this._lastMeasuredLitres = 0;
  this._speed = 0;

  this._period = opts.measurePeriod || 10000;

  this._pulsesPerLitre = opts.pulsesPerLitre || 450;

  this._updateTimerID = null;

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
  this._litres += 1 / this._pulsesPerLitre;
  this.emit('pulseUpdate');
};

WaterFlow.prototype._speedUpdate = function() {
  var self = this;
  this._updateTimerID = setInterval(function() {
    self._speed = (self._litres - self._lastMeasuredLitres) / self._period;
    self._lastMeasuredLitres = self._litres;
    self.emit('speedUpdate');
  }, this._period);
};

WaterFlow.prototype.volume = function(units) {
  switch (units) {
    case 'litres': return this._litres;
    case 'cm3': return this._litres * 1000;
    case 'm3': return this._litres / 1000;
    case 'cm^3': return this._litres * 1000;
    case 'm^3': return this._litres / 1000;
    default:
      print('flowSensor module ERROR: no such measure units.');
      return undefined;
  }
};

WaterFlow.prototype.reset = function() {
  this._litres = 0;
  this._lastMeasuredLitres = 0;
  this._pulses = 0;
};

WaterFlow.prototype.startUpdate = function() {
  this._speedUpdate();
};

WaterFlow.prototype.stopUpdate = function() {
  if (this._updateTimerID !== null) {
    clearInterval(this._updateTimerID);
    this._updateTimerID = null;
  }
};

WaterFlow.prototype.speed = function(units) {
  switch (units) {
    case 'l/min': return this._speed * 60 * 1000;
    case 'cm^3/min': return this._speed * 60 * 1000000;
    case 'm^3/min': return this._speed * 60;
    case 'cm3/min': return this._speed * 60 * 1000000;
    case 'm3/min': return this._speed * 60;
    default:
      print('flowSensor module ERROR: no such measure units.');
      return undefined;
  }
};

exports.connect = function(pin, opts) {
  return new WaterFlow(pin, opts);
};

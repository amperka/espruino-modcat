
var WaterFlow = function(pin, opts) {
  this._pin = pin;

  this._pin.mode('input_pullup');

  this._litres = 0;
  this._pulses = 0;

  this._pulseTimerID = null;

  this._speed = 0;

  opts = opts || {};

  this._avg = opts.averageLength || 10;
  this._pulsesPerLitre = opts.pulsesPerLitre || 450;
  this._minimumSpeed = opts.minimumSpeed || 1;

  this._lastTime = getTime();

  this._litresPerPulse = 1 / this._pulsesPerLitre;
  console.log('_litresPerPulse ', this._litresPerPulse);
  this._speedNumerator = this._litresPerPulse / this._avg;
  console.log('_speedNumerator ', this._speedNumerator);
  this._updatePeriod = (60 * 1000) / (this._minimumSpeed * this._pulsesPerLitre);
  console.log('_updatePeriod ', this._updatePeriod);

  this._avgArray = new Array(this._avg); // [litres per second]
  this._avgIterator = 0;

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
    // [litres per second]
    this._avgArray[this._avgIterator] = this._speedNumerator / (time - this._lastTime);
    if (++this._avgIterator === this._avg) {
      this._avgIterator = 0;
    }

    this._lastTime = time;
  }

  var self = this;
  this._pulseTimerID = setTimeout(function() {
    self._pulseTimerID = null;
    self._speed = 0;
    self.emit('drain');
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

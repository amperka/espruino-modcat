
var WaterFlow = function(pin, opts) {
  this._pin = pin;

  this._pin.mode('input_pulldown');

  this._litres = 0;
  this._pulses = 0;

  this._pulseTimerID = null;

  this._speed = 0;

  opts = opts || {};

  this._avg = opts.averageLength || 10;
  this._pulsesPerLitre = opts.pulsesPerLitre || 450;
  this._minimumSpeed = opts.minimumSpeed || 5;

  this._litresPerPulse = 1 / this._pulsesPerLitre;
  // this._speedNumerator = this._litresPerPulse * this._avg;
  this._updatePeriod = (60 * 1000) / (this._minimumSpeed * this._pulsesPerLitre);

  this._avgArray = new Array(this._avg); // [litres per second]
  this._avgIterator = 0;

  this.reset();

  this._watch();
};

WaterFlow.prototype._watch = function() {
  var self = this;
  setWatch(function(e) {
    self._onChange(e);
  }, this._pin, {
    repeat: true,
    edge: 'rising'
  });
};

WaterFlow.prototype._onChange = function(e) {
  this._pulses++;
  this._litres += this._litresPerPulse;

  if (this._pulseTimerID !== null) {
    clearTimeout(this._pulseTimerID);
    this._pulseTimerID = null;

    this._avgArray[this._avgIterator++] = this._litresPerPulse / (e.time - e.lastTime);
    // this._avgArray[this._avgIterator++] = getTime();
    if (this._avgIterator === this._avg) {
      this._avgIterator = 0;
    }
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
  // var time = getTime();
  for (var i = 0; i < this._avg; ++i) {
    this._avgArray[i] = 0;
    // this._avgArray[i] = time;
  }
  this._litres = 0;
  this._pulses = 0;
};

WaterFlow.prototype.speed = function(units) {

  var speed = 0;
  for (var i = 0; i < this._avg; ++i) {
    speed = this._avgArray[i];
  }
  speed /= this._avg;

  // var last, curr;
  // curr = this._avgArray[this._avgIterator];
  // if (this._avgIterator === this._avg - 1) {
  //   last = this._avgArray[0];
  // } else {
  //   last = this._avgArray[this._avgIterator + 1];
  // }
  // var speed = this._speedNumerator / (curr - last);

  switch (units) {
    case 'l/min': return speed * 60;
    case 'cm^3/min': return speed * 60 * 1000;
    case 'm^3/min': return speed * 60 / 1000;
    default: return speed * 60;
  }
};

exports.connect = function(pin, opts) {
  return new WaterFlow(pin, opts);
};

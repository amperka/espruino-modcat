var Pid = function(opts) {
  opts = opts || {};
  this._target = opts.target||0;
  this._updateInterval = opts.updateInterval || 0.02;
  this._kp = opts.kp || 0;
  this._ki = opts.ki || 0;
  this._kd = opts.kd || 0;
  this._outputMin = opts.outputMin || 0;
  this._outputMax = opts.outputMax || 1;
  this._intervalID = null;
  this._calcK();
};

Pid.prototype._calcK = function() {
  this._kp = (this._kp < 0) ? 0 : this._kp;
  this._ki = (this._ki < 0) ? 0 : this._ki;
  this._kd = (this._kd < 0) ? 0 : this._kd;
  this._kip = this._ki * this._updateInterval;
  this._kdp = this._kd / this._updateInterval;
};

Pid.prototype._clearErrors = function() {
  this._sumError = 0;
  this._lastError = 0;
};

Pid.prototype.writeInput = function(writeInput) {
  this._input = writeInput;
};

Pid.prototype.update = function(opts) {
  this._target = opts.target || this._target;
  this._kp = opts.kp || this._kp;
  this._ki = opts.ki || this._ki;
  this._kd = opts.kd || this._kd;
  this._outputMin = opts.outputMin || this._outputMin;
  this._outputMax = opts.outputMax || this._outputMax;
  this._updateInterval = opts.updateInterval || this._updateInterval;
  this._clearErrors();
  this._calcK();
  if (opts.updateInterval && this._intervalID) {
    this.stop();
    this.play();
  }
};

Pid.prototype.tune = function(opts) {
  this._kp += opts.kp || 0;
  this._ki += opts.ki || 0;
  this._kd += opts.kd || 0;
  this._clearErrors();
  this._calcK();
};

Pid.prototype.play = function() {
  if (!this._intervalID) {
    this._intervalID = setInterval(
    this._compute.bind(this), this._updateInterval * 1000);
    this._clearErrors();
  }
};

Pid.prototype.stop = function() {
  if (this._intervalID) {
    clearInterval(this._intervalID);
  }
  this._intervalID = null;
};

Pid.prototype._compute = function() {

  var input = this._input();
  var error = this._target - input;

  var dError = error - this._lastError;
  this._sumError += error;

  var integralNormalized = this._kip * this._sumError;

  integralNormalized = E.clip(
    integralNormalized,
    this._outputMin,
    this._outputMax);

  var output = this._kp*error + integralNormalized - this._kdp * dError;

  output = E.clip(output, this._outputMin, this._outputMax);

  this._lastError = error;

  this.emit('compute', output);
};

exports.create = function(opts) {
  return new Pid(opts);
};

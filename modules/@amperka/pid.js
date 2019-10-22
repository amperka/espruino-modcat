// Simple PID-controller. For periodical polling only.
// Integration in _ti last tacts
// Differentiation - last tact only

var Pid = function(opts) {
  opts = opts || {};
  this._target = opts.target || 0;
  this._kp = opts.kp || 0;
  this._ki = opts.ki || 0;
  this._kd = opts.kd || 0;
  this._ti = opts.ti || 8;  // tacts of integration
  this._outputMin = opts.outputMin === undefined ? -1 : opts.outputMin;
  this._outputMax = opts.outputMax === undefined ? 1 : opts.outputMax;
  this._intervalId = null;
  this._sumError = 0;
  this._lastError = 0;
};

Pid.prototype._clearErrors = function() {
  this._sumError = 0;
  this._lastError = 0;
};

Pid.prototype.setup = function(opts) {
  this._target = opts.target === undefined ? this._target : opts.target;
  this._kp = opts.kp === undefined ? this._kp : opts.kp;
  this._ki = opts.ki === undefined ? this._ki : opts.ki;
  this._kd = opts.kd === undefined ? this._kd : opts.kd;
  this._ti = opts.ti === undefined ? this._ti : opts.ti;
  this._outputMin =
      opts.outputMin === undefined ? this._outputMin : opts.outputMin;
  this._outputMax =
      opts.outputMax === undefined ? this._outputMax : opts.outputMax;
  this._clearErrors();
};

Pid.prototype.tune = function(opts) {
  this._kp = opts.kp || 0;
  this._ki = opts.ki || 0;
  this._kd = opts.kd || 0;
  this._ti = opts.ti || 8;
  this._clearErrors();
};

Pid.prototype.update = function(input) {
  var error = this._target - input;

  var P = error;
  var I = this._sumError;
  var D = error - this._lastError;

  this._lastError = error;
  this._sumError = (this._sumError * this._ti + error) / (this._ti + 1);

  return E.clip(
      P * this._kp + I * this._ki + D * this._kd, 
      this._outputMin, this._outputMax);
};

Pid.prototype.run = function(repeat, interval) {
  if (!this._intervalID) {
    this._intervalID = setInterval(repeat, interval * 1000);
    this._clearErrors();
  }
};

Pid.prototype.stop = function() {
  if (this._intervalID) {
    clearInterval(this._intervalID);
  }
  this._intervalID = null;
};

exports.create = function(opts) {
  return new Pid(opts);
};

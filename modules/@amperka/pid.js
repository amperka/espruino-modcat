var Pid = function(opts) {
  opts = opts || {};
  this._target = opts.target || 0;
  this._kp = opts.kp || 0;
  this._ki = opts.ki || 0;
  this._kd = opts.kd || 0;
  this._outputMin = opts.outputMin || 0;
  this._outputMax = opts.outputMax === undefined ? 1 : opts.outputMax;
  this._lastTime = null;
  this._intervalId = null;
};

Pid.prototype._clearErrors = function() {
  this._sumError = 0;
  this._lastError = 0;
  this._lastTime = null;
};

Pid.prototype.setup = function(opts) {
  this._target = opts.target === undefined ? this._target : opts.target;
  this._kp = opts.kp === undefined ? this._kp : opts.kp;
  this._ki = opts.ki === undefined ? this._ki : opts.ki;
  this._kd = opts.kd === undefined ? this._kd : opts.kd;
  this._outputMin =
    opts.outputMin === undefined ? this._outputMin : opts.outputMin;
  this._outputMax =
    opts.outputMax === undefined ? this._outputMax : opts.outputMax;
  this._clearErrors();
};

Pid.prototype.tune = function(opts) {
  this._kp += opts.kp || 0;
  this._ki += opts.ki || 0;
  this._kd += opts.kd || 0;
  this._clearErrors();
};

Pid.prototype.update = function(input) {
  var dt = getTime() - this._lastTime;
  var error = this._target - input;
  var dError = 0;
  var integralNormalized = 0;
  var differential = 0;

  if (this._lastTime) {
    dError = error - this._lastError;
    this._sumError += error;
    integralNormalized = this._ki * this._sumError * dt;
    differential = (this._kd * dError) / dt;
    integralNormalized = E.clip(
      integralNormalized,
      this._outputMin,
      this._outputMax
    );
  } else {
    this._clearErrors();
  }

  var output = this._kp * error + integralNormalized - differential;

  output = E.clip(output, this._outputMin, this._outputMax);

  this._lastError = error;
  this._lastTime = getTime();
  return output;
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

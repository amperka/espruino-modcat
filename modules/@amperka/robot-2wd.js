var Robot = function(opts) {
  opts = opts || {};
  var MotorShield = require('@amperka/motor').MotorShield;
  this._leftMotor = opts.leftMotor || MotorShield.M1;
  this._rightMotor = opts.rightMotor || MotorShield.M2;

  var acceleration = opts.acceleration || 0.2;
  this.acceleration(acceleration);

  this._speedIntervalID = null;

  this._init();
};

Robot.prototype._init = function() {
  var Motor = require('@amperka/motor');
  this.leftMotor = Motor.connect(this._leftMotor);
  this.rightMotor = Motor.connect(this._rightMotor);

  this.stop();
};

Robot.prototype.stop = function() {
  this._lCurrentSpeed = 0;
  this._rCurrentSpeed = 0;
  if (this._speedIntervalID) {
    clearInterval(this._speedIntervalID);
    this._speedIntervalID = null;
  }
  this.leftMotor.write(this._lCurrentSpeed);
  this.rightMotor.write(-this._rCurrentSpeed);
};

Robot.prototype.go = function(opts) {
  opts = opts || {};
  this._lSpeed = opts.l === undefined ? 0 : E.clip(opts.l, -1, 1);
  this._rSpeed = opts.r === undefined ? 0 : E.clip(opts.r, -1, 1);
  if (this._speedIntervalID === null) {
    this._speedIntervalID = setInterval(this._updateSpeed.bind(this), 20);
  }
};

Robot.prototype.acceleration = function(acceleration) {
  if (acceleration === undefined) {
    return this._acceleration;
  } else {
    this._acceleration = E.clip(acceleration, 0, 1);
  }
};

Robot.prototype._updateSpeed = function() {
  var accel = this.acceleration();
  this._lCurrentSpeed =
    accel * this._lSpeed + (1 - accel) * this._lCurrentSpeed;
  this._rCurrentSpeed =
    accel * this._rSpeed + (1 - accel) * this._rCurrentSpeed;
  this.leftMotor.write(this._lCurrentSpeed);
  this.rightMotor.write(-this._rCurrentSpeed);
};

exports.connect = function(opts) {
  return new Robot(opts);
};

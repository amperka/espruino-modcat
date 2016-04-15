var Robot = function(opts) {
  opts = opts || {};
  this._buzzerPin = opts.buzzer || P2;
  this._irReciever = opts.irReciever || P3;
  this._leftLineSensor = opts.leftLineSensor || A0;
  this._rightLineSensor = opts.rightLineSensor || A1;
  var MotorShield = require('@amperka/motor').MotorShield;
  this._leftMotor = opts.leftMotor || MotorShield.M1;
  this._rightMotor = opts.rightMotor || MotorShield.M2;
  this._leftEncoder = opts.leftEncoder || P10;
  this._rightEncoder = opts.rightEncoder || P9;
  this._ultrasonic = opts.ultrasonic || {
    trigPin: P12,
    echoPin: P13
  };
  this._servo = opts.servo || P8;

  var middle = opts.servoMiddle || 90;
  this.servoMiddle(middle);
  var sector = opts.servoLookupSector || 90;
  this.servoLookupSector(sector);
  var acceleration = opts.acceleration || 0.2;
  this.acceleration(acceleration);

  this._speedIntervalID = null;

  this._init();
};

Robot.prototype._init = function() {
  this.voice = require('@amperka/buzzer').connect(this._buzzerPin);
  this.receiver = require('@amperka/ir-receiver').connect(this._irReciever);
  var AnalogLineSensor = require('@amperka/analog-line-sensor');
  this.leftSensor = AnalogLineSensor.connect(this._leftLineSensor);
  this.rightSensor = AnalogLineSensor.connect(this._rightLineSensor);
  var Motor = require('@amperka/motor');
  this.leftMotor = Motor.connect(this._leftMotor);
  this.rightMotor = Motor.connect(this._rightMotor);
  var DigitalLineSensor = require('@amperka/digital-line-sensor');
  this.leftEncoder = DigitalLineSensor.connect(this._leftEncoder);
  this.rightEncoder = DigitalLineSensor.connect(this._rightEncoder);
  this.ultrasonic = require('@amperka/ultrasonic').connect(this._ultrasonic);
  this.servo = require('@amperka/servo').connect(this._servo);

  this.stop();
  this.lookAt(0);
};

Robot.prototype.stop = function() {
  this._lCurrentSpeed = 0;
  this._rCurrentSpeed = 0;
  if (this._speedIntervalID) {
    clearInterval(this._speedIntervalID);
    this._speedIntervalID = null;
  }
  this.leftMotor.write(this._lCurrentSpeed);
  this.rightMotor.write(this._rCurrentSpeed);
};

exports.connect = function(opts) {
  return new Robot(opts);
};

// deprecated
Robot.prototype.beep = function() {
  this.voice.beep(0.5);
};

// servo
Robot.prototype.servoMiddle = function(degrees) {
  if (degrees === undefined) {
    return this._middle;
  } else {
    this._middle = E.clip(degrees, 0, 180);
  }
};

Robot.prototype.servoLookupSector = function(degrees) {
  if (degrees === undefined) {
    return this._sector;
  } else {
    this._sector = E.clip(degrees, 0, 180);
    this._halfSector = this._sector/2;
  }
};

Robot.prototype.lookAt = function(degrees) {
  if (degrees === undefined) {
    return this._lookAt;
  } else {
    this._lookAt = E.clip(degrees, -this._halfSector, this._halfSector);
    this.servo.write(this._middle - this._lookAt);
  }
};

Robot.prototype.acceleration = function(acceleration) {
  if (acceleration === undefined) {
    return this._acceleration;
  } else {
    this._acceleration = E.clip(acceleration, 0, 1);
  }
};

Robot.prototype.go = function(opts) {
  opts = opts || {};
  this._lSpeed = (opts.l === undefined) ? 0 : E.clip(opts.l, -1, 1);
  this._rSpeed = (opts.r === undefined) ? 0 : E.clip(opts.r, -1, 1);
  if (this._speedIntervalID === null) {
    this._speedIntervalID = setInterval(this._updateSpeed.bind(this), 20);
  }
};

Robot.prototype._updateSpeed = function() {
  var accel = this.acceleration();
  this._lCurrentSpeed = accel * this._lSpeed + (1-accel) * this._lCurrentSpeed;
  this._rCurrentSpeed = accel * this._rSpeed + (1-accel) * this._rCurrentSpeed;
  this.leftMotor.write(this._lCurrentSpeed);
  this.rightMotor.write(this._rCurrentSpeed);
};
/*
Robot.prototype.speed = function(speed) {
};

Robot.voice.prototype.melody();

Robot.acceleration();
Robot.distance();
Robot.scanTerritory();
Robot.findNearestObject();

// missions:
Robot.followLine();
Robot.writePath();

//Robot.path.add(); // Хмммм... Это про танец
//Robot.sensor.calibration();

Robot.distance();
Robot.distance();
Robot.distance();
Robot.distance();
Robot.distance();
Robot.distance();
*/

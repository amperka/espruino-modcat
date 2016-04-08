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
};

Robot.prototype.stop = function() {
  this.leftMotor.write(0);
  this.rightMotor.write(0);
};

exports.connect = function(opts) {
  return new Robot(opts);
};

// deprecated
Robot.prototype.beep = function() {
  this.voice.beep(0.5);
};

/*
Robot.prototype.lookAt = function(degrees) {
};

Robot.prototype.go = function(opts) {
  opts = opts || {};
};
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

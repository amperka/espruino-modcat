
var Predator = function(opts, code) {
	opts = opts || {};
	this._sensor = opts.sensor || P8;
	this._modulator = opts.modulator || P3;
	this._coder = opts.coder || P2;
	this._code = code || 0x362F362F;
	
	var Motor = require('@amperka/motor');
	this._leftMotor = Motor.connect(Motor.MotorShield.M1);
	this._rightMotor = Motor.connect(Motor.MotorShield.M2);
	
	this._pulses = [];
	var bits = 32;
	for (var i = 0; i < bits; ++i) {
		this._pulses.push(((code >> (bits - i)) & 1) * 1.7 + 0.6);
		this._pulses.push(10);
	}
	this._pulses.push(1);
	
	var myReceiver = require('@amperka/ir-receiver').connect(this._sensor);
	myReceiver.on('receive', function(code, repeat) {
	  if (Math.abs(code) > 1000000) {
		this.emit('hit', code);
	  }
	});
	
	analogWrite(this._modulator, 0.5, 38000);
};

Predator.prototype.shoot = function() {
  digitalPulse(this._coder, 1, this._pulses);
}

Predator.prototype.drive = function(l, r){
  this._leftMotor.write(-l);
  this._rightMotor.write(-r);
};

exports.connect = function(opts, code) {
  return new Predator(opts, code);
};


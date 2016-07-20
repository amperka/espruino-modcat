
var state = false;
var myReceiver = require('@amperka/ir-receiver').connect(P8);
myReceiver.on('receive', function(code, repeat) {
  if (Math.abs(code) > 1000000) {
    state = !state;
    digitalWrite(P10, state);
  }
});

/*var senseShooth = 0;
var state = true;
setWatch(function (e) {
  var dt = e.time - e.lastTime;
  if (e.state) {
    print('1');
    if (senseShooth++ > 50) {
      senseShooth = 0;
      state = !state;
      digitalWrite(P10, state);
    }
  } else {
    print('0');
  }
}, P8, {
   repeat: true,
   edge: 'both'
});*/

analogWrite(P3, 0.5, 38000);
/*var shoot = true;
setInterval(function() {
    shoot = !shoot;
    digitalWrite(P2, shoot);
}, 1);*/


function shoot(code) {
  var pulses = [];
  var bits = 32;
  for (var i = 0; i < bits; ++i) {
    pulses.push(((code >> (bits - i)) & 1) * 1.7 + 0.6);
    pulses.push(10);
  }
  pulses.push(1);
  digitalPulse(P2, 1, pulses);
}

setInterval(function () {
  shoot(0b00101010111100001111000010101010);
}, 3000);

var Motor = require('@amperka/motor');
var leftMotor = Motor.connect(Motor.MotorShield.M1);
var rightMotor = Motor.connect(Motor.MotorShield.M2);

var drive = function(l, r){
  leftMotor.write(-l);
  rightMotor.write(-r);
};

PrimarySerial.setup(9600);
var cmd = '';

var control = function(dataIn) {
  if (dataIn.charCodeAt(0) == 0x02) {
    if (dataIn[1] === ':') {
      var x = dataIn.charCodeAt(2);
      var y = dataIn.charCodeAt(4);
      l = (x - 128) / 127;
      r = (y - 128) / 127;
      drive(l, r);
      print(l, r);
    }
  }
};

PrimarySerial.on('data', function(data) {
  for (var i = 0; i < data.length; ++i) {
    if (data[i] === '\n') {
      control(cmd);
      cmd = '';
    } else {
      cmd += data[i];
    }
  }
});

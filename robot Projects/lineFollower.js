var speed = 0.5;

var robby = require('robot').connect();

var key = require('@amperka/ir-remote-controller');

var lineFollower = require('pid').create({
  target: 0,
  kp: 1.3,
  ki: 0.3,
  kd:0.01,
  outputMin: -speed,
  outputMax: speed,
  timeout: 50
});

var followLine = function() {
  lineFollower.run(function() {
      var input = robby.leftSensor.read() - robby.rightSensor.read();
      var output = lineFollower.update(input);
      robby.leftMotor.write(speed + output - Math.abs(output)/2);
      robby.rightMotor.write(speed - output - Math.abs(output)/2);
    }, 0.02);
};

robby.receiver.on('receive', function(code, repeat) {
  if (code === key.PLAY) {
    robby.beep();
    followLine();
  }
  else if (code === key.POWER) {
    robby.beep();
    lineFollower.stop();
    robby.stop();
  }
  else if (code === key.CROSS) {
    robby.beep();
    robby.leftSensor.calibrate({black: true});
    robby.rightSensor.calibrate({black: true});
  }
  else if (code === key.SQUARE) {
    robby.beep();
    robby.leftSensor.calibrate({white: true});
    robby.rightSensor.calibrate({white: true});
  }
  else if (code === key.PLUS) {
    speed += 0.1;
    lineFollower.setup({outputMin: -speed, outputMax: speed});
  }
  else if (code === key.MINUS) {
    speed -= 0.1;
    lineFollower.setup({outputMin: -speed, outputMax: speed});
  }
});



//robby.leftMotor.write(0.5)

/*
var myPID = require('pid').create({target: 0, kp: 1.2, ki: 0, kd: 0, outputMin: -1, outputMax:1});

var myBuzzer = require('buzzer').connect(P1);

var lineLeft = require('analog-line-sensor').connect(A1);
var lineRight = require('analog-line-sensor').connect(A0);

var myReceiver = require('ir-receiver').connect(P2);

var key = require('ir-remote-controller');

var Motor = require('motor');
 
// Подключаем мотор канала M1 на Motor Shield
var myMotor1 = Motor.connect(Motor.MotorShield.M1);
var myMotor2 = Motor.connect(Motor.MotorShield.M2);

var speed = 0;

var tune = 1;


function tuning(addendum) {
  
  if (tune === 0) {
    myPID.tune({kp: addendum});
  } else if (tune === 1) {
    myPID.tune({ki: addendum});
  } else if (tune === 2) {
    myPID.tune({kd: addendum});
  }

}


myPID.writeInput(function() {
  var diff = lineRight.read('percent') - lineLeft.read('percent');
  return diff;
});



myPID.on('compute', function(output) {
  
  if (output > 0) {
    myMotor1.write(speed);
    myMotor2.write(speed - output);
  } else {
    myMotor1.write(speed + output);
    myMotor2.write(speed);
  }
});


function setSpeed(u) {
  myMotor1.write(u*tune);
  myMotor2.write(u);
//  myPID.update({outputMin: -u, outputMax: u});
}



myReceiver.on('receive', function(code, repeat) {

  if (code == key.TOP) {
    myMotor1.write(speed*tune);
    myMotor2.write(speed);
    myBuzzer.beep(0.5);
  } 
  
  else if (code === key.LEFT) {
    myMotor1.write(0);
    myMotor2.write(speed);
    myBuzzer.beep(0.5);
  
  }
  else if (code === key.RIGHT) {
    myMotor1.write(speed*tune);
    myMotor2.write(0);
    myBuzzer.beep(0.5);

  }
    else if (code === key.BOTTOM) {
    myMotor1.write(-speed*tune);
    myMotor2.write(-speed);
    myBuzzer.beep(0.5);

  }
    else if (code == key.PLUS) {
    speed += 0.1;
    myBuzzer.beep(0.5);
  }
  else if (code == key.MINUS) {
    speed -= 0.1;
    myBuzzer.beep(0.5);
  }
    else if (code == key.POWER) {
    speed=0;
    setSpeed(speed);
    myBuzzer.beep(0.5);
  }
    else if (code == key.BLUE) {
    tune += 0.1;
    myBuzzer.beep(0.5);
  }
    else if (code == key.GREEN) {
    tune -= 0.1;
    myBuzzer.beep(0.5);
  }

  if (code==key.PLAY) {
    myPID.play();
    myBuzzer.beep(0.5);
  }
  else if (code == key.POWER) {
    speed=0;
    setSpeed(speed);
//    myPID.stop();
    myBuzzer.beep(0.5);

  }
  else if (code == key.PLUS) {
    speed += 0.1;
    myBuzzer.beep(0.5);
  }
  else if (code == key.MINUS) {
    speed -= 0.1;
    myBuzzer.beep(0.5);
  }
  else if (code == key.BLUE) {
    tuning(0.05);
    myBuzzer.beep(0.5);
  }
  else if (code == key.GREEN) {
    tuning(-0.05);
    myBuzzer.beep(0.5);
  }
  else if (code == key.CROSS) {
    lineLeft.calibrate({
      black: true
    });
    lineRight.calibrate({
      black: true
    });
    myBuzzer.beep(0.5);
  }
  else if (code == key.SQUARE) {
    lineLeft.calibrate({
      white: true
    });
    lineRight.calibrate({
      white: true
    });
    myBuzzer.beep(0.5);
  }
  
  else if (code == key.X)
  {
    tune = 0;
    myBuzzer.beep(0.5);
  }
  else if (code == key.Y)
  {
    tune = 1;
    myBuzzer.beep(0.5);
  }
  else if (code == key.Z)
  {
    tune = 2;
    myBuzzer.beep(0.5);
  }
  
});

*/

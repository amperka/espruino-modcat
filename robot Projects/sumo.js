var speed = 0.5;

var robby = require('robot').connect({servoMiddle: 86, acceleration: 0.8, servoLookupSector: 40});

var key = require('@amperka/ir-remote-controller');

var borderColor = 0.5;

var k = 1.8; // only for bad motor
var attackDistance = 400;
var distance = 0;
var kFiltration = 0.5;

var state;

var stateCheck = function() {
  switch (state) {
      case 'seek':
      if (checkSensors()) {
        robby.stop();
        state = 'goBack';
      }
      else if (distance < attackDistance) {
        state = 'attack';
      } else {
        robby.go({l: -speed*k, r: speed});
      }
      break;
    case 'goBack':
      robby.go({l: -speed*k, r: -speed});
      if (!checkSensors()) {
        state = 'seek';
      }
      break;
    case 'attack':
      robby.voice.beep(0.05);
      if (checkSensors()) {
        robby.stop();
        state = 'goBack';
      } else if (distance < attackDistance) {
        robby.go({l: speed*k, r: speed});    
      } else {
        state = 'seek';
      }
      break;
    default:
      state = 'seek';
  }
};

var checkSensors = function() {
    var leftColor = robby.leftSensor.read();
    var rightColor = robby.rightSensor.read();
    return ((leftColor > borderColor) || (rightColor > borderColor));
};

var seek = function() {
  if (!intervalID) {
    intervalID = setInterval(function() {
      robby.ultrasonic.ping(function(err, val) {
        sectors.values[sectors.current] = val;
        sectors.current += sectors.direction;
        if (sectors.current === sectors.count - 1 ||
          sectors.current === 0) {
          sectors.direction = -sectors.direction;
        }
        robby.lookAt(robby.servoLookupSector() / 2 - sectors.current *
                  (robby.servoLookupSector() / sectors.count));
        robby.voice.frequency(5000-val*5);
        if (!err) {
        distance = distance*(1-kFiltration) + val * kFiltration;
        }
//        print(distance);        
      }, 'mm');
      
      stateCheck();
    }, 60);
  }
};

var sectors = {
  count: 5,
  current: 0,
  direction: 1
};


sectors.values = new Array(sectors.count);

var intervalID = null;

robby.receiver.on('receive', function(code, repeat) {
  for (var keyCode in key) {
    if (code === key[keyCode]) {
      robby.beep();
    }
  }
  if (code === key.TOP) {
    borderFinder.stop();
    robby.go({l: speed*k, r: speed});
  }
  else if (code === key.BOTTOM) {
    borderFinder.stop();
    robby.go({l: -speed*k, r: -speed});
  }
  else if (code === key.LEFT) {
    borderFinder.stop();
    robby.go({l: 0, r: speed});
  }
  else if (code === key.RIGHT) {
    borderFinder.stop();
    robby.go({l: speed*k, r: 0});
  }

  else if (code === key.PLUS) {
    speed += 0.1;
  }
  else if (code === key.MINUS) {
    speed -= 0.1;
  }
  else if (code === key.CROSS) {
    robby.leftSensor.calibrate({black: true});
    robby.rightSensor.calibrate({black: true});
  }
  else if (code === key.SQUARE) {
    robby.leftSensor.calibrate({white: true});
    robby.rightSensor.calibrate({white: true});
  }
  else if (code === key.POWER) {
    robby.stop();
    if (intervalID) {
      clearInterval(intervalID);
      intervalID = null;
    }
  }
  else if (code === key.PLAY) {
    seek();
  }
});

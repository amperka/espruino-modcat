var speed = 0.5;

var robby = require('robot').connect();

var key = require('@amperka/ir-remote-controller');

robby.receiver.on('receive', function(code, repeat) {
  if (code === key.TOP) {
    robby.beep();
    robby.go({l: speed, r: speed});
  }
  else if (code === key.BOTTOM) {
    robby.beep();
    robby.go({l: -speed, r: -speed});
  }
  else if (code === key.LEFT) {
    robby.beep();
    robby.go({l: 0, r: speed});
  }
  else if (code === key.RIGHT) {
    robby.beep();
    robby.go({l: speed, r: 0});
  }
  else if (code === key.PLUS) {
    speed += 0.1;
  }
  else if (code === key.MINUS) {
    speed -= 0.1;
  }
});



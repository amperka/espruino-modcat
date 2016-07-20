var robby = require('@amperka/robot').connect();
PrimarySerial.setup(115200);

/*var shield = require('@amperka/ir-receiver').connect(P8);
shield.on('receive', function(code, repeat) {
  console.log(code);
});*/

var senseShooth = false;

setWatch(function (e) {
  var dt = e.time - e.lastTime;
  if (!P8.read()) {
    print('hide');
    if (dt > 0.5) {
      print('shoot');
    }
  } else {
    print('show');
  }
}, P8, {
   repeat: true,
   edge: 'both'
});

var shoot = true;
analogWrite(P2, 0.5, 38000);
setInterval(function() {
  shoot = !shoot;
  digitalWrite(P3, shoot);
}, 1000);

var cmd = '';
var action = 10;

var drive = function(l, r){
  robby.go({l: -l, r: -r});
};

var control = function(dataIn) {
  if (dataIn.charCodeAt(0) == 0x02) {
    if (dataIn[1] === ':') {
      var x = dataIn.charCodeAt(2);
      var y = dataIn.charCodeAt(4);
      if (x < 128) {
        r = 1;
        l = x / 127;
      } else {
        r = (255 - x) / 127;
        l = 1;
      }
      var speed = 0;
      if (y < 128) {
        speed = (127 - y) / 127;
      } else {
        speed = -(y - 128) / 127;
      }
      r *= speed;
      l *= speed;
      drive(l, r);
      action = 5;
    }
  }
};

setInterval(function() {
  if (action-- === 0) {
    drive(0, 0);
  }
}, 100);

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

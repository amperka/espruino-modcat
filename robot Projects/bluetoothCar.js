var robby = require('@amperka/robot').connect();
var velocity = 0;
var defaultSpeed = 0.5;
PrimarySerial.setup(9600);

var drive = function(l, r){
  robby.go({l: -l, r: -r});
};

var control = function(dataIn) { // функция управления
  switch (dataIn) {
    case 'F': drive(velocity, velocity); break;
    case 'B': drive(-velocity, -velocity); break;
    case 'L': drive(-velocity, velocity); break;
    case 'R': drive(velocity, -velocity); break;
    case 'I': drive(defaultSpeed + velocity, defaultSpeed - velocity); break;
    case 'J': drive(-defaultSpeed - velocity, -defaultSpeed + velocity); break;
    case 'G': drive(defaultSpeed - velocity, defaultSpeed + velocity); break;
    case 'H': drive(-defaultSpeed + velocity, -defaultSpeed - velocity); break;
    case 'S': drive(0, 0); break;
    case 'q': velocity = 1; break;
    default: {
      // если к нам пришло значение от 0 до 9
      if ((dataIn >= 0) && (dataIn <= 9)) {
        velocity = 0.1 + dataIn * 0.1; // сохраняем новое значение скорости
      }
    } break;
  }
};

PrimarySerial.on('data', function(data) {
  control(data);
});

/*
  else if (dataIn == 'U')   //или если "U", зажигаем "передние фары"
  {
    uDigitalWrite(L2, HIGH);
    uDigitalWrite(L3, HIGH);
  }
  else if (dataIn == 'u')   //или если "u", гасим "передние фары"
  {
    uDigitalWrite(L2, LOW);
    uDigitalWrite(L3, LOW);
  }
  else if (dataIn == 'W')   //или если "W", зажигаем "задние фары"
  {
    uDigitalWrite(L1, HIGH);
    uDigitalWrite(L4, HIGH);
  }
  else if (dataIn == 'w')   ////или если "w", гасим "задние фары"
  {
    uDigitalWrite(L1, LOW);
    uDigitalWrite(L4, LOW);
  }
  */

/*
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
*/

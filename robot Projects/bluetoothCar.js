var robby = require('@amperka/robot').connect();
var velocity = 0;
var defaultSpeed = 0.5;
var cmd="";
PrimarySerial.setup(9600);
PrimarySerial.on('data', function (data) {     control(data);
  
});

var control = function(dataIn)  // функция управления
{
  if (dataIn == 'F') {         //Если пришла команда "F"
    drive(velocity, velocity);   //едем вперёд
  }
  else if (dataIn == 'B')    //или если пришла команда "B"
    drive(-velocity, -velocity); //едем назад
 
  else if (dataIn == 'L')    //или если пришла команда "L"
    drive(-velocity, velocity);  //поворачиваем налево на месте
 
  else if (dataIn == 'R')    //или если пришла команда "R"
    drive(velocity, -velocity);  //поворачиваем направо на месте
 
  else if (dataIn == 'I')    //или если пришла команда "I", едем вперёд и направо
    drive(defaultSpeed + velocity, defaultSpeed - velocity);
 
  else if (dataIn == 'J')    //или если пришла команда "J", едем назад и направо
    drive(-defaultSpeed - velocity, -defaultSpeed + velocity);
 
  else if (dataIn == 'G')   //или если пришла команда "I", едем вперёд и налево
    drive(defaultSpeed - velocity, defaultSpeed + velocity);
 
  else if (dataIn == 'H')   //или если пришла команда "H", едем назад и налево
    drive(-defaultSpeed + velocity, -defaultSpeed - velocity);
 
  else if (dataIn == 'S')   //или если пришла команда "S", стоим
    drive(0, 0);
 
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
 
  // если к нам пришло значение от 0 до 9
  else if ((dataIn >= 0) && (dataIn <= 9)) 
    velocity = 0.1 + dataIn * 0.1; //сохраняем новое значение скорости
 
  else if (dataIn == 'q') //если "q" - полный газ!
    velocity = 1;
};

var drive = function(l, r){
  robby.go({l: -l, r: -r});
};

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
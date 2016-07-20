
// connect(объект_пинов_подключения, код_выстрела);
var predator = require('predator').connect({}, 20000000);

// в тебя попали
shooter.on('hit', function (code) {
  digitalWrite(P10, true);
  setTimeout(function() {
    digitalWrite(P10, false);
  }, 2000);
  PrimarySerial.write(code + '\n');
});

// обработчик команд с телефона
var control = function(dataIn) {
  switch (dataIn.charCodeAt(0)) {
    case 0x02:
      if (dataIn[1] === ':') {
        l = (dataIn.charCodeAt(2) - 128) / 127;
        r = (dataIn.charCodeAt(4) - 128) / 127;
        predator.drive(l, r);
      }
    break;
    case 0x01:
      predator.shoot();
    break;
  }
};

// общаемся с Bluetooth по протоколу UART
PrimarySerial.setup(9600);
var cmd = '';
PrimarySerial.on('data', function(data) {
  // "собираем" символы в команду по маркеру '\n'
  for (var i = 0; i < data.length; ++i) {
    if (data[i] === '\n') {
      control(cmd);
      cmd = '';
    } else {
      cmd += data[i];
    }
  }
});

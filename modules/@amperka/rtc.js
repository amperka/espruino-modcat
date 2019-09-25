// Инициализация класса
var Rtc = function(i2c) {
  this._time = undefined;
  if (i2c) {
    this._i2c = i2c;
  } else {
    PrimaryI2C.setup({ sda: SDA, scl: SCL, bitrate: 100000 });
    this._i2c = PrimaryI2C;
  }
  this._address = 0x68;
  this.start();
};

// Метод записывает данные data в регистр reg
Rtc.prototype.write = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
Rtc.prototype.read = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg);
  return this._i2c.readFrom(this._address, count);
};

Rtc.prototype._decToBcd = function(val) {
  return Math.floor(val / 10) * 16 + (val % 10);
};

Rtc.prototype._bcdToDec = function(val) {
  return Math.floor(val / 16) * 10 + (val % 16);
};

Rtc.prototype._leadZero = function(val) {
  if (val < 10) {
    return '0' + val;
  } else {
    return '' + val;
  }
};

Rtc.prototype.setTime = function(time) {
  if (time instanceof Date) {
    this._time = time;
  } else if (time instanceof Object) {
    this._time = new Date(
      time.year,
      time.month - 1,
      time.day,
      time.hour,
      time.minute,
      time.second
    );
  } else if (typeof time === 'number') {
    this._time = new Date(time * 1000);
  } else if (typeof time === 'string') {
    this._time = new Date(Date.parse(time));
  } else {
    this._time = new Date(getTime() * 1000);
  }

  var halt = this.read(0x00, 1)[0] >> 7;
  this.write(0x00, [
    this._decToBcd(this._time.getSeconds()) | (halt << 7),
    this._decToBcd(this._time.getMinutes()),
    this._decToBcd(this._time.getHours()),
    this._decToBcd(this._time.getDay() + 1),
    this._decToBcd(this._time.getDate()),
    this._decToBcd(this._time.getMonth() + 1),
    this._decToBcd(this._time.getFullYear() - 2000)
  ]);
};

Rtc.prototype.getTime = function(unit) {
  var time = this.read(0x00, 7);
  this._time = new Date(
    this._bcdToDec(time[6]) + 2000,
    this._bcdToDec(time[5]) - 1,
    this._bcdToDec(time[4]),
    this._bcdToDec(time[2] & 0x3f),
    this._bcdToDec(time[1]),
    this._bcdToDec(time[0] & 0x7f)
  );

  var res = this._time;
  switch (unit) {
    case 'unixtime':
      res = Math.ceil(res.getTime() / 1000);
      break;
    case 'iso':
      res =
        res.getFullYear() +
        '-' +
        this._leadZero(res.getMonth() + 1) +
        '-' +
        this._leadZero(res.getDate()) +
        'T' +
        this._leadZero(res.getHours()) +
        ':' +
        this._leadZero(res.getMinutes()) +
        ':' +
        this._leadZero(res.getSeconds());
      break;
    default:
      break;
  }
  return res;
};

Rtc.prototype.start = function() {
  var byte = this.read(0x00, 1)[0];
  if (byte >> 7) {
    this.write(0x00, byte ^ 0x80);
  }
};

Rtc.prototype.stop = function() {
  var byte = this.read(0x00, 1)[0];
  if (byte >> 7 === 0) {
    this.write(0x00, byte ^ 0x80);
  }
};

// Экспортируем класс
exports.connect = function(i2c) {
  return new Rtc(i2c);
};

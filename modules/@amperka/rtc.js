// Инициализация класса
var DS130x = function(i2c, address) {
  this._i2c = i2c;
  address === undefined ? this._address = 0x68 : this._address = address;
};

// Метод записывает данные data в регистр reg
DS130x.prototype.write = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
DS130x.prototype.read = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg);
  return this._i2c.readFrom(this._address, count);
};

DS130x.prototype._decToBcd = function(val) {
  return Math.floor(val / 10) * 16 + (val % 10);
};

DS130x.prototype._bcdToDec = function(val) {
  return Math.floor(val / 16) * 10 + (val % 16);
};

DS130x.prototype.setTime = function(time) {
  var halt = this.read(0x00, 1)[0] >> 7;
  if (typeof time === 'number') {
    var date = new Date(time * 1000);
    this.write(0x00, [
      this._decToBcd(date.getSeconds()) | (halt << 7),
      this._decToBcd(date.getMinutes()),
      this._decToBcd(date.getHours()),
      this._decToBcd(date.getDay() + 1),
      this._decToBcd(date.getDate()),
      this._decToBcd(date.getMonth() + 1),
      this._decToBcd(date.getFullYear() - 2000)
    ]);
    return;
  }
  if (time === undefined) {
    this.write(0x00, [
      this._decToBcd(0) | (halt << 7),
      this._decToBcd(0),
      this._decToBcd(0),
      this._decToBcd(1),
      this._decToBcd(0),
      this._decToBcd(1),
      this._decToBcd(0)
    ]);
    return;
  }
  this.write(0x00, [
    this._decToBcd(time.second || 0x00) | (halt << 7),
    this._decToBcd(time.minute || 0x00),
    this._decToBcd(time.hour || 0x00),
    this._decToBcd(time.dayOfWeek || 0x01),
    this._decToBcd(time.day || 0x00),
    this._decToBcd(time.month || 0x01),
    this._decToBcd((time.year || 0x00) - 2000)
  ]);
};

DS130x.prototype.getTime = function(unit) {
  var time = this.read(0x00, 7);
  var rtcTime = {
    second: this._bcdToDec(time[0] & 0x7f),
    minute: this._bcdToDec(time[1]),
    hour: this._bcdToDec(time[2] & 0x3f),
    dayOfWeek: this._bcdToDec(time[3]),
    day: this._bcdToDec(time[4]),
    month: this._bcdToDec(time[5]),
    year: this._bcdToDec(time[6]) + 2000
  };
  if (unit === 'timestamp') {
    var ts = new Date(
      rtcTime.year,
      rtcTime.month - 1,
      rtcTime.day,
      rtcTime.hour,
      rtcTime.minute,
      rtcTime.second
    );
    return ts.getTime() / 1000;
  }
  if (unit === 'object') {
    rtcTime.month--;
    rtcTime.dayOfWeek--;
    return rtcTime;
  }
  console.log('RTC ERROR: no such units');
};

DS130x.prototype.start = function() {
  var byte = this.read(0x00, 1)[0];
  if (byte >> 7) {
    this.write(0x00, byte ^ 0x80);
  }
};

DS130x.prototype.stop = function() {
  var byte = this.read(0x00, 1)[0];
  if (byte >> 7 === 0) {
    this.write(0x00, byte ^ 0x80);
  }
};

// Экспортируем класс
exports.connect = function(i2c, address) {
  return new DS130x(i2c, address);
};

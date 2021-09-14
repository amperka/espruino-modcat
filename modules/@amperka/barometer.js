/**
 * Класс для работы с датчиком давления
 */
// Инициализация класса
var Barometer = function(opts) {
  opts = opts || {};
  this._i2c = opts.i2c || I2C1;
  this._address = opts.address || 0x5c;
};

// Метод записывает данные data в регистр reg
Barometer.prototype.writeI2C = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
Barometer.prototype.readI2C = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg | 0x80);
  return this._i2c.readFrom(this._address, count);
};

// Старт модуля
Barometer.prototype.init = function() {
  if (this.whoAmI() === 0xbd) {
    this.writeI2C(0x20, 0xc0);
    // LPS25HB нетороплив, немного подождем
    var t = getTime() + 0.1;
    while(getTime() < t);
    return;
  }
  this.writeI2C(0x20, 0xe0);
};

// Температура
Barometer.prototype.temperature = function(units) {
  var data = this.readI2C(0x2b, 2);
  var temp = data[0] | (data[1] << 8);
  if (temp >= 32767) {
    temp -= 0xffff;
  }
  if (units === 'C') {
    temp = 42.5 + temp / 480;
  }
  return temp;
};

// Давление
Barometer.prototype.read = function(units) {
  var data = this.readI2C(0x28, 3);
  var baro = (data[1] << 8) | (data[2] << 16) || data[0];
  if (baro > 2147483647) {
    baro -= 0xffffffff;
  }
  switch (units) {
    case 'mmHg':
      baro = baro / 5460.8691;
      break;
    case 'Pa':
      baro = baro / 4096;
      break;
  }
  return baro;
};

// Метод возвращает идентификатор устройства
Barometer.prototype.whoAmI = function() {
  return this.readI2C(0x0f)[0];
};

// Экспортируем класс
exports.connect = function(opts) {
  return new Barometer(opts);
};

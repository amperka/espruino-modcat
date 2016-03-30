/**
 * Класс для работы с датчиком давления
 */
// Инициализация класса
var LPS331 = function(i2c, address) {
  this._i2c = i2c;
  address === undefined ? this._address = 0x5C : this._address = address;
};

// Метод записывает данные data в регистр reg
LPS331.prototype.writeI2C = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LPS331.prototype.readI2C = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg | 0x80);
  return this._i2c.readFrom(this._address, count);
};

// Старт модуля
LPS331.prototype.init = function() {
  this.writeI2C(0x20, 0xE0);
};

// Температура
LPS331.prototype.temperature = function(units) {
  var data = this.readI2C(0x2B, 2);
  var temp = data[0] | (data[1] << 8);
  if (temp >= 32767) {
    temp -= 0xFFFF;
  }
  if (units === 'C') {
    temp = 42.5 + temp / 480;
  }
  return temp;
};

// Давление
LPS331.prototype.read = function(units) {
  var data = this.readI2C(0x28, 3);
  var baro = data[1] << 8 | (data[2] << 16) || data[0];
  if (baro >2147483647) {
    baro -= 0xFFFFFFFF;
  }
  switch (units) {
    case 'Hq':
      baro = baro / 5460.8691;
      break;
    case 'P':
      baro = baro / 4096;
      break;
  }
  return baro;
};

// Метод возвращает идентификатор устройства
LPS331.prototype.whoAmI = function() {
  return this.readI2C(0x0F)[0];
};

// Экспортируем класс
exports.connect = function(i2c, address) {
  return new LPS331(i2c, address);
};

/**
 * Класс для работы с датчиком давления 
 */
// Инициализация класса
var LPS331 = function(i2c, address) {
  this._i2c = i2c;
  address === undefined ? this._address = 0x5C : this._address = address;
};

// Метод записывает данные data в регистр reg
LPS331.prototype.write = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LPS331.prototype.read = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg | 0x80);
  return this._i2c.readFrom(this._address, count);
};

// Старт модуля
LPS331.prototype.init = function() {
  this.write(0x20, 0xE0);
};

// Температура в raw
LPS331.prototype.getTemp = function() {
  var data = this.read(0x2B, 2);
  var temp = data[0] | (data[1] << 8);
  if (temp >= 32767) {
    temp -= 0xFFFF;
  }
  return temp;
};

// Температура в градусах цельсия
LPS331.prototype.getTempC = function() {
  var temp = this.getTemp();
  return 42.5 + temp / 480;
};

// Давление в raw
LPS331.prototype.getPressure = function() {
  var data = this.read(0x28, 3);
  var baro = data[1] << 8 | (data[2] << 16) || data[0];
  if (baro >2147483647) {
    baro -= 0xFFFFFFFF;
  }
  return baro;
};

// Давление в миллибарах
LPS331.prototype.getPressureMilliBars = function() {
  var baro = this.getPressure() / 4096;
  return baro;
};

// Давление в паскалях
LPS331.prototype.getPressurePascal = function() {
  var baro = this.getPressure() / 4096;
  return baro;
};

// Давление в мм ртутного столба
LPS331.prototype.getPressureHq = function() {
  var baro = this.getPressure() / 5460.8691;
  return baro;
};

// Метод возвращает идентификатор устройства
LPS331.prototype.whoAmI = function() {
  return this.read(0x0F)[0];
};

// Экспортируем класс
exports.connect = function(i2c, address) {
  return new LPS331(i2c, address);
};

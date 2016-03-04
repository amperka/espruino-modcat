// Инициализация класса
var DS130x = function(i2c, address) {
  this.__i2c = i2c;
  address === undefined ? this.__address = 0x68 : this.__address = address;
};

// Метод записывает данные data в регистр reg
DS130x.prototype.write = function (reg, data) {
  this.__i2c.writeTo(this.__address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
DS130x.prototype.read = function (reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this.__i2c.writeTo(this.__address, reg);
  return this.__i2c.readFrom(this.__address, count);
};

// Старт модуля
DS130x.prototype.init = function() {
  this.write(0x20, 0xE0);
};

// Экспортируем класс
exports.connect = function (i2c, address) {
  return new DS130x(i2c, address);
};

// Инициализация класса
var LIS3MDL = function(i2c, address) {
  this._i2c = i2c;
  this._sensitivity = 1 / 6842;
  address === undefined ? (this._address = 0x1c) : (this._address = address);
};

// Метод записывает данные data в регистр reg
LIS3MDL.prototype.write = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LIS3MDL.prototype.read = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg | 0x80);
  return this._i2c.readFrom(this._address, count);
};

// Старт модуля
LIS3MDL.prototype.init = function(opts) {
  // Temp compensation ON, X-axis, Y-axis in High perfomance
  var config20 = 0xcc; /* 11001100 */

  if (opts !== undefined && opts.frequency !== undefined) {
    if (opts.frequency === 10) {
      config20 = 0xd0; /* 11010000 */
    } else if (opts.frequency === 20) {
      config20 = 0xd4; /* 11010100 */
    } else if (opts.frequency === 40) {
      config20 = 0xd8; /* 11011000 */
    } else if (opts.frequency === 80) {
      config20 = 0xdc; /* 11011100 */
    }
  }
  this.write(0x20, config20);
  // 4 Gauss
  var config21 = 0x00;
  this._sensitivity = 1 / 6842;

  if (opts !== undefined && opts.sensitivity !== undefined) {
    if (opts.sensitivity === 8) {
      config21 = 0x20; /* 00100000 */
      this._sensitivity = 1 / 3421;
    } else if (opts.sensitivity === 12) {
      config21 = 0x40; /* 01000000 */
      this._sensitivity = 1 / 2281;
    } else if (opts.sensitivity === 16) {
      config21 = 0x60; /* 01100000 */
      this._sensitivity = 1 / 1711;
    }
  }
  this.write(0x21, config21);

  // Power On, Continuous-conversion mode
  this.write(0x22, 0x0);

  // Z-axis in High perfomance
  this.write(0x23, 0x8 /* 00001000 */);
};

// Метод возвращает данные с магнитометра
LIS3MDL.prototype._getRaw = function() {
  var data = this.read(0x28, 6);
  var result = {
    x: data[0] | (data[1] << 8),
    y: data[2] | (data[3] << 8),
    z: data[4] | (data[5] << 8)
  };
  if (result.x >= 32767) {
    result.x -= 0xffff;
  }
  if (result.y >= 32767) {
    result.y -= 0xffff;
  }
  if (result.z >= 32767) {
    result.z -= 0xffff;
  }
  return result;
};

// Метод возвращает данные магнитометра в гуссах
LIS3MDL.prototype.get = function(units) {
  var m = this._getRaw();
  if (units !== undefined && units === 'G') {
    m.x = m.x * this._sensitivity;
    m.y = m.y * this._sensitivity;
    m.z = m.z * this._sensitivity;
  }

  return m;
};

// Метод возвращает идентификатор устройства
LIS3MDL.prototype.whoAmI = function() {
  return this.read(0x0f)[0];
};

// Экспортируем класс
exports.connect = function(i2c, address) {
  return new LIS3MDL(i2c, address);
};

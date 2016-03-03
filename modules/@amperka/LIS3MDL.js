// Инициализация класса
var LIS3MDL = function(i2c, address) {
  this.__i2c = i2c;
  this.__sensitivity = 1 / 6842;
  address === undefined ? this.__address = 0x1C : this.__address = address;
};

// Метод записывает данные data в регистр reg
LIS3MDL.prototype.write = function (reg, data) {
  this.__i2c.writeTo(this.__address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LIS3MDL.prototype.read = function (reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this.__i2c.writeTo(this.__address, reg | 0x80);
  return this.__i2c.readFrom(this.__address, count);
};

// Старт модуля
LIS3MDL.prototype.init = function(opts) {
  // Temp compensation ON, X-axis, Y-axis in High perfomance
  var config20 = 0b11001100;

  if (opts !== undefined && opts.frequency !== undefined) {
    if (opts.frequency === 10) {
      config20 = 0b11010000;
    }
    if (opts.frequency === 20) {
      config20 = 0b11010100;
    }
    if (opts.frequency === 40) {
      config20 = 0b11011000;
    }
    if (opts.frequency === 80) {
      config20 = 0b11011100;
    }
  }
  this.write(0x20, config20);
  // 4 Gauss
  var config21 = 0b00000000;
  this.__sensitivity = 1 / 6842;

  if (opts !== undefined && opts.sensitivity !== undefined) {
    if (opts.sensitivity === 8) {
      config21 = 0b00100000;
      this.__sensitivity = 1 / 3421;
    }
    if (opts.sensitivity === 12) {
      config21 = 0b01000000;
      this.__sensitivity = 1 / 2281;
    }
    if (opts.sensitivity === 16) {
      config21 = 0b01100000;
      this.__sensitivity = 1 / 1711;
    }
  }
  this.write(0x21, config21);

  // Power On, Continuous-conversion mode
  this.write(0x22, 0b00000000);

  // Z-axis in High perfomance
  this.write(0x23, 0b00001000);
};

// Метод возвращает данные с магнитометра
LIS3MDL.prototype._getRaw = function() {
  var data = this.read(0x28, 6);
  var result = {
    'x': data[0] | (data[1] << 8),
    'y': data[2] | (data[3] << 8),
    'z': data[4] | (data[5] << 8)
  };
  if (result.x >= 32767) {
    result.x -= 0xFFFF;
  }
  if (result.y >= 32767) {
    result.y -= 0xFFFF;
  }
  if (result.z >= 32767) {
    result.z -= 0xFFFF;
  }
  return result;
};

// Метод возвращает данные магнитометра в гуссах
LIS3MDL.prototype.get = function(units) {
  var m = this._getRaw();
  if (units !== undefined && units === 'G') {
    m.x = m.x * this.__sensitivity;
    m.y = m.y * this.__sensitivity;
    m.z = m.z * this.__sensitivity;
  }
  
  return m;
};

// Метод возвращает идентификатор устройства
LIS3MDL.prototype.whoAmI = function() {
  return this.read(0x0F)[0];
};

// Экспортируем класс
exports.connect = function (i2c, address) {
  return new LIS3MDL(i2c, address);
};

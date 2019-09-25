// Инициализация класса
var LIS331DLH = function(i2c, address) {
  this._i2c = i2c;
  address === undefined ? (this._address = 0x18) : (this._address = address);
  this._sensitivity = 2 / 32767;
};

// Значение ускорения свободного падения
LIS331DLH.prototype.G = 9.81;

// Метод записывает данные data в регистр reg
LIS331DLH.prototype.writeI2C = function(reg, data) {
  this._i2c.writeTo(this._address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LIS331DLH.prototype.readI2C = function(reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this._i2c.writeTo(this._address, reg | 0x80);
  return this._i2c.readFrom(this._address, count);
};

// Метод включает акселерометр
LIS331DLH.prototype.init = function(opts) {
  // Normal power, 50Hz, enable X, Y, Z;
  var config20 = 0x27; /* 00100111 */
  if (opts !== undefined && opts.frequency !== undefined) {
    if (opts.frequency === 100) {
      config20 = config20 | 0x8; /* 00001000 */
    } else if (opts.frequency === 400) {
      config20 = config20 | 0x10; /* 00010000 */
    } else if (opts.frequency === 1000) {
      config20 = config20 | 0x18; /* 00011000 */
    }
  }
  this.writeI2C(0x20, config20);

  // No High Pass filter
  var config21 = 0x00;

  if (opts !== undefined && opts.highPassFilter !== undefined) {
    if (opts.highPassFilter === 8) {
      config21 = 0x10; /* 00010000 */
    } else if (opts.highPassFilter === 16) {
      config21 = 0x11; /* 00010001 */
    } else if (opts.highPassFilter === 32) {
      config21 = 0x12; /* 00010010 */
    } else if (opts.highPassFilter === 64) {
      config21 = 0x13; /* 00010011 */
    }
  }
  this.writeI2C(0x21, config21);

  // Maximum sensitivity is 2G
  var config23 = 0x00;
  this._sensitivity = 2 / 32767;
  if (opts !== undefined && opts.maxAccel !== undefined) {
    if (opts.maxAccel === 4) {
      config23 = 0x11; /* 00010001 */
      this._sensitivity = 4 / 32767;
    }
    if (opts.maxAccel === 8) {
      config23 = 0x31; /* 00110001 */
      this._sensitivity = 8 / 32767;
    }
  }
  this.writeI2C(0x23, config23);
};

// Метод возвращает массив показаний акселерометра
LIS331DLH.prototype.read = function(units) {
  var d = this.readI2C(0x28, 6);
  // reconstruct 16 bit data
  var res = {
    x: d[0] | (d[1] << 8),
    y: d[2] | (d[3] << 8),
    z: d[4] | (d[5] << 8)
  };
  if (res.x >= 32767) {
    res.x -= 65536;
  }
  if (res.y >= 32767) {
    res.y -= 65536;
  }
  if (res.z >= 32767) {
    res.z -= 65536;
  }

  if (units === 'G') {
    res = {
      x: res.x * this._sensitivity,
      y: res.y * this._sensitivity,
      z: res.z * this._sensitivity
    };
  }
  if (units === 'a') {
    res = {
      x: res.x * this._sensitivity * this.G,
      y: res.y * this._sensitivity * this.G,
      z: res.z * this._sensitivity * this.G
    };
  }
  return res;
};

// Метод возвращает идентификатор устройства
LIS331DLH.prototype.whoAmI = function() {
  return this.readI2C(0x0f)[0];
};

// Экспортируем класс
exports.connect = function(i2c, address) {
  return new LIS331DLH(i2c, address);
};

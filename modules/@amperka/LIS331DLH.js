// Инициализация класса
var LIS331DLH = function (i2c, address) {
    this.__i2c = i2c;
    address === undefined ? this.__address = 0x18 : this.__address = address;
    this.__sensitivity =  2 / 32767;
};

// Значение ускорения свободного падения
LIS331DLH.prototype.G = 9.81;

// Метод записывает данные data в регистр reg
LIS331DLH.prototype.write = function (reg, data) {
  this.__i2c.writeTo(this.__address, [reg, data]);
};

// Метод производит чтение из регистра reg количестов байт count
LIS331DLH.prototype.read = function (reg, count) {
  if (count === undefined) {
    count = 1;
  }
  this.__i2c.writeTo(this.__address, reg | 0x80);
  return this.__i2c.readFrom(this.__address, count);
};

// Метод включает акселерометр
LIS331DLH.prototype.init = function (opts) {
  // Normal power, 50Hz, enable X, Y, Z;
  var config20 = 0b00100111;
  if (opts !== undefined && opts.frequency !== undefined) {
    if (opts.frequency === 100) {
      config20 = config20 | 0b00001000;
    }
    if (opts.frequency === 400) {
      config20 = config20 | 0b00010000;
    }
    if (opts.frequency === 1000) {
      config20 = config20 | 0b00011000;
    }
  }
  this.write(0x20, config20);

  // No High Pass filter
  var config21 = 0x00;

  if (opts !== undefined && opts.highPassFilter !== undefined) {
    if (opts.highPassFilter === 8) {
      config21 = 0b00010000;
    }
    if (opts.highPassFilter === 16) {
      config21 = 0b00010001;
    }
    if (opts.highPassFilter === 32) {
      config21 = 0b00010010;
    }
    if (opts.highPassFilter === 64) {
      config21 = 0b00010011;
    }
  }
  this.write(0x21, config21);

  // Maximum sensitivity is 2G
  var config23 = 0b00000001;
  this.__sensitivity = 2 / 32767;
  if (opts !== undefined && opts.maxAccel !== undefined) {
    if (opts.maxAccel === 4) {
      config23 = 0b00010001;
      this.__sensitivity = 4 / 32767;
    }
    if (opts.maxAccel === 8) {
      config23 = 0b00110001;
      this.__sensitivity = 8 / 32767;
    }
  }
  this.write(0x23, config23);
};

// Метод возвращает массив показаний акселерометра
LIS331DLH.prototype.get = function () {
  var d = this.read(0x28, 6);
  // reconstruct 16 bit data
  var a = [d[0] | (d[1] << 8), d[2] | (d[3] << 8), d[4] | (d[5] << 8)];
  // deal with sign bit
  if (a[0] >= 32767) {
    a[0] -= 65536;
  }
  if (a[1] >= 32767) {
    a[1] -= 65536;
  }
  if (a[2] >= 32767) {
    a[2] -= 65536;
  }
  return a;
};

// Метод возвращает ускорение по осям, как коэфициент от G
LIS331DLH.prototype.getG = function() {
  var a = this.get();
  return {
    'x': a[0] * this.__sensitivity,
    'y': a[1] * this.__sensitivity,
    'z': a[2] * this.__sensitivity
  };
};

// Метод возвращает ускорение по осям в метрах в секунду в квадрате
LIS331DLH.prototype.getM = function() {
  var a = this.get();
  return {
    'x': a[0] * this.__sensitivity * this.G,
    'y': a[1] * this.__sensitivity * this.G,
    'z': a[2] * this.__sensitivity * this.G
  };
};

// Метод возвращает идентификатор устройства
LIS331DLH.prototype.whoAmI = function() {
  return this.read(0x0F)[0];
};

// Экспортируем класс
exports.connect = function (i2c, address) {
  return new LIS331DLH(i2c, address);
};

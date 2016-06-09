/**
 * Библиотека для работы с IMU10 модулем, реализующая ИНС
 */

var IMU10 = function(opts) {
  opts = opts || {};
  this._i2c = opts.i2c || PrimaryI2C;                 // Шина I2C
  this._baro = opts.baro || 0x5C;                     // Адрес бароматра
  this._accl = opts.accl || 0x18;                     // Адрес акселерометра
  this._gyro = opts.gyro || 0x68;                     // Адрес гироскопа
  this._magn = opts.magn || 0x1C;                     // Адрес магнетометра

  this._zeroPressure = undefined;                     // Давление на уровне земли
  this._intId = undefined;                            // ID интервала

  // Настроим I2C
  if (!this._i2c.initialized) {
    this._i2c.setup({sda: SDA, scl: SCL, bitrate: 400000});
    this._i2c.initialized = 400000;
  }
};

IMU10.prototype.setup = function() {
  // Инициализация барометра
  this._writeI2C(this._baro, 0x20, 0xE0);   // 0b11100000 - включаем барометр на частоте в 12.5Гц

  // Инициализация акселерометра
  this._writeI2C(this._accl, 0x20, 0x37);   // 0b00110111 - включаем акселерометр на частоте 400Гц
  this._writeI2C(this._accl, 0x21, 0x00);   // 0b00000000 - выключаем ФВЧ
  this._writeI2C(this._accl, 0x23, 0x10);   // 0b00010000 - периодичное считывание, максимум 4G

  // Инициализация магнетометра
  this._writeI2C(this._magn, 0x20, 0xC2);   // 0b11000010 - включаем X,Y, HiPower, Fast data rate
  this._writeI2C(this._magn, 0x21, 0x20);   // 0b00100000 - чувствительность 8 gauss
  this._writeI2C(this._magn, 0x22, 0x00);   // 0b00000000 - no Low power, Continuous-conversion mode
  this._writeI2C(this._magn, 0x23, 0x08);   // 0b00001000 - HiPower for Z
  this._writeI2C(this._magn, 0x24, 0x80);   // 0x10000000 - включаем Fast Read

  // Инициализация гироскопа

};


// Метод читает регистры, начиная с reg, приборчика addr, данные в количестве count байт
IMU10.prototype._readI2C = function(addr, reg, count){
  count = count || 1;
  this._i2c.writeTo(addr, reg | 0x80);
  return this._i2c.readFrom(addr, count);
};

// Метода записывает в регистры, начиная с reg приборчика addr данные data
IMU10.prototype._writeI2C = function(addr, reg, data) {
  this._i2c.writeTo(addr, [reg, data]);
};

// Возвращает данные в гектоПаскалях
IMU10.prototype.baro = function() {
  var data = this._readI2C(this._baro, 0x28, 3);
  var baro = new Uint32Array(data.buffer, 0, 1);
  return baro[0] / 4096;
};

// Возвращает данные ускорений в коэфициенте G
IMU10.prototype.accl = function() {
  var coef = 4 / 32767;
  var data = this._readI2C(this._accl, 0x28, 6);
  var accl = new Int16Array(data.buffer, 0, 3);

  var res = {
    x: accl[0] * coef,
    y: accl[1] * coef,
    z: accl[2] * coef
  };
  return res;
};

IMU10.prototype.magn = function() {
  /*
   * В зависимости от чувствительности, 1 гаусс равняется:
   * Sen = 4G, 1G = 6842
   * Sen = 8G, 1G = 3421
   * Sen = 12G, 1G = 2281
   * Sen = 16G, 1G = 1711
   */
  var coef = 1 / 3421;
  var data = this._readI2C(this._accl, 0x28, 6);
  var magn = new Int16Array(data.buffer, 0, 3);
  var res = {
    x: magn[0] * coef,
    y: magn[1] * coef,
    z: magn[2] * coef
  };
  return res;
};

exports.connect = function(opts) {
  return new IMU10(opts);
};

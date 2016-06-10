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
  this._writeI2C(this._magn, 0x20, 0xFC);   // 0b11111100 - включаем X,Y на UHiPower, отключаем FDR, 80Гц
  this._writeI2C(this._magn, 0x21, 0x00);   // 0b00000000 - чувствительность 4 gauss
  this._writeI2C(this._magn, 0x22, 0x00);   // 0b00000000 - no Low power, Continuous-conversion mode
  this._writeI2C(this._magn, 0x23, 0x0C);   // 0b00001100 - UHiPower for Z
  this._writeI2C(this._magn, 0x24, 0x80);   // 0x10000000 - включаем Fast Read

  // Инициализация гироскопа
  this._writeI2C(this._gyro, 0x20, 0x0F);   // 0x10001111 - включаем 400/20, X, Y, Z
  this._writeI2C(this._gyro, 0x21, 0x00);   // 0x00100010 - normal HPF, cut off 8
  this._writeI2C(this._gyro, 0x22, 0x00);   // 0x00000000 - прерывания не используем
  this._writeI2C(this._gyro, 0x23, 0x00);   // 0x01001000 - continous update, 500 dps
  this._writeI2C(this._gyro, 0x24, 0x00);   // 0x00010001 - HPF
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

IMU10.prototype.all = function() {
  var acclData = this._readI2C(this._accl, 0x28, 6);
  var gyroData = this._readI2C(this._gyro, 0x28, 6);
  var magnData = this._readI2C(this._magn, 0x28, 6);
  
  var acclRes = new Int16Array(acclData.buffer, 0, 3);
  var gyroRes = new Int16Array(gyroData.buffer, 0, 3);
  var magnRes = new Int16Array(magnData.buffer, 0, 3);

  this.quaternion = {
    
  }
  return {
    accl: {
      x: acclRes[0] / 8192,
      y: acclRes[1] / 8192,
      z: acclRes[2] / 8192
    },
    gyro: {
      x: gyroRes[0] / 114,
      y: gyroRes[1] / 114,
      z: gyroRes[2] / 114
    },
    magn: {
      x: magnRes[0] / 6842,
      y: magnRes[1] / 6842,
      z: magnRes[2] / 6842
    }
  };
};

IMU10.prototype.madgwickAHRS = function(data) {

};

// Возвращает данные гироскопа в градусах в секунду в квадрате
IMU10.prototype.gyro = function() {
  var coef = 1 / 114;
  var data = this._readI2C(this._gyro, 0x28, 6);
  var gyro = new Int16Array(data.buffer, 0, 3);
  var res = {
    x: gyro[0] * coef,
    y: gyro[1] * coef,
    z: gyro[2] * coef
  };
  return res;
};

// Возвращает данные барометра в гектоПаскалях
IMU10.prototype.baro = function() {
  var data = this._readI2C(this._baro, 0x28, 3);
  var baro = new Uint32Array(data.buffer, 0, 1);
  return baro[0] / 4096;
};

// Возвращает данные акселерометра в коэфициенте G
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

// Возвращает данные магнитометра в Гауссах
IMU10.prototype.magn = function() {
  /*
   * В зависимости от чувствительности, 1 гаусс равняется:
   * Sen = 4G, 1G = 6842
   * Sen = 8G, 1G = 3421
   * Sen = 12G, 1G = 2281
   * Sen = 16G, 1G = 1711
   */
  var coef = 1 / 6842;
  var data = this._readI2C(this._magn, 0x28, 6);
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

/**
 * Библиотека для работы с IMU10 модулем, реализующая ИНС
 */



var IMU10 = function(i2c) {
  this._i2c = i2c || PrimaryI2C;
  this._i2c.setup({sda: SDA, scl: SCL, bitrate: 400000});
  this._baro = 0x5C;    // Адрес бароматра
  this._accl = 0x18;    // Адрес акселерометра
  this._gyro = 0x68;    // Адрес гироскопа
  this._magn = 0x1C;    // Адрес магнетометра
  this._baroAlt = 760;  // Текущее давление для высоты относительно инициализации
};

// Метод выводит устройства из состояния сна,
// дожидается окончания проверки устройств,
// запоминает текущее давление и вызывает callback по окончанию.
IMU10.protottype.init = function(callback) {
  this._writeI2C(this._baro, 0x20, 0xE0);   // Пробуждаем барометр и настраиваем частоту в 12.5Гц

  this._writeI2C(this._accl, 0x20, 0x27);   // Пробуждаем акселерометр и настраиваем на частоту 100Гц
  this._writeI2C(this._accl, 0x21, 0x10);   // Включаем высокочастотный фильтра с параметром 8
  this._writeI2C(this._accl, 0x23, 0x11);   // Настраиваем чувствительность на 4G (не истребитель)


};

IMU10.prototype.baro = function() {
  var data = this.readI2C(0x28, 3);
  var baro = data[1] << 8 | (data[2] << 16) | data[0];
  if (baro >2147483647) {
    baro -= 0xFFFFFFFF;
  }
  return baro;
};

IMU10.prototype.accel = function() {
  var coef = 1/8192; // 4 / 32767;
  var d = this._readI2C(this_accl, 0x28, 6);
  // reconstruct 16 bit data
  var res = {
    x: d[0] | (d[1] << 8),
    y: d[2] | (d[3] << 8),
    z: d[4] | (d[5] << 8)
  };

  if (res.x >= 32767) {
    res.x -=65536;
  }
  if (res.y >= 32767) {
    res.y -=65536;
  }
  if (res.z >= 32767) {
    res.z -=65536;
  }

  res = {
    x: res.x * coef,
    y: res.y * coef,
    z: res.z * coef
  };
  return res;
};

// Метод читает из I2C приборчика с адресом addr
// данные в размере count байт начиная с reg
IMU10.prototype._readI2C = function(addr, reg, count){
  if (!count) {
    count = 1;
  }
  this._i2c.writeTo(addr, reg | 0x80);
  return this._i2c.readFrom(addr, count);
};

// Метода записывает в I2C приборчик с адресом addr
// данные data, начиная с reg
IMU10.prototype._writeI2C = function(addr, reg, data) {
  this._i2c.writeTo(addr, [reg, data]);
};

exports.connect = function(i2c) {
  return new IMU10(i2c);
};

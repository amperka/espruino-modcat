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
  this._i2c.setup({sda: SDA, scl: SCL, bitrate: 400000});
};

IMU10.prototype.setup = function() {
  this._writeI2C(this._baro, 0x20, 0xE0);   // 0b11100000 - включаем барометр на частоте в 12.5Гц

  this._writeI2C(this._accl, 0x20, 0x37);   // 0b00110111 - включаем акселерометр на частоте 400Гц
  this._writeI2C(this._accl, 0x21, 0x00);   // 0b00010001 - включаем ФВЧ с коэфициентом 16
  this._writeI2C(this._accl, 0x23, 0x10);   // 0b00010000 - периодичное считывание, максимум 4G
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

// Возвращает данные в коэфициенте G
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


exports.connect = function(opts) {
  return new IMU10(opts);
};

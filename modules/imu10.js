/**
 * Библиотека для работы с IMU10 модулем, реализующая ИНС
 */

var IMU10 = function (opts) {
  opts = opts || {};
  this._i2c = opts.i2c || PrimaryI2C;                 // Шина I2C
  this._baro = opts.baro || 0x5C;                     // Адрес бароматра
  this._accl = opts.accl || 0x18;                     // Адрес акселерометра
  this._gyro = opts.gyro || 0x68;                     // Адрес гироскопа
  this._magn = opts.magn || 0x1C;                     // Адрес магнетометра

  this._zeroPressure = undefined;                     // Давление на уровне земли
  this._intId = undefined;                            // ID интервала
  this._position = {
    tm: getTime(), q0: 1, q1: 0, q2: 0, q3: 0
  };
  this._lastTime = getTime();

  // Настроим I2C
  if (!this._i2c.initialized) {
    this._i2c.setup({ sda: SDA, scl: SCL, bitrate: 400000 });
    this._i2c.initialized = 400000;
  }

};

IMU10.prototype.setup = function () {
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
  this._writeI2C(this._gyro, 0x20, 0x0F);
  this._writeI2C(this._gyro, 0x21, 0x00);
  this._writeI2C(this._gyro, 0x22, 0x00);
  this._writeI2C(this._gyro, 0x23, 0x00);
  this._writeI2C(this._gyro, 0x24, 0x00);
};


// Метод читает регистры, начиная с reg, приборчика addr, данные в количестве count байт
IMU10.prototype._readI2C = function (addr, reg, count) {
  count = count || 1;
  this._i2c.writeTo(addr, reg | 0x80);
  return this._i2c.readFrom(addr, count);
};

// Метода записывает в регистры, начиная с reg приборчика addr данные data
IMU10.prototype._writeI2C = function (addr, reg, data) {
  this._i2c.writeTo(addr, [reg, data]);
};

IMU10.prototype.all = function () {
  var acclData = this._readI2C(this._accl, 0x28, 6);
  var gyroData = this._readI2C(this._gyro, 0x28, 6);
  var magnData = this._readI2C(this._magn, 0x28, 6);

  var acclRes = new Int16Array(acclData.buffer, 0, 3);
  var gyroRes = new Int16Array(gyroData.buffer, 0, 3);
  var magnRes = new Int16Array(magnData.buffer, 0, 3);

  return {
    accl: {
      x: acclRes[0] / 8192,
      y: acclRes[1] / 8192,
      z: acclRes[2] / 8192
    },
    gyro: {
      x: gyroRes[0] / 114 / 60,
      y: gyroRes[1] / 114 / 60,
      z: gyroRes[2] / 114 / 60
    },
    magn: {
      x: magnRes[0] / 6842,
      y: magnRes[1] / 6842,
      z: magnRes[2] / 6842
    }
  };
};


// Возвращает данные гироскопа в градусах в секунду в квадрате
IMU10.prototype.gyro = function() {
  var coef = 1 / (114*60);
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

IMU10.prototype.madgwick = function(g, a) {
  var beta = 0.22;
  var recipNorm;
  var s0, s1, s2, s3;
  var qDot1, qDot2, qDot3, qDot4;
  var _2q0, _2q1, _2q2, _2q3, _4q0, _4q1, _4q2, _8q1, _8q2, q0q0, q1q1, q2q2, q3q3;

  // Rate of change of quaternion from gyroscope
  qDot1 = 0.5 * (-this._position.q1 * g.x - this._position.q2 * g.y - this._position.q3 * g.z);
  qDot2 = 0.5 * (this._position.q0 * g.x + this._position.q2 * g.z - this._position.q3 * g.y);
  qDot3 = 0.5 * (this._position.q0 * g.y - this._position.q1 * g.z + this._position.q3 * g.x);
  qDot4 = 0.5 * (this._position.q0 * g.z + this._position.q1 * g.y - this._position.q2 * g.x);

  // Compute feedback only if accelerometer measurement valid (avoids NaN in accelerometer normalisation)
  if (!((a.x === 0.0) && (a.y === 0.0) && (a.z === 0.0))) {

    // Normalise accelerometer measurement
    recipNorm = 1 / Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x *= recipNorm;
    a.y *= recipNorm;
    a.z *= recipNorm;

    // Auxiliary variables to avoid repeated arithmetic
    _2q0 = 2.0 * this._position.q0;
    _2q1 = 2.0 * this._position.q1;
    _2q2 = 2.0 * this._position.q2;
    _2q3 = 2.0 * this._position.q3;
    _4q0 = 4.0 * this._position.q0;
    _4q1 = 4.0 * this._position.q1;
    _4q2 = 4.0 * this._position.q2;
    _8q1 = 8.0 * this._position.q1;
    _8q2 = 8.0 * this._position.q2;
    q0q0 = this._position.q0 * this._position.q0;
    q1q1 = this._position.q1 * this._position.q1;
    q2q2 = this._position.q2 * this._position.q2;
    q3q3 = this._position.q3 * this._position.q3;

    // Gradient decent algorithm corrective step
    s0 = _4q0 * q2q2 + _2q2 * a.x + _4q0 * q1q1 - _2q1 * a.y;
    s1 = _4q1 * q3q3 - _2q3 * a.x + 4.0 * q0q0 * this._position.q1 - _2q0 * a.y - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * a.z;
    s2 = 4.0 * q0q0 * this._position.q2 + _2q0 * a.x + _4q2 * q3q3 - _2q3 * a.y - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * a.z;
    s3 = 4.0 * q1q1 * this._position.q3 - _2q1 * a.x + 4.0 * q2q2 * this._position.q3 - _2q2 * a.y;
    recipNorm = 1 / Math.sqrt(s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3); // normalise step magnitude
    s0 *= recipNorm;
    s1 *= recipNorm;
    s2 *= recipNorm;
    s3 *= recipNorm;

    // Apply feedback step
    qDot1 -= beta * s0;
    qDot2 -= beta * s1;
    qDot3 -= beta * s2;
    qDot4 -= beta * s3;
  }

  // Integrate rate of change of quaternion to yield quaternion
  var tm = getTime();
  var period = tm - this._position.tm; // this._position.tm - this._position.tm;
  this._position.tm = tm;
  this._position.q0 += qDot1 * period;
  this._position.q1 += qDot2 * period;
  this._position.q2 += qDot3 * period;
  this._position.q3 += qDot4 * period;

  // Normalise quaternion
  recipNorm = 1 / Math.sqrt(this._position.q0 * this._position.q0 + this._position.q1 * this._position.q1 + this._position.q2 * this._position.q2 + this._position.q3 * this._position.q3);
  this._position.q0 *= recipNorm;
  this._position.q1 *= recipNorm;
  this._position.q2 *= recipNorm;
  this._position.q3 *= recipNorm;
};

IMU10.prototype.start = function(callback) {
  var self = this;
  setInterval(function() {
    var data = self.all();
    self.madgwick(data.gyro, data.accl);
    callback(self._position);
  }, 100);
};

exports.connect = function(opts) {
  return new IMU10(opts);
};

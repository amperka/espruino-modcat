var regAddr = {
  IDENTIFICATION__MODEL_ID: 0x000,
  IDENTIFICATION__MODEL_REV_MAJOR: 0x001,
  IDENTIFICATION__MODEL_REV_MINOR: 0x002,
  IDENTIFICATION__MODULE_REV_MAJOR: 0x003,
  IDENTIFICATION__MODULE_REV_MINOR: 0x004,
  IDENTIFICATION__DATE_HI: 0x006,
  IDENTIFICATION__DATE_LO: 0x007,
  IDENTIFICATION__TIME: 0x008, // 16-bit

  SYSTEM__MODE_GPIO0: 0x010,
  SYSTEM__MODE_GPIO1: 0x011,
  SYSTEM__HISTORY_CTRL: 0x012,
  SYSTEM__INTERRUPT_CONFIG_GPIO: 0x014,
  SYSTEM__INTERRUPT_CLEAR: 0x015,
  SYSTEM__FRESH_OUT_OF_RESET: 0x016,
  SYSTEM__GROUPED_PARAMETER_HOLD: 0x017,

  SYSRANGE__START: 0x018,
  SYSRANGE__THRESH_HIGH: 0x019,
  SYSRANGE__THRESH_LOW: 0x01a,
  SYSRANGE__INTERMEASUREMENT_PERIOD: 0x01b,
  SYSRANGE__MAX_CONVERGENCE_TIME: 0x01c,
  SYSRANGE__CROSSTALK_COMPENSATION_RATE: 0x01e, // 16-bit
  SYSRANGE__CROSSTALK_VALID_HEIGHT: 0x021,
  SYSRANGE__EARLY_CONVERGENCE_ESTIMATE: 0x022, // 16-bit
  SYSRANGE__PART_TO_PART_RANGE_OFFSET: 0x024,
  SYSRANGE__RANGE_IGNORE_VALID_HEIGHT: 0x025,
  SYSRANGE__RANGE_IGNORE_THRESHOLD: 0x026, // 16-bit
  SYSRANGE__MAX_AMBIENT_LEVEL_MULT: 0x02c,
  SYSRANGE__RANGE_CHECK_ENABLES: 0x02d,
  SYSRANGE__VHV_RECALIBRATE: 0x02e,
  SYSRANGE__VHV_REPEAT_RATE: 0x031,

  SYSALS__START: 0x038,
  SYSALS__THRESH_HIGH: 0x03a,
  SYSALS__THRESH_LOW: 0x03c,
  SYSALS__INTERMEASUREMENT_PERIOD: 0x03e,
  SYSALS__ANALOGUE_GAIN: 0x03f,
  SYSALS__INTEGRATION_PERIOD: 0x040,

  RESULT__RANGE_STATUS: 0x04d,
  RESULT__ALS_STATUS: 0x04e,
  RESULT__INTERRUPT_STATUS_GPIO: 0x04f,
  RESULT__ALS_VAL: 0x050, // 16-bit
  RESULT__HISTORY_BUFFER_0: 0x052, // 16-bit
  RESULT__HISTORY_BUFFER_1: 0x054, // 16-bit
  RESULT__HISTORY_BUFFER_2: 0x056, // 16-bit
  RESULT__HISTORY_BUFFER_3: 0x058, // 16-bit
  RESULT__HISTORY_BUFFER_4: 0x05a, // 16-bit
  RESULT__HISTORY_BUFFER_5: 0x05c, // 16-bit
  RESULT__HISTORY_BUFFER_6: 0x05e, // 16-bit
  RESULT__HISTORY_BUFFER_7: 0x060, // 16-bit
  RESULT__RANGE_VAL: 0x062,
  RESULT__RANGE_RAW: 0x064,
  RESULT__RANGE_RETURN_RATE: 0x066, // 16-bit
  RESULT__RANGE_REFERENCE_RATE: 0x068, // 16-bit
  RESULT__RANGE_RETURN_SIGNAL_COUNT: 0x06c, // 32-bit
  RESULT__RANGE_REFERENCE_SIGNAL_COUNT: 0x070, // 32-bit
  RESULT__RANGE_RETURN_AMB_COUNT: 0x074, // 32-bit
  RESULT__RANGE_REFERENCE_AMB_COUNT: 0x078, // 32-bit
  RESULT__RANGE_RETURN_CONV_TIME: 0x07c, // 32-bit
  RESULT__RANGE_REFERENCE_CONV_TIME: 0x080, // 32-bit

  RANGE_SCALER: 0x096, // 16-bit - see STSW-IMG003 core/inc/vl6180x_def.h

  READOUT__AVERAGING_SAMPLE_PERIOD: 0x10a,
  FIRMWARE__BOOTUP: 0x119,
  FIRMWARE__RESULT_SCALER: 0x120,
  I2C_SLAVE__DEVICE_ADDRESS: 0x212,
  INTERLEAVED_MODE__ENABLE: 0x2a3
};

var VL6180X = function(opts) {
  opts = opts || {};
  if (opts.irqPin) {
    this._irqPin = opts.irqPin;
  } else {
    print('ERROR: you have setup irqPin');
    return;
  }
  if (opts.i2c) {
    this._i2c = opts.i2c;
  } else {
    print('ERROR: you have setup I2C');
    return;
  }
  this._address = 0x29;
  this._scaling = 0;
  this._ptpOffset = 0;
  this._scalerValues = new Uint16Array([0, 253, 127, 84]);

  this._init();
  if (!opts.notDefault) {
    this._configureDefault();
  }

  setWatch(this._handleIrq.bind(this), this._irqPin, {
    repeat: true,
    edge: 'rising'
  });

  this._waitForRange = false;
  this._waitForRangeCallback = null;
  this._waitForALS = false;
  this._waitForALSCallback = null;
};

VL6180X.prototype._handleIrq = function() {
  if (this._waitForRange) {
    this._waitForRange = false;
    var range = this._read8bit(regAddr.RESULT__RANGE_VAL);
    this._write8bit(regAddr.SYSTEM__INTERRUPT_CLEAR, 0x01);
    if (this._waitForRangeCallback) {
      if (range === 255) {
        this._waitForRangeCallback({ msg: 'out of range' }, range);
      } else {
        this._waitForRangeCallback(false, range);
      }
    }
  } else if (this._waitForALS) {
    this._waitForALS = false;
    var ambient = this._read16bit(regAddr.RESULT__ALS_VAL);
    this._write8bit(regAddr.SYSTEM__INTERRUPT_CLEAR, 0x02);
    if (this._waitForALSCallback) {
      if (ambient === 0) {
        this._waitForRangeCallback({ msg: 'out of range' }, ambient);
      } else {
        // convert raw data to lux according to datasheet (section 2.13.4)
        ambient = (0.32 * ambient) / 1.01;
        this._waitForALSCallback(false, ambient);
      }
    }
  }
};

VL6180X.prototype._init = function() {
  // Store part-to-part range offset so it can be adjusted if scaling is changed
  this._ptpOffset = this._read8bit(regAddr.SYSRANGE__PART_TO_PART_RANGE_OFFSET);

  if (this._read8bit(regAddr.SYSTEM__FRESH_OUT_OF_RESET) === 1) {
    this._scaling = 1;
    this._write8bit(0x207, 0x01);
    this._write8bit(0x208, 0x01);
    this._write8bit(0x096, 0x00);
    this._write8bit(0x097, 0xfd); // RANGE_SCALER = 253
    this._write8bit(0x0e3, 0x00);
    this._write8bit(0x0e4, 0x04);
    this._write8bit(0x0e5, 0x02);
    this._write8bit(0x0e6, 0x01);
    this._write8bit(0x0e7, 0x03);
    this._write8bit(0x0f5, 0x02);
    this._write8bit(0x0d9, 0x05);
    this._write8bit(0x0db, 0xce);
    this._write8bit(0x0dc, 0x03);
    this._write8bit(0x0dd, 0xf8);
    this._write8bit(0x09f, 0x00);
    this._write8bit(0x0a3, 0x3c);
    this._write8bit(0x0b7, 0x00);
    this._write8bit(0x0bb, 0x3c);
    this._write8bit(0x0b2, 0x09);
    this._write8bit(0x0ca, 0x09);
    this._write8bit(0x198, 0x01);
    this._write8bit(0x1b0, 0x17);
    this._write8bit(0x1ad, 0x00);
    this._write8bit(0x0ff, 0x05);
    this._write8bit(0x100, 0x05);
    this._write8bit(0x199, 0x05);
    this._write8bit(0x1a6, 0x1b);
    this._write8bit(0x1ac, 0x3e);
    this._write8bit(0x1a7, 0x1f);
    this._write8bit(0x030, 0x00);
    this._write8bit(regAddr.SYSTEM__FRESH_OUT_OF_RESET, 0);
  } else {
    // Sensor has already been initialized, so try to get scaling settings by
    // reading registers.
    var s = this._read16bit(regAddr.RANGE_SCALER);
    if (s === this._scalerValues[3]) {
      this._scaling = 3;
    } else if (s === this._scalerValues[2]) {
      this._scaling = 2;
    } else {
      this._scaling = 1;
    }
    // Adjust the part-to-part range offset value read earlier to account for
    // existing scaling. If the sensor was already in 2x or 3x scaling mode,
    // precision will be lost calculating the original (1x) offset, but this can
    // be resolved by resetting the sensor and Arduino again.
    this._ptpOffset *= this._scaling;
  }
};

VL6180X.prototype._write8bit = function(reg, val8bit) {
  this._i2c.writeTo(this._address, (reg >> 8) & 0xff, reg & 0xff, val8bit);
};

VL6180X.prototype._write16bit = function(reg, val16bit) {
  this._i2c.writeTo(
    this._address,
    (reg >> 8) & 0xff,
    reg & 0xff,
    (val16bit >> 8) & 0xff,
    val16bit & 0xff
  );
};

VL6180X.prototype._write32bit = function(reg, val32bit) {
  this._i2c.writeTo(
    this._address,
    (reg >> 8) & 0xff,
    reg & 0xff,
    (val32bit >> 24) & 0xff,
    (val32bit >> 16) & 0xff,
    (val32bit >> 8) & 0xff,
    val32bit & 0xff
  );
};

VL6180X.prototype._read8bit = function(reg) {
  this._i2c.writeTo(this._address, (reg >> 8) & 0xff, reg & 0xff);
  var data = this._i2c.readFrom(this._address, 1);
  return data[0];
};

VL6180X.prototype._read16bit = function(reg) {
  this._i2c.writeTo(this._address, (reg >> 8) & 0xff, reg & 0xff);
  var data = this._i2c.readFrom(this._address, 2);
  return (data[0] << 8) + data[1];
};

VL6180X.prototype._read32bit = function(reg) {
  this._i2c.writeTo(this._address, (reg >> 8) & 0xff, reg & 0xff);
  var data = this._i2c.readFrom(this._address, 4);
  return (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
};

VL6180X.prototype.setAddress = function(newAddr) {
  this._write8bit(regAddr.I2C_SLAVE__DEVICE_ADDRESS, newAddr & 0x7f);
  this._address = newAddr;
};

// Note that this function does not set up GPIO1 as an interrupt output as
// suggested, though you can do so by calling:
// this._write8bit(regAddr.SYSTEM__MODE_GPIO1, 0x10);
VL6180X.prototype._configureDefault = function() {
  // устанавливаем пин прерывания
  this._write8bit(regAddr.SYSTEM__MODE_GPIO1, 0x30);
  // "Recommended : Public registers"
  // readout__averaging_sample_period = 48
  this._write8bit(regAddr.READOUT__AVERAGING_SAMPLE_PERIOD, 0x30);
  // sysals__analogue_gain_light = 6 (ALS gain = 1 nominal, actually 1.01 according to Table 14 in datasheet)
  this._write8bit(regAddr.SYSALS__ANALOGUE_GAIN, 0x46);
  // sysrange__vhv_repeat_rate = 255
  // (auto Very High Voltage temperature recalibration after every 255 range measurements)
  this._write8bit(regAddr.SYSRANGE__VHV_REPEAT_RATE, 0xff);
  // sysals__integration_period = 99 (100 ms)

  // AN4545 incorrectly recommends writing to register 0x040;
  // 0x63 should go in the lower byte, which is register 0x041.
  this._write16bit(regAddr.SYSALS__INTEGRATION_PERIOD, 0x0063);
  // sysrange__vhv_recalibrate = 1 (manually trigger a VHV recalibration)
  this._write8bit(regAddr.SYSRANGE__VHV_RECALIBRATE, 0x01);

  // "Optional: Public registers"
  // sysrange__intermeasurement_period = 9 (100 ms)
  this._write8bit(regAddr.SYSRANGE__INTERMEASUREMENT_PERIOD, 0x09);
  // sysals__intermeasurement_period = 49 (500 ms)
  this._write8bit(regAddr.SYSALS__INTERMEASUREMENT_PERIOD, 0x31);
  // als_int_mode = 4 (regAddr.ALS new sample ready interrupt); range_int_mode = 4
  // (range new sample ready interrupt)
  this._write8bit(regAddr.SYSTEM__INTERRUPT_CONFIG_GPIO, 0x24);
  // Reset other settings to power-on defaults

  // sysrange__max_convergence_time = 49 (49 ms)
  this._write8bit(regAddr.SYSRANGE__MAX_CONVERGENCE_TIME, 0x31);
  // disable interleaved mode
  this._write8bit(regAddr.INTERLEAVED_MODE__ENABLE, 0);
  // reset range scaling factor to 1x
  this.setScaling(1);
};

VL6180X.prototype.setScaling = function(newScaling) {
  var DefaultCrosstalkValidHeight = 20; // default value of SYSRANGE__CROSSTALK_VALID_HEIGHT

  // do nothing if scaling value is invalid
  if (newScaling < 1 || newScaling > 3) {
    return;
  }

  this._scaling = newScaling;
  this._write16bit(regAddr.RANGE_SCALER, this._scalerValues[this._scaling]);
  // apply scaling on part-to-part offset
  this._write8bit(
    regAddr.SYSRANGE__PART_TO_PART_RANGE_OFFSET,
    this._ptpOffset / this._scaling
  );
  // apply scaling on CrossTalkValidHeight
  this._write8bit(
    regAddr.SYSRANGE__CROSSTALK_VALID_HEIGHT,
    DefaultCrosstalkValidHeight / this._scaling
  );
  // This function does not apply scaling to RANGE_IGNORE_VALID_HEIGHT.
  // enable early convergence estimate only at 1x scaling
  var rce = this._read8bit(regAddr.SYSRANGE__RANGE_CHECK_ENABLES);
  this._write8bit(
    regAddr.SYSRANGE__RANGE_CHECK_ENABLES,
    (rce & 0xfe) | (this._scaling === 1)
  );
};

// Performs a single-shot ranging measurement
VL6180X.prototype.range = function(callback) {
  this._write8bit(regAddr.SYSRANGE__START, 0x01);
  this._write8bit(regAddr.SYSTEM__INTERRUPT_CLEAR, 0x01);
  this._waitForRange = true;
  this._waitForRangeCallback = callback;
};

// Performs a single-shot ambient light measurement
VL6180X.prototype.ambient = function(callback) {
  this._write8bit(regAddr.SYSTEM__INTERRUPT_CLEAR, 0x02);
  this._write8bit(regAddr.SYSALS__START, 0x01);
  this._waitForALS = true;
  this._waitForALSCallback = callback;
};

exports.connect = function(opts) {
  return new VL6180X(opts);
};

exports.registers = function() {
  return regAddr;
};

// // // TODO
// // Starts continuous ranging measurements with the given period in ms
// // (10 ms resolution; defaults to 100 ms if not specified).
// VL6180X.prototype.startRangeContinuous = function(period) {
//   var periodReg = (period / 10) - 1;
//   periodReg = E.clip(periodReg, 0, 254);

//   this._write8bit(regAddr.SYSRANGE__INTERMEASUREMENT_PERIOD, periodReg);
//   this._write8bit(regAddr.SYSRANGE__START, 0x03);
// };

// // Starts continuous ambient light measurements with the given period in ms
// // (10 ms resolution; defaults to 500 ms if not specified).
// VL6180X.prototype.startAmbientContinuous = function(period) {
//   var periodReg = (period / 10) - 1;
//   periodReg = E.clip(periodReg, 0, 254);

//   this._write8bit(regAddr.SYSALS__INTERMEASUREMENT_PERIOD, periodReg);
//   this._write8bit(regAddr.SYSALS__START, 0x03);
// };

// // Starts continuous interleaved measurements with the given period in ms
// // (10 ms resolution; defaults to 500 ms if not specified). In this mode, each
// // ambient light measurement is immediately followed by a range measurement.
// //
// // The datasheet recommends using this mode instead of running "range and ALS
// // continuous modes simultaneously (i.e. asynchronously)".
// VL6180X.prototype.startInterleavedContinuous = function(period) {
//   var periodReg = (period / 10) - 1;
//   periodReg = E.clip(periodReg, 0, 254);

//   this._write8bit(regAddr.INTERLEAVED_MODE__ENABLE, 1);
//   this._write8bit(regAddr.SYSALS__INTERMEASUREMENT_PERIOD, periodReg);
//   this._write8bit(regAddr.SYSALS__START, 0x03);
// };

// // Stops continuous mode. This will actually start a single measurement of range
// // and/or ambient light if continuous mode is not active, so it's a good idea to
// // wait a few hundred ms after calling this function to let that complete
// // before starting continuous mode again or taking a reading.
// VL6180X.prototype.stopContinuous = function() {
//   this._write8bit(regAddr.SYSRANGE__START, 0x01);
//   this._write8bit(regAddr.SYSALS__START, 0x01);
//   this._write8bit(regAddr.INTERLEAVED_MODE__ENABLE, 0);
// };

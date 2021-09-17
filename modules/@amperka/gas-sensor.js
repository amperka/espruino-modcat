var Sensors = {
  MQ2: {
    rLoad: 5000,
    rClear: 9.83,
    gas: {
      LPG: { coef: [-0.45, 2.95], ppm: 1 }, // Liquefied gas
      CH4: { coef: [-0.38, 3.21], ppm: 1 }, // Methane
      H2: { coef: [-0.48, 3.32], ppm: 1 }, // Hydrogen
      SMOKE: { coef: [-0.42, 3.54], ppm: 1 } // Smoke
    }
  },
  MQ3: {
    rLoad: 200000,
    rClear: 60,
    gas: {
      C2H5OH: { coef: [-0.66, -0.62], ppm: 1 } // Alcohol vapors
    }
  },
  MQ4: {
    rLoad: 20000,
    rClear: 4.4,
    gas: {
      CH4: { coef: [-0.36, 2.54], ppm: 1 } // Methane
    }
  },
  MQ5: {
    rLoad: 20000,
    rClear: 6.5,
    gas: {
      LPG: { coef: [-0.39, 1.73], ppm: 1 }, // Liquefied gas
      CH4: { coef: [-0.42, 2.91], ppm: 1 } // Methane
    }
  },
  MQ6: {
    rLoad: 20000,
    rClear: 10,
    gas: {
      LPG: { coef: [-0.42, 2.91], ppm: 1 } // Liquefied gas
    }
  },
  MQ7: {
    rLoad: 10000,
    rClear: 27,
    gas: {
      CO: { coef: [-0.77, 3.38], ppm: 1 } // Carbon monoxide
    }
  },
  MQ8: {
    rLoad: 10000,
    rClear: 70,
    gas: {
      H2: { coef: [-1.52, 10.49], ppm: 1 } // Hydrogen
    }
  },
  MQ9: {
    rLoad: 10000,
    rClear: 9.8,
    gas: {
      LPG: { coef: [-0.48, 3.33], ppm: 1 }, // Liquefied gas
      CH4: { coef: [-0.38, 3.21], ppm: 1 }, // Methane
      CO: { coef: [-0.48, 3.1], ppm: 1 } // Carbon monoxide
    }
  },
  MQ135: {
    rLoad: 1000,
    rClear: 76.63,
    gas: {
      CO2: { coef: [-0.42, 6.87], ppm: 1 }
    }
  }
};

var GasSensor = function(opts) {
  opts = opts || {};
  if (opts.dataPin === undefined) {
    return new Error('Data pin is undefined');
  }

  if (opts.heatPin === undefined) {
    return new Error('Heat pin is undefined');
  }

  if (Sensors[opts.model] === undefined) {
    return new Error(
      'Error in model name. Use MQ2, MQ3, MQ4, MQ5, MQ6, MQ7, MQ8, MQ9'
    );
  }

  this._dataPin = opts.dataPin;
  this._heatPin = opts.heatPin;
  this._model = Sensors[opts.model];
  this._intId = null;

  this._coef = 1; // The ratio of current readings to readings by datasheet
  this._times = 5; // Number of reads to filter
  this._preheat = 30; // Warm-up time in seconds
};

// The function calibrates the sensor if no coef value is passed
// Returns the ratio of the current resistance to the resistance according to the datasheet
GasSensor.prototype.calibrate = function(coef) {
  if (coef) {
    this._coef = coef;
  } else {
    this._coef = this.calculateResistance() / this._model.rClear;
  }

  return this._coef;
};

// The method returns the filtered resistance of the sensor
GasSensor.prototype.calculateResistance = function() {
  var r = 0;
  for (var i = 0; i < this._times; i++) {
    r += this.getResistance();
  }
  r = r / this._times;
  return r;
};

// The method returns the resistance of the sensor
GasSensor.prototype.getResistance = function() {
  var vTemp = E.getAnalogVRef();
  var v = vTemp * analogRead(this._dataPin);
  var r = ((vTemp - v) / v) * this._model.rLoad;
  return r;
};

// Returns the PPM value for gas
GasSensor.prototype.read = function(gas) {
  if (gas && this._model.gas[gas] === undefined) {
    return Error('Gas is undefined');
  } else if (!gas) {
    gas = Object.keys(this._model.gas)[0];
  }
  var ratio = this.calculateResistance() / this._coef;
  var res = Math.pow(
    Math.E,
    (Math.log(ratio) - this._model.gas[gas].coef[1]) /
      this._model.gas[gas].coef[0]
  );
  return res * this._model.gas[gas].ppm;
};

// Forcibly controls heating using PWM
GasSensor.prototype.heat = function(pwr) {
  analogWrite(this._heatPin, pwr);
};

// Turns on the preliminary heating of the sensor, after which it executes a callback
GasSensor.prototype.preheat = function(callback) {
  this.heat(1);
  if (callback) {
    setTimeout(function() {
      callback();
    }, this._preheat * 1000);
  }
};

// Warm-up function for MQ-7 and MQ-9
// Implemented via setTimeout to avoid waiting 150 seconds before starting
GasSensor.prototype.cycleHeat = function(callback) {
  if (!callback) {
    try {
      clearTimeout(this._intId);
      this.heat(0);
    } catch (e) {
      // We have no running timeout
    }
    return;
  }

  // We start heating from 5 volts
  this.heat(1);
  this._intId = setTimeout(function() {
    // After 60 seconds, we start heating from 1.5 volts
    this.heat(0.294);
    this._intId = setTimeout(function() {
      // After 90 seconds, we execute
      callback();
      // And we start the cycle again
      this.cycleHeat(callback);
    }, 90000);
  }, 60000);
};

exports.connect = function(opts) {
  return new GasSensor(opts);
};

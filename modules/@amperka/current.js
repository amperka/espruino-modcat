var ACS712 = function(pin) {
  this._pin = pin;
  this._pin.mode('analog');

  this._value2currentDivider = 5 / 0.1221; // 5 A to 0.1221 V/A
  this._value2currentConst = -0.5 * this._value2currentDivider + 0.2;
  this._dividerSQR = this._value2currentDivider * this._value2currentDivider;
  this._sumKoef = 2 * this._value2currentDivider * this._value2currentConst;
  this._constSQR = this._value2currentConst * this._value2currentConst;
};

ACS712.prototype.read = function(units) {
  var value =
    analogRead(this._pin) * this._value2currentDivider +
    this._value2currentConst;

  switch (units) {
    case 'mA':
      return value * 1000;
    default:
      return value;
  }
};

ACS712.prototype.readEffective = function(period, units) {
  period = period || 0.04;

  var startTime = getTime();
  var numberOfMeasurements = 0;
  var value = 0;
  var sqrSum = 0;
  var sum = 0;

  while (getTime() - startTime < period) {
    numberOfMeasurements++;
    value = analogRead(this._pin);
    sum += value;
    sqrSum += value * value;
  }

  // Исходная формула — действующее значение переменного тока в интегральном виде.
  // Преобразована для дискретного вида, и упрощена по свойству дистрибутивности
  // умножения.
  var I = Math.sqrt(
    (sqrSum * this._dividerSQR + this._sumKoef * sum) / numberOfMeasurements +
      this._constSQR
  );

  switch (units) {
    case 'mA':
      return I * 1000;
    default:
      return I;
  }
};

exports.connect = function(pin) {
  return new ACS712(pin);
};

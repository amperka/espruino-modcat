var ServoHW = function(pin) {
  this._pin = pin;
  this._iId = null;
};
ServoHW.prototype.write = function(i) {
  var x = (0.5+ i * 0.007)/20;
  analogWrite(this._pin, x, {freq: 50, soft: true});
};
exports.connect = function(pin) {
  return new ServoHW(pin);
};

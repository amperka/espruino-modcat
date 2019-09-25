var Joystick = function(pX, pY, pButton) {
  this._pX = pX;
  this._pY = pY;
  this._pButton = pButton;
};

Joystick.prototype.get = function() {
  var data = {
    x: analogRead(this._pX),
    y: analogRead(this._pY),
    button: digitalRead(this._pButton)
  };
  return data;
};

exports.connect = function(pX, pY, pButton) {
  return new Joystick(pX, pY, pButton);
};

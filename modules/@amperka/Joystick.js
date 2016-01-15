var Joystick = function(pX, pY, pButton) {
  this.__pX = pX;
  this.__pY = pY;
  this.__pButton = pButton;
};

Joystick.prototype.get = function() {
  var data = {
    'x': analogRead(this.__pX),
    'y': analogRead(this.__pY),
    'button': digitalRead(this.__pButton)
  };
  return data;
};

exports.connect = function(pX,pY, pButton) {
  return new Joystick(pX, pY, pButton);
};

var Telegram = function(token) {
  this._token = token;
  this._lastUpdate = 0;
  this._callFunction = [];
  var http = require("http");
};

Telegram.prototype.read = function() {

};

exports.connect = function(token) {
  return new Telegram(token);
};

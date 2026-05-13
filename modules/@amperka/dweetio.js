var Dweetio = function (name) {
  this._name = name || 'amperka';
  this._host = 'iskreet.amperka.ru';
  this._http = require('http');
};

Dweetio.prototype._request = function (path, query, callback) {
  callback = callback || function () {};
  this._http.get('http://' + this._host + path + '?' + query, function (res) {
    var d = '';
    res.on('data', function (data) {
      d += data;
    });
    res.on('close', function () {
      callback(d);
    });
  });
};

Dweetio.prototype.send = function (data, callback) {
  var a = [];
  callback = callback || function () {};
  for (var prop in data) {
    a.push(encodeURIComponent(prop) + '=' + encodeURIComponent(data[prop]));
  }
  this._request('/dweet/for/' + this._name, a.join('&'), callback);
};

Dweetio.prototype.get = function (callback) {
  callback = callback || function () {};
  this._request('/get/latest/dweet/for/' + this._name, '', callback);
};

Dweetio.prototype.follow = function () {
  return 'https://' + this._host + '/follow/' + this._name;
};

exports.connect = function (name) {
  return new Dweetio(name);
};

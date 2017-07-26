
var Dweetio = function(name) {
  this._name = name || 'amperka';
  this._url = [
    'http://dweet.io/dweet/for/',
    this._name
  ].join('');
  this._http = require('http');
};

Dweetio.prototype._request = function(query, callback) {
  this._http.get(this._url + '?' + query, function(res) {
    var r = '';
    res.on('data', function(d) {
      r += d;
    });
    res.on('close', callback);
  });
};

Dweetio.prototype.send = function(data, callback) {
  var a = [];
  for (var prop in data) {
    a.push(encodeURIComponent(prop)+'='+encodeURIComponent(data[prop]));
  }
  callback = callback || function() {};
  this._request(a.join('&'), callback);
};

Dweetio.prototype.follow = function() {
  return 'https://dweet.io/follow/'+this._name;
};


exports.connect = function(name) {
  return new Dweetio(name);
};

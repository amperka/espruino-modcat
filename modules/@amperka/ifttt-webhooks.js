var Maker = function(token, action) {
  this._token = token;
  this._action = action || 'amperka';
  this._url = [
    'http://maker.ifttt.com/trigger/',
    this._action,
    '/with/key/',
    this._token
  ].join('');
  this._http = require('http');
};

Maker.prototype.send = function(data, callback) {
  var a = [];
  for (var prop in data) {
    a.push(prop + '=' + encodeURIComponent(data[prop]));
  }

  this._http.get([this._url, a.join('&')].join('?'), function(res) {
    var r = '';
    res.on('data', function(d) {
      r += d;
    });
    res.on('close', function() {
      if (callback) {
        callback(r);
      }
    });
  });
};

exports.create = function(opts) {
  var token = opts.token;
  var action = opts.action;
  return new Maker(token, action);
};

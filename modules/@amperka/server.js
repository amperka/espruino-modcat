var http = require('http');

var Server = function () {
  this._server = http.createServer(this._onPageRequest.bind(this));
  this._events = {};
};

Server.prototype.on = function (types, callback) {
  if (typeof types == 'string') {
    types = [types];
  }
  for (var t in types) {
    if (!this._events[types[t]]) {
      this._events[types[t]] = callback;
    }
  }
};

Server.prototype.listen = function (port) {
  this._server.listen(port || 80);
};

Server.prototype._onPageRequest = function (req, res) {
  var request = url.parse(req.url, true);
  this._event(request.pathname, req, res);
};

Server.prototype._event = function (eventName, req, res) {
  var sent = false;
  res.send = function (content, headers) {
    sent = true;
    var hdrs = headers || {};
    if (!hdrs['Content-Type']) hdrs['Content-Type'] = 'text/html';
    hdrs['Content-Length'] = content.length;
    hdrs['Connection'] = 'close';
    res.writeHead(200, hdrs);
    res.end(content);
  };
  if (this._events[eventName]) {
    this._events[eventName](req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.write('<h1>404 - Not found</h1>');
  }
  if (!sent) res.end();
};

exports.create = function () {
  return new Server();
};

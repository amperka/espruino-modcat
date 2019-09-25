var http = require('http');

var Server = function() {
  this._server = http.createServer(this._onPageRequest.bind(this));
  this._events = {};
};

Server.prototype.on = function(types, callback) {
  if (typeof types == 'string') {
    types = [types];
  }
  for (var t in types) {
    console.log(t);
    if (!this._events[types[t]]) {
      this._events[types[t]] = callback;
    }
  }
};

Server.prototype.listen = function(port) {
  this._server.listen(port || 80);
};

Server.prototype._onPageRequest = function(req, res) {
  var request = url.parse(req.url, true);
  this._event(request.pathname, request, res);
};

Server.prototype._event = function(eventName, req, res) {
  if (this._events[eventName]) {
    res.send = function(content, headers) {
      if (headers === undefined) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
      } else {
        res.writeHead(200, headers);
      }
      res.write(content);
    };
    this._events[eventName](req, res);
    res.end();
  }
};

exports.create = function() {
  return new Server();
};

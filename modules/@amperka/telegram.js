var Telegram = function(opts) {
  if (opts.token) {
    this._token = opts.token;
  } else {
    return new Error('Telegram API-token must be specified');
  }

  var polling = {};
  if (opts.polling) {
    polling.interval = opts.polling.interval || 1000;
    polling.timeout = opts.polling.timeout || 0;
    polling.limit = opts.polling.limit || 100;
    polling.retryTimeout = opts.polling.retryTimeout || 5000;
  }

  this._polling = polling;

  print(this._polling);

  this._events = {};

  this._lastUpdate = 0;
  this._callFunction = [];
  this._http = require('http');
};

Telegram.prototype.connect = function() {

  this._update();
  this._imready();

  if (this._polling.interval > 0) {

  }

};

Telegram.prototype.on = function(types, callback) {
  if (typeof types == 'string') {
    types = [types];
  }
  for (var t in types) {
    if (!this._events[types[t]]) {
      this._events[types[t]] = callback;
    }
  }
};

Telegram.prototype._event = function(eventName, params, eventType) {
  if (this._events[eventName]) {
    this._events[eventName](params, {type: eventType});
  }

};

Telegram.prototype._message = function(params) {
  if (params.entities) {
    if (params.entities[0].type === 'bot_command') {
      var indexA = params.entities[0].offset;
      var indexB = indexA + params.entities[0].length;
      var cmd = params.text.substring(indexA, indexB);
      this._event(cmd, params, 'command');
      this._event('/*', params, 'command');
    }
    // entities: [ { type: 'bot_command', offset: 0, length: 15 } ] }
  }
  if (params.contact) {

  }
  if (params.location) {
    
  }
  this._event('text', params, 'text');
  this._event('*', params, 'text');
};

Telegram.prototype._parseUpdate = function(response) {
  if (response) {
    if (response.result.length > 0) {
      this._lastUpdate = response.result[0].update_id + 1;
      print(this._lastUpdate);
      var data;
      if (response.result[0].callback_query) {
        data = response.result[0].callback_query;
        response = null;
        process.memory();
        this._event('callbackQuery', data);
        return;
      }
      if (response.result[0].message) {
        data = response.result[0].message;
        response = null;
        process.memory();
        this._message(data);
        return;
      }
    }
  }
  response = null;
  process.memory();
  this._update();
};

Telegram.prototype._update = function() {
  var params = {
    'offset': this._lastUpdate,
    'limit': this._polling.limit,
    'timeout': this._polling.timeout
  };
  print('getting updates');
  this._get('getUpdates', params, this._parseUpdate);
};

Telegram.prototype._get = function(method, query, callback) {
  var par = {
    'method': method,
    'query': query,
    'callback': callback
  };
  this._callFunction.push(par);
};

exports.connect = function(opts) {
  var params = {};
  if (typeof opts == 'string') {
    params.token = opts;
  } else {
    params = opts;
  }
  return new Telegram(params);
};

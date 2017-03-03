var Telegram = function(opts) {
  if (opts.token) {
    this._token = opts.token;
  } else {
    return new Error('Telegram API-token must be specified');
  }

  var polling = {};
  if (opts.polling) {
    // print('if (opts.polling) {');
    polling.interval = opts.polling.interval || 1000;
    polling.timeout = opts.polling.timeout || 0;
    polling.limit = opts.polling.limit || 1;
    polling.retryTimeout = opts.polling.retryTimeout || 5000;
  }
  this._polling = polling;
  // print('this._polling:', this._polling);

  this._events = {};

  this._connected = false;
  this._doUpdateLoop = false;
  this._updateTimeout = undefined;

  this._lastUpdate = 0;
  this._callFunction = [];
  this._http = require('http');
};

Telegram.prototype.connect = function() {
  this._doUpdateLoop = true;
  this._update();
  this._imready();
};

Telegram.prototype.disconnect = function() {
  if (this._connected) {
    this._event('disconnect');
  }
  if (this._updateTimeout) {
    clearTimeout(this._updateTimeout);
    this._updateTimeout = undefined;
  }
  this._doUpdateLoop = false;
  this._connected = false;
  this._callFunction = [];
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
  print('EVENT ', eventName);
  if (this._events[eventName]) {
    this._events[eventName](params, eventType ? {type: eventType} : undefined);
  }
};

Telegram.prototype._messageEvent = function(params) {
  if (params.entities) {
    if (params.entities[0].type === 'bot_command') {
      var indexA = params.entities[0].offset;
      var indexB = indexA + params.entities[0].length;
      var cmd = params.text.substring(indexA, indexB);
      print('it is a bot command: ', cmd);
      this._event(cmd, params, 'command');
      this._event('/*', params, 'command');
    }
    // entities: [ { type: 'bot_command', offset: 0, length: 15 } ] }
  }
  if (params.contact) {
    this._event('contact', params, 'contact');
  }
  if (params.location) {
    this._event('location', params, 'location');
  }
  this._event('text', params, 'text');
  this._event('*', params, 'text');
};

Telegram.prototype._parseUpdate = function(response) {
  // print('Telegram.prototype._parseUpdate');
  if (response) {
    if (this._connected === false) {
      this._connected = true;
      this._event('connect');
    }
    if (response.result.length > 0) {
      this._lastUpdate = response.result[0].update_id + 1;
      var data;
      if (response.result[0].callback_query) {
        data = response.result[0].callback_query;
        response = null;
        process.memory();
        this._event('callbackQuery', data, 'callbackQuery');
      } else if (response.result[0].message) {
        data = response.result[0].message;
        response = null;
        process.memory();
        this._messageEvent(data);
      }
    }
  }
  response = null;
  process.memory();
  // print('End of UPDATE');
  this._update();
};

Telegram.prototype._update = function() {
  // print('getting updates');
  // this._get('getUpdates', params, this._parseUpdate);
  this._callFunction.push({
    method: 'getUpdates',
    query: {
      offset: this._lastUpdate,
      limit: this._polling.limit,
      timeout: this._polling.timeout
    },
    callback: this._parseUpdate.bind(this)
  });

  // print(this._callFunction);
};

Telegram.prototype._imready = function() {
  if (this._callFunction.length > 0) {
    var task = this._callFunction[0];
    this._callFunction.splice(0, 1);
    if (task.method === 'getUpdates') {
      var self = this;
      this._updateTimeout = setTimeout(function() {
        this._updateTimeout = undefined;
        self._request(task.method, task.query, task.callback);
      }, this._polling.interval);
    } else {
      this._request(task.method, task.query, task.callback);
    }
  } else {
    this._update();
    this._imready();
  }
};

Telegram.prototype._request = function(method, query, callback) {
  var content = JSON.stringify(query);
  var url = {
    host: 'api.telegram.org',
    port: 443,
    path: '/bot'+this._token+'/'+method,
    method: 'POST',
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': content.length
    }
  };
  try {
    var self = this;
    this._http.request(url, function(res) {
      var response = '';
      res.on('data', function(d) {
        response += d;
      });
      res.on('close', function() {
        // print(response);
        var json = JSON.parse(response);
        response = '';
        if (callback) {
          if (self._doUpdateLoop) {
            callback(json);
          }
        }
        self._imready();
      });
    }).end(content);
  } catch (e) {
    print('I found error!');
    print(e);
  }
};

exports.create = function(opts) {
  var params = {};
  if (typeof opts == 'string') {
    params.token = opts;
  } else {
    params = opts;
  }
  return new Telegram(params);
};

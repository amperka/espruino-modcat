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
    polling.limit = opts.polling.limit || 1;
    polling.retryTimeout = opts.polling.retryTimeout || 5000;
  }
  this._polling = polling;

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
  if (this._updateTimeout !== undefined) {
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

Telegram.prototype.button = function(type, text) {
  if (type === 'contact') {
    return { text: text, request_contact: true };
  } else {
    return { text: text, request_location: true };
  }
};

Telegram.prototype.keyboard = function(arrayOfButtons, opts) {
  opts = opts || {};
  var keyboard = {
    keyboard: arrayOfButtons,
    one_time_keyboard: !!opts.once,
    resize_keyboard: !!opts.resize,
    selective: !!opts.selective
  };
  return JSON.stringify(keyboard);
};

Telegram.prototype.inlineButton = function(text, opt) {
  /* eslint-disable camelcase */
  opt = opt || {};
  var markup = { text: text };
  if (opt.url) {
    markup.url = opt.url;
  }
  if (opt.inline || opt.inline === '') {
    markup.switch_inline_query = opt.inline;
  }
  if (opt.callback) {
    markup.callback_data = String(opt.callback);
  }
  return markup;
  /* eslint-enable camelcase */
};

Telegram.prototype.inlineKeyboard = function(arrayOfButtons) {
  return JSON.stringify({ inline_keyboard: arrayOfButtons });
};

Telegram.prototype.sendLocation = function(chatId, coordinates, payload) {
  var params = {
    chat_id: chatId,
    latitude: coordinates[0] || 0,
    longitude: coordinates[1] || 0
  };
  params = this._addPreparedPayload(payload, params);
  this._callFunction.push({
    method: 'sendLocation',
    query: params
  });
};

Telegram.prototype._event = function(eventName, params, eventType) {
  if (this._events[eventName]) {
    this._events[eventName](params, { type: eventType || eventName });
  }
};

Telegram.prototype._addPreparedPayload = function(payload, dest) {
  /* eslint-disable camelcase */
  if (payload) {
    if (payload.reply) {
      dest.reply_to_message_id = payload.reply;
    }
    if (payload.markup) {
      if (payload.markup === 'hide' || payload.markup === false) {
        dest.reply_markup = JSON.stringify({ hide_keyboard: true });
      } else if (payload.markup === 'reply') {
        dest.reply_markup = JSON.stringify({ force_reply: true });
      } else {
        dest.reply_markup = payload.markup;
      }
    }
    if (payload.notify) {
      dest.disable_notification = !!payload.notify;
    }
  }
  return dest;
  /* eslint-enable camelcase */
};

Telegram.prototype.sendMessage = function(chatId, text, payload) {
  var params = {
    chat_id: chatId,
    text: text || ''
  };
  params = this._addPreparedPayload(payload, params);
  this._callFunction.push({
    method: 'sendMessage',
    query: params
  });
};

Telegram.prototype.answerCallback = function(callbackQueryId, text, showAlert) {
  this._callFunction.push({
    method: 'answerCallbackQuery',
    query: {
      callback_query_id: callbackQueryId, // eslint-disable-line camelcase
      show_alert: !!showAlert, // eslint-disable-line camelcase
      text: text
    }
  });
};

Telegram.prototype._messageEvent = function(params) {
  if (params.entities) {
    if (params.entities[0].type === 'bot_command') {
      var indexA = params.entities[0].offset;
      var indexB = indexA + params.entities[0].length;
      var cmd = params.text.substring(indexA, indexB);
      this._event(cmd, params, 'command');
      this._event('/*', params, 'command');
    }
  }
  if (params.contact) {
    this._event('contact', params);
  }
  if (params.location) {
    this._event('location', params);
  }
  this._event('text', params);
  this._event('*', params, 'text');
};

Telegram.prototype._parseUpdate = function(response) {
  if (response && response.result) {
    if (this._connected === false) {
      this._connected = true;
      this._event('connect');
    }
    this._event('update', response.result, 'callbackQuery');
    if (response.result.length > 0) {
      this._lastUpdate = response.result[0].update_id + 1;
      var data;
      if (response.result[0].callback_query) {
        data = response.result[0].callback_query;
        response = null;
        process.memory();
        this._event('callbackQuery', data);
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
  this._update();
};

Telegram.prototype._update = function() {
  this._callFunction.push({
    method: 'getUpdates',
    query: {
      offset: this._lastUpdate,
      limit: this._polling.limit,
      timeout: this._polling.timeout
    },
    callback: this._parseUpdate.bind(this)
  });
};

Telegram.prototype._imready = function() {
  if (this._callFunction.length > 0) {
    var task = this._callFunction[0];
    this._callFunction.shift();
    var self = this;
    process.memory();
    if (task.method === 'getUpdates') {
      this._updateTimeout = setTimeout(function() {
        this._updateTimeout = undefined;
        setTimeout(function() {
          self._request(task.method, task.query, task.callback);
        }, 100);
      }, this._polling.interval);
    } else {
      setTimeout(function() {
        self._request(task.method, task.query, task.callback);
      }, 100);
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
    path: '/bot' + this._token + '/' + method,
    method: 'POST',
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': content.length
    }
  };
  var self = this;
  try {
    var request = this._http.request(url, function(res) {
      var response = '';
      res.on('data', function(d) {
        response += d;
      });
      res.on('close', function() {
        var json = JSON.parse(response);
        response = '';
        if (callback) {
          if (self._doUpdateLoop) {
            callback(json);
          }
        }
        self._imready();
      });
    });
    request.end(content);
    request.on('error', function(err) {
      process.memory();
      self._event('error', err);
      self.disconnect();
    });
  } catch (e) {
    process.memory();
    self._event('error', e);
    self.disconnect();
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

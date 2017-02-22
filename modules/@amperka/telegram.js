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

  this._lastUpdate = 0;
  this._callFunction = [];
  var http = require('http');
};

Telegram.prototype.connect = function() {

  this._update(1, 1, 10);
  this._imready();

  if (this._polling.interval > 0) {

  }

};

Telegram.prototype._update = function(offset, limit, timeout, allowed_updates) {
  var params = {
    'offset': this._lastUpdate,
    'limit': limit || 1,
    'timeout': timeout || 10
  };
  print('getting updates');
  this._get('getUpdates', params, parseUpdate);
};

Telegram.prototype._get = function(method, query, callback) {
  var par = {
    'method': method,
    'query': query,
    'callback': callback
  };
  callFunction.push(par);
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

/*

const TeleBot = require('telebot');

const bot = new TeleBot({
  token: '-PASTEYOURTELEGRAMBOTAPITOKENHERE-', // Required. Telegram Bot API token.
  polling: { // Optional. Use polling.
    interval: 1000, // Optional. How often check updates (in ms).
    timeout: 0, // Optional. Update polling timeout (0 - short polling).
    limit: 100, // Optional. Limits the number of updates to be retrieved.
    retryTimeout: 5000 // Optional. Reconnecting timeout (in ms).
  }
});

*/
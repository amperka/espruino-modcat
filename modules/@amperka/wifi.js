// ESP8266 AT command driver for Iskra JS + Troyka WiFi shield.
//
// Multi-baud auto-detection: on init(), probes common baud rates to find the
// ESP8266 regardless of its current UART speed, then switches it to TARGET_BAUD
// (9600). 9600 is chosen because higher rates (115200, 57600) cause UART data
// corruption on the Iskra JS ↔ ESP8266 serial link when sending large HTTP
// responses (~10 KB).
//
// Uses AT+UART_CUR (not AT+UART_DEF) so ESP flash is never modified — the
// module rediscovers the ESP on every boot via the baud probe sequence.

var at;
var socks = [];
var sockData = ['', '', '', '', ''];
var MAXSOCKETS = 5;
var ENCR_FLAGS = ['open', 'wep', 'wpa_psk', 'wpa2_psk', 'wpa_wpa2_psk'];
var serial;

// ESP8266 sends asynchronous status lines (WIFI events, +CWJAP notifications,
// etc.) at any time, including in the middle of a multi-line AT response.
// Returning the callback from itself skips these lines without breaking the
// response parser state machine.
function isUnsolicitedStatus(d) {
  if (!d) return false;
  return (
    d.indexOf('WIFI') >= 0 ||
    d.indexOf('+CW') >= 0 ||
    d.indexOf('WPS') >= 0 ||
    d.indexOf('+DIST_STA_IP') >= 0 ||
    d === 'no change'
  );
}

// NetworkJS callbacks — Espruino's network stack calls these to manage TCP
// sockets over the ESP8266 AT command channel.
var netCallbacks = {
  // host=undefined → server socket (listen), host=string → client socket (connect)
  create: function (host, port) {
    var sckt;
    var self = this;
    if (host === undefined) {
      sckt = MAXSOCKETS;
      socks[sckt] = 'Wait';
      sockData[sckt] = '';
      at.cmd('AT+CIPSERVER=1,' + port + '\r\n', 10000, function (d) {
        if (d === 'OK') {
          socks[sckt] = true;
        } else {
          socks[sckt] = undefined;
          self.emit('err', 'CIPSERVER failed (' + (d ? d : 'Timeout') + ')');
        }
      });
      return MAXSOCKETS;
    } else {
      sckt = 0;
      while (socks[sckt] !== undefined) {
        sckt++;
      }
      if (sckt >= MAXSOCKETS) {
        self.emit('err', 'No free sockets');
        return null;
      }
      socks[sckt] = 'Wait';
      sockData[sckt] = '';
      at.cmd(
        'AT+CIPSTART=' +
          sckt +
          ',"TCP",' +
          JSON.stringify(host) +
          ',' +
          port +
          '\r\n',
        10000,
        function cb(d) {
          if (d === sckt + ',CONNECT') {
            socks[sckt] = true;
            return cb;
          }
          if (d === 'OK') {
            at.registerLine(sckt + ',CLOSED', function () {
              at.unregisterLine(sckt + ',CLOSED');
              socks[sckt] = undefined;
            });
          } else {
            socks[sckt] = undefined;
            self.emit('err', 'CIPSTART failed (' + (d ? d : 'Timeout') + ')');
          }
        }
      );
    }
    return sckt;
  },
  // Deferred close: if socket is mid-send ('Wait'), mark it 'WaitClose' so
  // the send callback closes it after AT+CIPSEND completes.
  close: function (sckt) {
    if (socks[sckt] === 'Wait') {
      socks[sckt] = 'WaitClose';
    } else if (socks[sckt] !== undefined) {
      at.cmd(
        (sckt === MAXSOCKETS ? 'AT+CIPSERVER=0' : 'AT+CIPCLOSE=' + sckt) +
          '\r\n',
        1000,
        function () {
          socks[sckt] = undefined;
        }
      );
    }
  },
  // NetworkJS polls this to find incoming connections. A socket with data but
  // no owner (socks[i] === undefined) means a client connected via CIPSERVER.
  accept: function () {
    for (var i = 0; i < MAXSOCKETS; i++) {
      if (sockData[i] && socks[i] === undefined) {
        socks[i] = true;
        return i;
      }
    }
    return -1;
  },
  recv: function (sckt, maxLen) {
    if (at.isBusy() || socks[sckt] === 'Wait') {
      return '';
    }
    if (sockData[sckt]) {
      var r;
      if (sockData[sckt].length > maxLen) {
        r = sockData[sckt].substr(0, maxLen);
        sockData[sckt] = sockData[sckt].substr(maxLen);
      } else {
        r = sockData[sckt];
        sockData[sckt] = '';
      }
      return r;
    }
    if (!socks[sckt]) {
      return -1;
    }
    return '';
  },
  // AT+CIPSEND handshake: send command → wait for '>' prompt → write data →
  // wait for 'SEND OK'. The socket is marked 'Wait' during this process to
  // prevent concurrent sends.
  send: function (sckt, data) {
    if (at.isBusy() || socks[sckt] === 'Wait') {
      return 0;
    }
    if (!socks[sckt]) {
      return -1;
    }
    var cmd = 'AT+CIPSEND=' + sckt + ',' + data.length + '\r\n';
    at.cmd(cmd, 10000, function cb(d) {
      if (d === 'OK') {
        at.register('> ', function () {
          at.unregister('> ');
          at.write(data);
          return '';
        });
        return cb;
      } else if (d === 'Recv ' + data.length + ' bytes') {
        return cb;
      } else if (d === 'SEND OK') {
        if (socks[sckt] === 'WaitClose') {
          netCallbacks.close(sckt);
        }
        socks[sckt] = true;
      } else {
        socks[sckt] = undefined;
        at.unregister('> ');
      }
    });
    socks[sckt] = 'Wait';
    return data.length;
  }
};

// +IPD line handler registered via at.register(). Parses incoming TCP data
// from the ESP8266's multiplexed stream. Format: +IPD,<socket>,<len>:<data>
// May be followed by more +IPD lines in the same serial buffer, so partial
// data is returned as a new +IPD header for the next parse cycle.
function ipdHandler(line) {
  var colon = line.indexOf(':');
  if (colon < 0) {
    return line;
  }
  var parms = line.substring(5, colon).split(',');
  parms[1] = 0 | parms[1];
  var len = line.length - (colon + 1);
  if (len >= parms[1]) {
    sockData[parms[0]] += line.substr(colon + 1, parms[1]);
    return line.substr(colon + parms[1] + 1);
  } else {
    sockData[parms[0]] += line.substr(colon + 1, len);
    return '+IPD,' + parms[0] + ',' + (parms[1] - len) + ':';
  }
}

var ESP8266 = {
  ipdHandler: ipdHandler,
  debug: function () {
    return {
      socks: socks,
      sockData: sockData
    };
  },
  // Multi-baud probe: tries each baud rate, sends 'AT', waits for 'OK'.
  // On success, if baud ≠ TARGET_BAUD, sends AT+UART_CUR to switch the ESP
  // to TARGET_BAUD, then reconfigures the local UART to match.
  //
  // 9600 is tried first (most likely after a previous init), then 115200
  // (ESP factory default after power cycle or flash erase), then remaining
  // rates. Each baud gets up to 2 retries with 2s gap — ESP needs ~1-2s
  // after power-up before it responds to AT commands.
  init: function (callback) {
    var TARGET_BAUD = 9600;
    var BAUDS_TO_TRY = [9600, 115200, 19200, 28800, 38400, 57600];

    // Disable echo (ATE0) and enable multi-connection mode (CIPMUX=1).
    // Echo handling: ATE0 itself is echoed back as "ATE0" before "OK" —
    // the callback returns itself to consume the echo line.
    function doInit(cb) {
      at.cmd('ATE0\r\n', 1000, function ateCb(d) {
        if (d === 'ATE0') return ateCb;
        if (isUnsolicitedStatus(d)) return ateCb;
        if (d === 'OK') {
          at.cmd('AT+CIPMUX=1\r\n', 1000, function cipCb(d) {
            if (isUnsolicitedStatus(d)) return cipCb;
            if (d !== 'OK') {
              cb('CIPMUX failed: ' + (d ? d : 'Timeout'));
            } else {
              cb(null);
            }
          });
        } else {
          cb('ATE0 failed: ' + (d ? d : 'Timeout'));
        }
      });
    }

    function probeWithRetry(cb, baud, retries) {
      at.cmd('AT\r\n', 3000, function probeCb(d) {
        // ESP echoes "AT" back when ATE1 is active (default after power cycle)
        if (d === 'AT') return probeCb;
        if (d === 'OK') {
          if (baud !== TARGET_BAUD) {
            at.cmd(
              'AT+UART_CUR=' + TARGET_BAUD + ',8,1,0,0\r\n',
              1000,
              function (ud) {
                if (ud !== 'OK') {
                  cb('UART_CUR failed: ' + (ud ? ud : 'Timeout'));
                  return;
                }
                serial.setup(TARGET_BAUD);
                // Brief pause for UART line to stabilise after baud change
                setTimeout(function () {
                  doInit(cb);
                }, 100);
              }
            );
          } else {
            doInit(cb);
          }
        } else if (retries > 1) {
          setTimeout(function () {
            probeWithRetry(cb, baud, retries - 1);
          }, 2000);
        } else {
          cb('ESP not responding at ' + baud);
        }
      });
    }

    function tryBaudList(bauds, cb) {
      if (bauds.length === 0) {
        cb('ESP not responding on any baud');
        return;
      }
      var baud = bauds[0];
      var rest = bauds.slice(1);
      serial.setup(baud);
      probeWithRetry(
        function (err) {
          if (err) {
            tryBaudList(rest, cb);
          } else {
            cb(null);
          }
        },
        baud,
        2
      );
    }

    tryBaudList(BAUDS_TO_TRY, callback);
  },
  reset: function (callback) {
    at.cmd('\r\nAT+RST\r\n', 10000, function cb(d) {
      if (d === 'ready' || d === 'Ready.') {
        setTimeout(function () {
          ESP8266.init(callback);
        }, 1000);
      } else if (d === 'jump to run user1 @ 1000') {
        setTimeout(function () {
          ESP8266.init(callback);
        }, 5000);
      } else {
        if (d === undefined) {
          callback('No "ready" after AT+RST');
        } else {
          return cb;
        }
      }
    });
  },
  getVersion: function (callback) {
    at.cmd('AT+GMR\r\n', 1000, function (d) {
      callback(null, d);
    });
  },
  connect: function (ssid, key, callback) {
    at.cmd('AT+CWMODE=1\r\n', 1000, function (cwm) {
      if (cwm !== 'no change' && cwm !== 'OK') {
        callback('CWMODE failed: ' + (cwm ? cwm : 'Timeout'));
      } else {
        at.cmd(
          'AT+CWJAP=' +
            JSON.stringify(ssid) +
            ',' +
            JSON.stringify(key) +
            '\r\n',
          20000,
          function cb(d) {
            if (
              [
                'WIFI DISCONNECT',
                'WIFI CONNECTED',
                'WIFI GOT IP',
                '+CWJAP:1'
              ].indexOf(d) >= 0
            ) {
              return cb;
            }
            if (d !== 'OK') {
              setTimeout(
                callback,
                0,
                'WiFi connect failed: ' + (d ? d : 'Timeout')
              );
            } else {
              setTimeout(callback, 0, null);
            }
          }
        );
      }
    });
  },
  getAPs: function (callback) {
    var aps = [];
    at.cmdReg(
      'AT+CWLAP\r\n',
      5000,
      '+CWLAP:',
      function (d) {
        var ap = d.slice(8, -1).split(',');
        aps.push({
          ssid: JSON.parse(ap[1]),
          enc: ENCR_FLAGS[ap[0]],
          signal: parseInt(ap[2]),
          mac: JSON.parse(ap[3])
        });
      },
      function () {
        callback(null, aps);
      }
    );
  },
  getConnectedAP: function (callback) {
    var con;
    at.cmdReg(
      'AT+CWJAP?\r\n',
      1000,
      '+CWJAP:',
      function (d) {
        con = JSON.parse(d.slice(7));
      },
      function () {
        callback(null, con);
      }
    );
  },
  createAP: function (ssid, key, channel, enc, callback) {
    at.cmd('AT+CWMODE=2\r\n', 1000, function (cwm) {
      if (cwm !== 'no change' && cwm !== 'OK' && cwm !== 'WIFI DISCONNECT') {
        callback('CWMODE failed: ' + (cwm ? cwm : 'Timeout'));
      }
      var encn = enc ? ENCR_FLAGS.indexOf(enc) : 0;
      if (encn < 0) {
        callback('Encryption type ' + enc + ' not known - ' + ENCR_FLAGS);
      } else {
        at.cmd(
          'AT+CWSAP=' +
            JSON.stringify(ssid) +
            ',' +
            JSON.stringify(key) +
            ',' +
            channel +
            ',' +
            encn +
            '\r\n',
          5000,
          function (cwm) {
            if (cwm !== 'OK') {
              callback('CWSAP failed: ' + (cwm ? cwm : 'Timeout'));
            } else {
              callback(null);
            }
          }
        );
      }
    });
  },
  getConnectedDevices: function (callback) {
    var devs = [];
    this.at.cmd('AT+CWLIF\r\n', 1000, function r(d) {
      if (d === 'OK') {
        callback(null, devs);
      } else if (d === undefined || d === 'ERROR') {
        callback('Error');
      } else {
        var e = d.split(',');
        devs.push({ ip: e[0], mac: e[1] });
        return r;
      }
    });
  },
  getIP: function (callback) {
    var ip;
    at.cmdReg(
      'AT+CIFSR\r\n',
      1000,
      '+CIFSR',
      function (d) {
        if (!ip && d.indexOf(',') >= 0) {
          ip = JSON.parse(d.slice(d.indexOf(',') + 1));
        }
      },
      function (d) {
        if (d !== 'OK') {
          callback('CIFSR failed: ' + d);
        } else {
          callback(null, ip);
        }
      }
    );
  }
};

exports.setup = function (usart, connectedCallback) {
  if (typeof usart === 'function') {
    connectedCallback = usart;
    usart = PrimarySerial;
  }
  serial = usart;
  // Start at TARGET_BAUD — most likely to match after a previous init() that
  // already switched the ESP to 9600. If the ESP is on a different baud,
  // init()'s probe sequence will find it.
  usart.setup(9600);

  ESP8266.at = at = require('AT').connect(usart);
  require('NetworkJS').create(netCallbacks);

  netCallbacks.on('err', function (e) {
    ESP8266.emit('err', e);
  });

  at.register('+IPD', ipdHandler);

  ESP8266.init(connectedCallback);

  return ESP8266;
};

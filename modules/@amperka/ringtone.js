var NOTES = [
  0,
  262,
  277,
  294,
  311,
  330,
  349,
  370,
  392,
  415,
  440,
  466,
  494,
  523,
  554,
  587,
  622,
  659,
  698,
  740,
  784,
  831,
  880,
  932,
  988,
  1047,
  1109,
  1175,
  1245,
  1319,
  1397,
  1480,
  1568,
  1661,
  1760,
  1865,
  1976,
  2093,
  2217,
  2349,
  2489,
  2637,
  2794,
  2960,
  3136,
  3322,
  3520,
  3729,
  3951
];

var PITCHES = {
  c: 1,
  d: 3,
  e: 5,
  f: 6,
  g: 8,
  a: 10,
  b: 12,
  p: 0
};

var Lexer = function(rtttl) {
  this._rtttl = rtttl;
  this._p = 0;
};

Lexer.prototype.next = function() {
  var charCodeAt = this._rtttl.charCodeAt.bind(this._rtttl);
  var charAt = this._rtttl.charAt.bind(this._rtttl);
  var c;

  if (!this._skipToSignificant()) {
    return;
  }

  c = charCodeAt(this._p);
  if (c >= 48 && c <= 57) {
    // we've got a number token
    var num = 0;
    do {
      num = num * 10 + c - 48;
      ++this._p;
      c = charCodeAt(this._p);
    } while (c >= 48 && c <= 57);

    return num;
  }

  c = charAt(this._p);
  if ((c > 'a' && c < 'z') || (c > 'A' && c < 'Z')) {
    // we've got a string token
    var token = '';
    do {
      token += c;
      ++this._p;
      c = charAt(this._p);
    } while ((c > 'a' && c < 'z') || (c > 'A' && c < 'Z'));

    return token;
  }

  // we've got a symbol
  ++this._p;
  return c;
};

Lexer.prototype._skipToSignificant = function() {
  var charCodeAt = this._rtttl.charCodeAt.bind(this._rtttl);
  var len = this._rtttl.length;

  while (charCodeAt(this._p) <= 0x20) {
    if (this._p >= len) {
      return false;
    }
    ++this._p;
  }

  return true;
};

var XPromise = function() {
  this._fn = null;
};

XPromise.prototype.then = function(fn) {
  this._fn = fn;
};

XPromise.prototype.resolve = function() {
  this._fn && this._fn();
};

var Player = function(opts) {
  if (opts instanceof Pin) {
    this._pin = opts;
  } else if (typeof opts === 'object') {
    this._pin = opts.output;
    this._melody = opts.melody;
  }

  this._timeoutID = null;
};

Player.prototype.play = function(melody, noteCallback) {
  if (typeof melody === 'function') {
    // single noteCallback argument
    noteCallback = melody;
    melody = this._melody;
  } else {
    melody = melody || this._melody;
    noteCallback = noteCallback || function() {};
  }

  var self = this;
  if (this._pin) {
    this._noteFunc = function(freq, duration) {
      if (freq) {
        analogWrite(self._pin, 0.5, { freq: freq });
      } else {
        digitalWrite(self._pin, 0);
      }
      noteCallback(freq, duration);
    };
  } else {
    this._noteFunc = noteCallback;
  }

  this._lexer = new Lexer(melody);
  this._skipTitle();
  this._parseSettings();

  // BPM denotes the number of quarter notes per minute
  this._wholeNoteDuration = (60 / this._settings.bpm) * 4;
  this._parseAndPlay();

  this._promise = new XPromise();
  return this._promise;
};

Player.prototype._skipTitle = function() {
  var lexer = this._lexer;
  var token = lexer.next();
  while (token && token !== ':') {
    token = lexer.next();
  }
};

Player.prototype._parseSettings = function() {
  this._settings = {
    bpm: 63,
    noteValue: 4,
    octave: 6
  };

  var lexer = this._lexer;
  var token = lexer.next();
  while (token !== ':') {
    var key = token;
    if (lexer.next() !== '=') {
      throw new Error('Expecting = at ' + lexer._p);
    }

    var val = lexer.next();
    if (typeof val !== 'number') {
      throw new Error('A number expected at ' + lexer._p);
    }

    switch (key) {
      case 'd':
        this._settings.noteValue = val;
        break;
      case 'o':
        this._settings.octave = val;
        break;
      case 'b':
        this._settings.bpm = val;
        break;
      default:
        throw new Error('Unknown parameter ' + key);
    }

    token = lexer.next();
    if (token === ',') {
      token = lexer.next();
    }
  }
};

Player.prototype._parseNote = function() {
  var lexer = this._lexer;
  var token = lexer.next();

  if (!token) {
    // end of play
    return null;
  }

  var note = {
    value: this._settings.noteValue,
    octave: this._settings.octave,
    pitch: 0
  };

  if (typeof token === 'number') {
    note.value = token;
    token = lexer.next();
  }

  note.pitch = PITCHES[token];
  if (note.pitch === undefined) {
    throw new Error('Unknown note pitch ' + token);
  }

  token = lexer.next();
  if (token === '#') {
    ++note.pitch;
    token = lexer.next();
  }

  if (token === '.') {
    note.value /= 1.5;
    token = lexer.next();
  }

  if (typeof token === 'number') {
    note.octave = token;
    token = lexer.next();
  }

  if (token && token !== ',') {
    throw new Error('Expecting , at ' + lexer._p);
  }

  return note;
};

Player.prototype._parseAndPlay = function() {
  this._timeoutID = null;
  var note = this._parseNote();

  if (!note) {
    // end of play
    this._noteFunc(0, 0);
    // prevent adding void before function by minifier
    var c = this._promise.resolve();
    c;
    return;
  }

  var noteDuration = this._wholeNoteDuration / note.value;

  if (note.pitch) {
    var idx = (note.octave - 4) * 12 + note.pitch;
    this._noteFunc(NOTES[idx], noteDuration);
  } else {
    this._noteFunc(0, noteDuration);
  }

  this._timeoutID = setTimeout(
    this._parseAndPlay.bind(this),
    noteDuration * 1000
  );
};

Player.prototype.stop = function() {
  if (this._timeoutID) {
    clearTimeout(this._timeoutID);
    this._timeoutID = null;
    this._noteFunc(0, 0);
  }

  return this;
};

exports.create = function(opts) {
  return new Player(opts);
};

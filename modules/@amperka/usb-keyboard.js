/* Copyright (c) 2015 Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission. */
/*
 */
E.setUSBHID({
  // prettier-ignore
  reportDescriptor: [
    0x05, 0x01, // Usage Page (Generic Desktop),
    0x09, 0x06, // Usage (Keyboard),
    0xA1, 0x01, // Collection (Application),
    0x75, 0x01, // Report Size (1),
    0x95, 0x08, // Report Count (8),
    0x05, 0x07, // Usage Page (Key Codes),
    0x19, 0xE0, // Usage Minimum (224),
    0x29, 0xE7, // Usage Maximum (231),
    0x15, 0x00, // Logical Minimum (0),
    0x25, 0x01, // Logical Maximum (1),
    0x81, 0x02, // Input (Data, Variable, Absolute), ;Modifier byte
    0x95, 0x01, // Report Count (1),
    0x75, 0x08, // Report Size (8),
    0x81, 0x03, // Input (Constant),   ;Reserved byte
    0x95, 0x05, // Report Count (5),
    0x75, 0x01, // Report Size (1),
    0x05, 0x08, // Usage Page (LEDs),
    0x19, 0x01, // Usage Minimum (1),
    0x29, 0x05, // Usage Maximum (5),
    0x91, 0x02, // Output (Data, Variable, Absolute), ;LED report
    0x95, 0x01, // Report Count (1),
    0x75, 0x03, // Report Size (3),
    0x91, 0x03, // Output (Constant),   ;LED report padding
    0x95, 0x06, // Report Count (6),
    0x75, 0x08, // Report Size (8),
    0x15, 0x00, // Logical Minimum (0),
    0x25, 0x68, // Logical Maximum(104),
    0x05, 0x07, // Usage Page (Key Codes),
    0x19, 0x00, // Usage Minimum (0),
    0x29, 0x68, // Usage Maximum (104),
    0x81, 0x00, // Input (Data, Array),
    0xc0 // End Collection
  ]
});

// 1 = modifiers
// 2 = ?
// 3..8 = key codes currently down

var MODIFY = {
  CTRL: 0x01,
  SHIFT: 0x02,
  ALT: 0x04,
  GUI: 0x08,
  LEFT_CTRL: 0x01,
  LEFT_SHIFT: 0x02,
  LEFT_ALT: 0x04,
  LEFT_GUI: 0x08,
  RIGHT_CTRL: 0x10,
  RIGHT_SHIFT: 0x20,
  RIGHT_ALT: 0x40,
  RIGHT_GUI: 0x80
};

var KEY = {
  A: 4,
  B: 5,
  C: 6,
  D: 7,
  E: 8,
  F: 9,
  G: 10,
  H: 11,
  I: 12,
  J: 13,
  K: 14,
  L: 15,
  M: 16,
  N: 17,
  O: 18,
  P: 19,
  Q: 20,
  R: 21,
  S: 22,
  T: 23,
  U: 24,
  V: 25,
  W: 26,
  X: 27,
  Y: 28,
  Z: 29,
  1: 30,
  2: 31,
  3: 32,
  4: 33,
  5: 34,
  6: 35,
  7: 36,
  8: 37,
  9: 38,
  0: 39,
  ENTER: 40,
  '\n': 40,
  ESC: 41,
  BACKSPACE: 42,
  TAB: 43,
  '\t': 43,
  SPACE: 44,
  ' ': 44,
  '-': 45,
  '=': 46,
  '[': 47,
  ']': 48,
  //"\\" : 49, // minification problem here
  BACKSLASH: 49,
  NUMBER: 50,
  ';': 51,
  "'": 52,
  '`': 53,
  ',': 54,
  '.': 55,
  '/': 56,
  CAPS_LOCK: 57,
  F1: 58,
  F2: 59,
  F3: 60,
  F4: 61,
  F5: 62,
  F6: 63,
  F7: 64,
  F8: 65,
  F9: 66,
  F10: 67,
  F11: 68,
  F12: 69,
  PRINTSCREEN: 70,
  SCROLL_LOCK: 71,
  PAUSE: 72,
  INSERT: 73,
  HOME: 74,
  PAGE_UP: 75,
  DELETE: 76,
  END: 77,
  PAGE_DOWN: 78,
  RIGHT: 79,
  LEFT: 80,
  DOWN: 81,
  UP: 82,
  NUM_LOCK: 83,
  PAD_SLASH: 84,
  PAD_ASTERIX: 85,
  PAD_MINUS: 86,
  PAD_PLUS: 87,
  PAD_ENTER: 88,
  PAD_1: 89,
  PAD_2: 90,
  PAD_3: 91,
  PAD_4: 92,
  PAD_5: 93,
  PAD_6: 94,
  PAD_7: 95,
  PAD_8: 96,
  PAD_9: 97,
  PAD_0: 98,
  PAD_PERIOD: 99
};

var SHIFT_KEYS = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '<': ',',
  '>': '.',
  '?': '/',
  '{': '[',
  '}': ']',
  '"': "'",
  ':': ';',
  '|': 'BACKSLASH'
};

var tap = function(key, callback) {
  var modifiers = 0;

  if (Array.isArray(key)) {
    for (var i = 0; i < key.length - 1; ++i) {
      modifiers |= key[i];
    }
    key = key[i];
  }
  if (typeof key === 'string') key = KEY[key];
  key = key || 0;

  E.sendUSBHID([modifiers, 0, key, 0, 0, 0, 0, 0]);
  setTimeout(function() {
    E.sendUSBHID([0, 0, 0, 0, 0, 0, 0, 0]);
    if (callback) setTimeout(callback, 10);
  }, 10);
};

var type = function(txt, sendSpeed, callback) {
  var chr;
  var code;
  var timeForWait;
  if (typeof sendSpeed === 'function') {
    callback = sendSpeed;
    timeForWait = 20;
  } else if (typeof sendSpeed === 'number' && sendSpeed < 50) {
    timeForWait = 1000 / sendSpeed;
  } else {
    timeForWait = 20;
  }
  var intr = setInterval(function() {
    if (!txt.length) {
      clearInterval(intr);
      if (callback) callback();
    } else {
      chr = txt[0];
      code = chr.charCodeAt(0);
      if (code >= 97 && code <= 122) {
        // lower case letter a-z
        tap(chr.toUpperCase());
      } else if (code >= 65 && code <= 90) {
        // upper case letter A-Z
        tap([MODIFY.SHIFT, chr]);
      } else if (chr in KEY) {
        tap(KEY[chr]);
      } else if (chr in SHIFT_KEYS) {
        tap([MODIFY.SHIFT, SHIFT_KEYS[chr]]);
      } else {
        tap('?');
      }
      txt = txt.substr(1);
    }
  }, timeForWait);
};

var pressedKeys = [0, 0, 0, 0, 0, 0, 0, 0];

var chooseKey = function(keyChanger, opts) {
  var chrCode;
  if (opts in MODIFY) {
    keyChanger([MODIFY[opts], 0]);
  } else {
    chrCode = opts.charCodeAt(0);
    if (chrCode >= 97 && chrCode <= 122) {
      // lower case letter a-z
      keyChanger(opts.toUpperCase());
    } else if (chrCode >= 65 && chrCode <= 90) {
      // upper case letter A-Z
      keyChanger(opts);
    } else if (opts in KEY) {
      keyChanger(KEY[opts]);
    } else if (opts in SHIFT_KEYS) {
      keyChanger(SHIFT_KEYS[opts]);
    } else {
      keyChanger('?');
    }
  }
};

var press = function(opts) {
  chooseKey(changePressedKeys, opts);
};

var release = function(opts) {
  chooseKey(changeReleasedKeys, opts);
};

var releaseAll = function() {
  pressedKeys = [0, 0, 0, 0, 0, 0, 0, 0];
  E.sendUSBHID(pressedKeys);
};

var changePressedKeys = function(opts) {
  var modifiers = pressedKeys[0];
  var changeFlag = false;
  var i;
  if (Array.isArray(opts)) {
    // We've got an array of modifiers + key itself.
    // First combine modifiers
    for (i = 0; i < opts.length - 1; ++i) {
      modifiers |= opts[i];
    }
    // Then extract last element as a key
    opts = opts[i];
  }
  if (typeof opts === 'string') opts = KEY[opts];

  // Protect from undefined
  opts = opts || 0;

  for (i = 2; i < 8; i++) {
    if (pressedKeys[i] === opts) {
      changeFlag = true;
      break;
    }
  }
  if (pressedKeys[0] !== modifiers || !changeFlag) {
    if (pressedKeys[0] !== modifiers) {
      pressedKeys[0] = modifiers;
    }
    for (i = 2; i < 8; i++) {
      if (pressedKeys[i] === 0x00) {
        pressedKeys[i] = opts;
        break;
      }
    }
    if (i === 8) {
      return;
    }
    E.sendUSBHID(pressedKeys);
  }
};
var changeReleasedKeys = function(opts) {
  var changeFlag = false;
  var modifiers = pressedKeys[0];
  if (Array.isArray(opts)) {
    // We've got an array of modifiers + key itself.
    // First combine modifiers
    for (var i = 0; i < opts.length - 1; ++i) {
      modifiers ^= opts[i];
    }
    // Then extract last element as a key
    opts = opts[i];
  }
  if (typeof opts === 'string') opts = KEY[opts];
  opts = opts || 0;
  for (i = 2; i < 7; i++) {
    if (0 !== opts && pressedKeys[i] === opts) {
      pressedKeys[i] = 0x00;
      changeFlag = true;
    }
  }
  if (pressedKeys[0] !== modifiers) {
    pressedKeys[0] = modifiers;
    changeFlag = true;
  }
  if (changeFlag) {
    E.sendUSBHID(pressedKeys);
  }
};
exports.KEY = KEY;
exports.MODIFY = MODIFY;
exports.tap = tap;
exports.type = type;
exports.press = press;
exports.release = release;
exports.releaseAll = releaseAll;

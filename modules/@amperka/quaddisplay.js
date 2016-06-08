var QuadDisplay = function(pin){
    this.pin = pin;
};

QuadDisplay.prototype.display = function(str, align){
  var ret = [], chr, s = (str + ""), c;

  if(align) s = _pad(s) + s;
  else s = s + _pad(s);

  for(var i=0, l=s.length; i<l; i++){
    switch(s[i]) {
      case ".":
        chr = (SYMBOLS[s[++i]] || 0b11111111) & 0b11111110;
        break;
      case "&":
        chr = (SYMBOLS[s[++i]] || 0b11111111) & 0b11111110;
        break;
      default:
        chr = SYMBOLS[s[i]] || 0b11111111;
        break;
    }    

    for(var j=8;j;j--){
      ret = (chr & 1) ? ret.concat(QuadDisplay.BIT1) : ret.concat(QuadDisplay.BIT0);
      chr = chr >> 1;
    }
  }

  digitalPulse(this.pin, 0, ret.concat(QuadDisplay.DONE));
};

function _pad(s, pad){
  var sl = pad || 5;
  for(var i=0,l=s.length;i<l;i++) 
    sl -= (s[i] == "." || s[i] == "&") ? 0 : 1;
  return Array(sl<0 ? 0 : sl).join(" ");
}

QuadDisplay.BIT0 = [0.015, 0.060];
QuadDisplay.BIT1 = [0.001, 0.030];
QuadDisplay.DONE = [0.060, 0.3, 0];

var SYMBOLS = {
  " ": 0b11111111,
  "-": 0b11111101,
  "^": 0b01111111,
  "_": 0b11101111,
  "*": 0b00111001,
  "0": 0b00000011,
  "1": 0b10011111,
  "2": 0b00100101,
  "3": 0b00001101,
  "4": 0b10011001,
  "5": 0b01001001,
  "6": 0b01000001,
  "7": 0b00011111,
  "8": 0b00000001,
  "9": 0b00001001,
  "A": 0b00010001,
  "a": 0b00000101,
  "B": 0b00000001,
  "b": 0b11000001,
  "C": 0b01100011,
  "c": 0b11100101,
  "D": 0b10000101,
  "d": 0b10000101,
  "E": 0b01100001,
  "e": 0b01100001,
  "F": 0b01110001,
  "f": 0b01110001,
  "G": 0b01000011,
  "g": 0b01000011,
  "H": 0b10010001,
  "h": 0b11010001,
  "I": 0b10011111,
  "i": 0b10011111,
  "J": 0b10001111,
  "j": 0b10001111,
  "K": 0b10010001,
  "k": 0b11010001,
  "L": 0b11100011,
  "l": 0b11100011,
  "M": 0b01100001,
  "m": 0b01100001,
  "N": 0b11010101,
  "n": 0b11010101,
  "O": 0b00000011,
  "o": 0b11000101,
  "P": 0b00110001,
  "p": 0b00110001,
  "Q": 0b00011001,
  "q": 0b00011001,
  "R": 0b11110101,
  "r": 0b11110101,
  "S": 0b01001001,
  "s": 0b01001001,
  "T": 0b11100001,
  "t": 0b11100001,
  "u": 0b11000111,
  "U": 0b10000011,
  "v": 0b11000111,
  "V": 0b10000011,
  "w": 0b11000111,
  "W": 0b10000011,
  "X": 0b10010001,
  "x": 0b11010001,
  "Y": 0b10001001,
  "y": 0b10001001,
  "Z": 0b00100101,
  "z": 0b00100101
};

exports.connect = function(pin) {
  return new QuadDisplay(pin);
};
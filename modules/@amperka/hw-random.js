exports = {
  int: function(from, to) {
    var n = to - from + 1;
    var x = ((E.hwRand() % n) + n) % n;
    return from + x;
  }
};

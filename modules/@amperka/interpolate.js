function lerp(k, from, to) {
  return from + k * (to - from);
}

function map(val, fromMin, fromMax, toMin, toMax, clip) {
  var k = (val - fromMin) / (fromMax - fromMin);
  val = lerp(k, toMin, toMax);
  if (clip) {
    val = E.clip(toMin, toMax);
  }

  return val;
}

exports.map = map;
exports.lerp = lerp;

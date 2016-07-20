var senseShooth = 0;

setWatch(function (e) {
  var dt = e.time - e.lastTime;
  if (e.state) {
    //print('show');
    if (senseShooth++ > 50) {
      print('shoot');
      senseShooth = 0;
    }
  } else {
    //print('hide');
  }
}, P8, {
   repeat: true,
   edge: 'both'
});

var shoot = true;
analogWrite(P3, 0.5, 38000);
setInterval(function() {
    shoot = !shoot;
    digitalWrite(P2, shoot);
}, 1);


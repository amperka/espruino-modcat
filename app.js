var express = require('express');
var app = express();

app.use(express.static(__dirname + '/modules'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});

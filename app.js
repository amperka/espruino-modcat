
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/modules'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

// The 404 Route
app.get('*', function(req, res){
  if (req.url.indexOf('amperka') > -1) {
    console.log('Not found:', req.url)
    res.status(404).send('Not found');
  } else {
    console.log('Redirect for:', req.originalUrl)
    res.redirect('http://espruino.com/modules/' + req.originalUrl);
  }
});

var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});


var express = require('express');
var app = express();

app.use('/modules', express.static(__dirname + '/modules'));
app.use('/binaries', express.static(__dirname + '/binaries'));
app.use('/json', express.static(__dirname + '/json'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

// The 404 Route
app.get('*', function(req, res){
  if (req.url.indexOf('amperka') > -1) {
    console.log('Not found:', req.url)
    res.status(404).send('Not found');
  } else if (req.originalUrl.indexOf('/modules/') === 0) {
    var module = req.originalUrl.substr('/modules/'.length);
    console.log('Redirect for:', module)
    res.redirect('http://espruino.com/modules/' + module);
  }
});

var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});

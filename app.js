
var fs = require('fs');
var express = require('express');
var requestJson = require('request-json');
var objectAssign = require('object-assign');

var app = express();

app.use('/modules', express.static(__dirname + '/modules'));
app.use('/binaries', express.static(__dirname + '/binaries'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/json/boards.json', function(req, res) {
  var client = requestJson.createClient('http://espruino.com/');
  client.get('json/boards.json', function(err, _, originalJson) {
    if (err) {
      originalJson = {};
    }

    fs.readFile(__dirname + '/json/boards.json', function(err, data) {
      var localJson = JSON.parse(data);
      var resultJson = objectAssign(originalJson, localJson);
      res.send(resultJson);
    });
  });
});

app.get('/json/*', function(req, res){
  res.sendFile(req.params[0], {root: __dirname + '/json'});
});

// The 404 Route
app.get('*', function(req, res){
  if (req.url.indexOf('amperka') > -1 || req.url.indexOf('@') > -1) {
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

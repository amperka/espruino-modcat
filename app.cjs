// Do not remove! This file needed for uses library offline.

const fs = require('node:fs');
const express = require('express');
const requestJson = require('request-json');

const app = express();

app.use('/modules', express.static(`${__dirname}/modules`));
app.use('/binaries', express.static(`${__dirname}/binaries`));

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.get('/json/boards.json', (_req, res) => {
  const client = requestJson.createClient('https://espruino.com/');
  client.get('json/boards.json', (err, _, originalJson) => {
    if (err) {
      originalJson = {};
    }

    fs.readFile(`${__dirname}/json/boards.json`, (_err, data) => {
      var localJson = JSON.parse(data);
      var resultJson = Object.assign(originalJson, localJson);
      res.send(resultJson);
    });
  });
});

app.get('/json/{*path}', (req, res) => {
  const root = `${__dirname}/json`;
  const filename = req.params.path?.join('/');
  fs.access(`${root}/${filename}`, fs.F_OK, (err) => {
    if (err) {
      res.redirect(`https://espruino.com/json/${filename}`);
    } else {
      console.log(filename);
      res.sendFile(filename, { root: root });
    }
  });
});

// The 404 Route
app.get('{*path}', (req, res) => {
  const module = req.originalUrl.substring('/modules/'.length);
  if (req.url.indexOf('amperka') > -1 || req.url.indexOf('@') > -1) {
    console.log('Not found:', req.url);
    res.status(404).send('Not found');
  } else if (req.originalUrl.indexOf('/modules/') === 0) {
    console.log('Redirect for:', module);
    res.redirect(`https://espruino.com/modules/${module}`);
  }
});

var server = app.listen(3001, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});

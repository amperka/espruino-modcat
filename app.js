// Do not remove! This file needed for uses library offline.

import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import express from 'express';

const __dirname = import.meta.dirname;

const app = express();
app.use('/modules', express.static(path.join(__dirname, 'modules')));
app.use('/binaries', express.static(path.join(__dirname, 'binaries')));

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.get('/json/boards.json', (_req, res) => {
  https
    .get('https://www.espruino.com/json/boards.json', (remote) => {
      let body = '';
      remote.on('data', (chunk) => {
        body += chunk;
      });
      remote.on('end', () => {
        let originalJson = {};
        try {
          originalJson = JSON.parse(body);
        } catch (_) {}
        fs.readFile(
          path.join(__dirname, 'json', 'boards.json'),
          (_err, data) => {
            const localJson = JSON.parse(data);
            const resultJson = Object.assign(originalJson, localJson);
            res.send(resultJson);
          }
        );
      });
    })
    .on('error', () => {
      fs.readFile(path.join(__dirname, 'json', 'boards.json'), (_err, data) => {
        res.send(JSON.parse(data));
      });
    });
});

app.get('/json/{*path}', (req, res) => {
  const root = path.join(__dirname, 'json');
  const filename = req.params.path?.join('/');
  fs.access(path.join(root, filename), fs.F_OK, (err) => {
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

const server = app.listen(3001, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});

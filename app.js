// Do not remove! This file needed for uses library offline.

import { createReadStream } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { request as httpsRequest } from 'node:https';
import path from 'node:path';

const __dirname = import.meta.dirname;
const PORT = 3001;
const JSON_ROOT = path.join(__dirname, 'json');
const MODULES_ROOT = path.join(__dirname, 'modules');
const BINARIES_ROOT = path.join(__dirname, 'binaries');
const REMOTE_ROOT = 'https://www.espruino.com';
const REMOTE_BOARDS_URL = `${REMOTE_ROOT}/json/boards.json`;

const MIME_TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const send = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, headers);
  res.end(body);
};

const sendJson = (res, statusCode, payload) => {
  send(res, statusCode, JSON.stringify(payload), {
    'Content-Type': MIME_TYPES['.json']
  });
};

const redirect = (res, location, statusCode = 302) => {
  send(res, statusCode, '', { Location: location });
};

const normalizePath = (pathname, prefix) => {
  const relativePath = pathname.slice(prefix.length);
  const segments = relativePath.split('/').filter(Boolean);

  if (segments.some((segment) => segment === '..')) {
    return null;
  }

  return segments;
};

const resolveSafePath = (root, segments) => {
  const resolvedPath = path.resolve(root, ...segments);
  return resolvedPath.startsWith(`${root}${path.sep}`) || resolvedPath === root
    ? resolvedPath
    : null;
};

const fetchRemoteJson = (url) =>
  new Promise((resolve, reject) => {
    const req = httpsRequest(url, (remote) => {
      const statusCode = remote.statusCode ?? 500;

      if (statusCode >= 400) {
        reject(new Error(`Remote request failed with status ${statusCode}`));
        remote.resume();
        return;
      }

      let body = '';
      remote.setEncoding('utf8');
      remote.on('data', (chunk) => {
        body += chunk;
      });
      remote.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Remote JSON is invalid'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

const readLocalJson = async (filePath) =>
  JSON.parse(await readFile(filePath, 'utf8'));

const getContentType = (filePath) =>
  MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream';

const serveFile = async (res, filePath) => {
  const fileInfo = await stat(filePath);

  if (!fileInfo.isFile()) {
    send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  res.writeHead(200, {
    'Content-Length': fileInfo.size,
    'Content-Type': getContentType(filePath)
  });

  createReadStream(filePath).pipe(res);
};

const handleBoardsJson = async (res) => {
  const localJson = await readLocalJson(path.join(JSON_ROOT, 'boards.json'));

  try {
    const remoteJson = await fetchRemoteJson(REMOTE_BOARDS_URL);
    sendJson(res, 200, { ...remoteJson, ...localJson });
  } catch {
    sendJson(res, 200, localJson);
  }
};

const handleJsonRequest = async (_req, res, pathname) => {
  const segments = normalizePath(pathname, '/json/');

  if (!segments?.length) {
    send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  if (segments.join('/') === 'boards.json') {
    await handleBoardsJson(res);
    return;
  }

  const filePath = resolveSafePath(JSON_ROOT, segments);

  if (!filePath) {
    send(res, 400, 'Bad request', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  try {
    await access(filePath);
    console.log(segments.join('/'));
    await serveFile(res, filePath);
  } catch {
    redirect(res, `${REMOTE_ROOT}/json/${segments.join('/')}`);
  }
};

const handleStaticRequest = async (res, pathname, prefix, root) => {
  const segments = normalizePath(pathname, prefix);

  if (!segments?.length) {
    send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  const filePath = resolveSafePath(root, segments);

  if (!filePath) {
    send(res, 400, 'Bad request', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  try {
    await serveFile(res, filePath);
  } catch {
    send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
  }
};

const handleFallback = (req, res) => {
  if (req.url.includes('amperka') || req.url.includes('@')) {
    console.log('Not found:', req.url);
    send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
    return;
  }

  if (req.url.startsWith('/modules/')) {
    const moduleName = req.url.slice('/modules/'.length);
    console.log('Redirect for:', moduleName);
    redirect(res, `${REMOTE_ROOT}/modules/${moduleName}`);
    return;
  }

  send(res, 404, 'Not found', { 'Content-Type': MIME_TYPES['.txt'] });
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;

    if (req.method !== 'GET') {
      send(res, 405, 'Method not allowed', {
        Allow: 'GET',
        'Content-Type': MIME_TYPES['.txt']
      });
      return;
    }

    if (pathname === '/') {
      send(res, 200, 'Hello World!', { 'Content-Type': MIME_TYPES['.txt'] });
      return;
    }

    if (pathname.startsWith('/modules/')) {
      await handleStaticRequest(res, pathname, '/modules/', MODULES_ROOT);
      return;
    }

    if (pathname.startsWith('/binaries/')) {
      await handleStaticRequest(res, pathname, '/binaries/', BINARIES_ROOT);
      return;
    }

    if (pathname.startsWith('/json/')) {
      await handleJsonRequest(req, res, pathname);
      return;
    }

    handleFallback(req, res);
  } catch (error) {
    console.error(error);
    send(res, 500, 'Internal server error', {
      'Content-Type': MIME_TYPES['.txt']
    });
  }
});

server.listen(PORT, () => {
  const address = server.address();
  if (address && typeof address === 'object') {
    console.log('App listening at http://%s:%s', address.address, address.port);
  }
});

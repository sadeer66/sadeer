'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf' };

function createServer(root, {authorize=()=>false}={}) {
  root = path.resolve(root);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bundle-manifest.json'))).files;
  const aliases = JSON.parse(fs.readFileSync(path.join(root, 'shared-library/index.json'))).aliases;
  const verified = new Set();
  return http.createServer((req, res) => {
    const fail = code => { res.writeHead(code); res.end(); };
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405);
    // Only local app origins can read files. No CORS permission is granted.
    if (req.headers.host !== `127.0.0.1:${req.socket.localPort}`) return fail(403);
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return fail(403);
    if (req.headers['sec-fetch-site'] === 'cross-site') return fail(403);
    let name;
    try { name = decodeURIComponent((req.url || '/').split('?')[0]); } catch { return fail(400); }
    if (name.includes('\\') || name.includes('\0') || name.split('/').includes('..')) return fail(403);
    name = name.replace(/^\/+/, '');
    if (!name || name.endsWith('/')) name += 'index.html';
    const target = Object.hasOwn(aliases, name) ? aliases[name] : name;
    if (!authorize(name,target)) return fail(403);
    if (!Object.hasOwn(manifest, target)) return fail(404);
    const full = path.resolve(root, target);
    if (!full.startsWith(root + path.sep)) return fail(403);
    try {
      const data = fs.readFileSync(full);
      if (!verified.has(target)) {
        if (crypto.createHash('sha256').update(data).digest('hex') !== manifest[target].sha256) return fail(500);
        verified.add(target);
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(target)] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': target.startsWith('shared-library/files/') ? 'private, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { fail(500); }
  });
}
module.exports = {createServer};

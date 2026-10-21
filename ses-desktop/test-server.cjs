'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createServer} = require('./server.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, 'Web'));
test('All original media URLs resolve byte-for-byte to one central copy', async () => {
  const server = createServer(root,{authorize:()=>true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const index = JSON.parse(fs.readFileSync(path.join(root, 'shared-library/index.json')));
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bundle-manifest.json'))).files;
    const entries = Object.entries(index.aliases);
    for (let offset = 0; offset < entries.length; offset += 12) {
      await Promise.all(entries.slice(offset, offset + 12).map(async ([alias, target]) => {
        const response = await fetch(origin + '/' + alias + '?cache=compatibility');
        assert.equal(response.status, 200, alias);
        assert.equal(crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), manifest[target].sha256, alias);
      }));
    }
    for (const stage of ['color', 'furni', 'sewer', 'electric']) {
      assert.equal((await fetch(`${origin}/apps/${stage}/`)).status, 200);
      assert.equal((await fetch(`${origin}/apps/${stage}/engine.html`)).status, 200);
    }
    assert.equal((await fetch(origin + '/?v=desktop-central1')).status, 200);
    assert.equal((await fetch(origin + '/missing')).status, 404);
    assert.equal((await fetch(origin + '/%2e%2e%2foutside')).status, 403);
    assert.equal((await fetch(origin + '/', {headers:{Origin:'https://example.com'}})).status, 403);
    assert.equal((await fetch(origin + '/', {method:'POST', body:'x'})).status, 405);
    console.log(JSON.stringify({verified_media_urls:entries.length, unique_physical_media:Object.keys(index.assets).length}));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('Desktop server denies all application files unless activation explicitly authorizes them',async()=>{
  const server=createServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const origin=`http://127.0.0.1:${server.address().port}`;assert.equal((await fetch(origin+'/')).status,403);assert.equal((await fetch(origin+'/apps/furni/engine.html')).status,403);}finally{await new Promise(resolve=>server.close(resolve));}
});

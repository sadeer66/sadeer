'use strict';
const {app, BrowserWindow, session, dialog} = require('electron');
const path = require('node:path');
const {createServer} = require('./server.cjs');
const fs = require('node:fs');
// Separate profile: this preview cannot overwrite data from installed programs.
app.setPath('userData', path.join(app.getPath('appData'), 'SES-Desktop-Central-Preview'));
let server;
let window;
const smokeTest = process.argv.includes('--smoke-test');
const port = 58267; // Stable local origin preserves projects and browser storage between launches.
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(async () => {
    const root = app.isPackaged ? path.join(process.resourcesPath, 'Web') : path.join(__dirname, 'Web');
    server = createServer(root);
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${port}`;
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = new URL(details.url);
      callback({cancel: !(['data:', 'blob:'].includes(url.protocol) || url.origin === origin)});
    });
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    const aliases = JSON.parse(fs.readFileSync(path.join(root, 'shared-library/index.json'))).aliases;
    window = new BrowserWindow({width:1440, height:960, show:false, backgroundColor:'#f3eadb',
      title:'SES — Desktop Preview', icon:path.join(root, aliases['assets/icons/ses-180-v9.png']),
      webPreferences:{nodeIntegration:false, contextIsolation:true, sandbox:true, webSecurity:true}});
    window.removeMenu();
    window.webContents.setWindowOpenHandler(({url}) => ({action:url === 'about:blank' || new URL(url).origin === origin ? 'allow' : 'deny',
      overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false, contextIsolation:true, sandbox:true}}}));
    window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
    window.once('ready-to-show', () => { if (!smokeTest) { window.maximize(); window.show(); window.focus(); } });
    await window.loadURL(origin + '/?v=desktop-central1');
    if (smokeTest) {
      await require('./smoke.cjs')(window, root);
      app.exit(0);
    }
  }).catch(error => { if (smokeTest) { console.error(error); app.exit(1); } else { dialog.showErrorBox('SES', error.message); app.quit(); } });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => server?.close());
}

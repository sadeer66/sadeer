'use strict';
const {app, BrowserWindow, session, dialog, ipcMain, safeStorage, clipboard} = require('electron');
const path = require('node:path');
const {createServer} = require('./server.cjs');
const fs = require('node:fs');
const {createActivation}=require('./license/controller.cjs');
const {mayRead}=require('./license/core.cjs');
// Separate profile: this preview cannot overwrite data from installed programs.
app.setPath('userData', path.join(app.getPath('appData'), 'SES-Desktop-Activation-Preview'));
let server;
let window;
const smokeTest = !app.isPackaged && process.argv.includes('--smoke-test');
const port = 58268; // Separate origin and data from the approved unlicensed preview.
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(async () => {
    const root = app.isPackaged ? path.join(process.resourcesPath, 'Web') : path.join(__dirname, 'Web');
    let activation;
    server = createServer(root,{authorize:(name,target)=>mayRead(activation?.getLicense(),name,target)});
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${port}`;
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    const aliases = JSON.parse(fs.readFileSync(path.join(root, 'shared-library/index.json'))).aliases;
    window = new BrowserWindow({width:1440, height:960, show:false, backgroundColor:'#f3eadb',
      title:'SES — Desktop Preview', icon:path.join(root, aliases['assets/icons/ses-180-v9.png']),
      webPreferences:{nodeIntegration:false, contextIsolation:true, sandbox:true, webSecurity:true,preload:path.join(__dirname,'license/preload.cjs')}});
    const fixture=smokeTest?require('./license/test-fixture.cjs')():null;
    // Packaged apps always use the pinned public keys. No environment override or test bypass.
    const keys=fixture?.keys||JSON.parse(fs.readFileSync(path.join(__dirname,'license/public-keys.json'))).keys;
    activation=createActivation({app,window,ipcMain,dialog,safeStorage,clipboard,root,origin,keys});
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = new URL(details.url);
      callback({cancel: !(['data:', 'blob:'].includes(url.protocol) || url.origin === origin || activation.files.includes(details.url))});
    });
    window.removeMenu();
    window.webContents.setWindowOpenHandler(({url}) => ({action:url === 'about:blank' || new URL(url).origin === origin ? 'allow' : 'deny',
      overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false, contextIsolation:true, sandbox:true}}}));
    window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin&&url!==activation.activationURL) event.preventDefault(); });
    window.once('ready-to-show', () => { if (!smokeTest) { window.maximize(); window.show(); window.focus(); } });
    if(fixture)await fixture.activate(activation,origin,window);
    if(activation.getLicense())await window.loadURL(origin + '/?v=activation1');else await activation.show();
    if (smokeTest) {
      await require('./smoke.cjs')(window, root);
      app.exit(0);
    }
  }).catch(error => { if (smokeTest) { console.error(error); app.exit(1); } else { dialog.showErrorBox('SES', error.message); app.quit(); } });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => server?.close());
}

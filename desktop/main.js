const { app, BrowserWindow, shell, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

app.setName('FurniPlan');
app.setAppUserModelId('com.sadeer.furniplan');

let localServer = null;

function writeLog(message) {
  try {
    const dir = app.getPath('userData');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'FurniPlan-startup.log'), `[${new Date().toISOString()}] ${message}\n`);
  } catch (_) {}
}

const mime = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon',
  '.webp':'image/webp',
  '.gif':'image/gif',
  '.woff':'font/woff',
  '.woff2':'font/woff2'
};

function startLocalServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url, 'http://127.0.0.1');
        let rel = decodeURIComponent(requestUrl.pathname || '/');
        if (rel === '/') rel = '/index.html';

        rel = rel.replace(/^\/+/, '');
        const requested = path.resolve(rootDir, rel);
        const rootResolved = path.resolve(rootDir);

        if (requested !== rootResolved && !requested.startsWith(rootResolved + path.sep)) {
          res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'});
          res.end('Forbidden');
          return;
        }

        fs.stat(requested, (statErr, stat) => {
          if (statErr || !stat.isFile()) {
            res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
            res.end('Not found');
            return;
          }

          res.writeHead(200, {
            'Content-Type': mime[path.extname(requested).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
          });
          const stream = fs.createReadStream(requested);
          stream.on('error', () => {
            if (!res.headersSent) res.writeHead(500);
            res.end();
          });
          stream.pipe(res);
        });
      } catch (err) {
        writeLog(`Server request error: ${err && err.stack ? err.stack : err}`);
        res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
        res.end('Server error');
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({server, port: addr.port});
    });
  });
}

async function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const appRoot = app.getAppPath();
  const indexPath = path.join(appRoot, 'index.html');

  writeLog(`V115 starting. appRoot=${appRoot} index=${indexPath} exists=${fs.existsSync(indexPath)} packaged=${app.isPackaged}`);

  if (!fs.existsSync(indexPath)) {
    dialog.showErrorBox('FurniPlan', `لم يتم العثور على ملف واجهة البرنامج.\n\nالمسار: ${indexPath}\n\nأعد تثبيت FurniPlan V115.`);
    writeLog('index.html missing before server startup');
    app.quit();
    return;
  }

  try {
    const started = await startLocalServer(appRoot);
    localServer = started.server;
    const startUrl = `http://127.0.0.1:${started.port}/index.html`;
    writeLog(`Local server started: ${startUrl}`);

    const win = new BrowserWindow({
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
      minWidth: 1000,
      minHeight: 650,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      title: 'FurniPlan',
      icon: path.join(appRoot, 'build', 'furniplan.ico'),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false
      }
    });

    const revealTimer = setTimeout(() => {
      if (!win.isDestroyed() && !win.isVisible()) {
        win.maximize();
        win.show();
      }
    }, 1500);

    win.once('ready-to-show', () => {
      clearTimeout(revealTimer);
      win.maximize();
      win.show();
    });

    win.webContents.on('did-finish-load', () => writeLog('Page loaded successfully.'));
    win.webContents.on('render-process-gone', (_event, details) => {
      writeLog(`Renderer process gone: ${JSON.stringify(details)}`);
      dialog.showErrorBox('FurniPlan', 'تعذر تشغيل واجهة البرنامج. أغلق البرنامج وافتحه مرة أخرى.');
    });

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      writeLog(`Load failed: ${errorCode} ${errorDescription} ${validatedURL}`);
      dialog.showErrorBox('FurniPlan', `تعذر فتح واجهة FurniPlan.\n${errorDescription} (${errorCode})`);
    });

    await win.loadURL(startUrl);

    win.on('page-title-updated', (event) => {
      event.preventDefault();
      win.setTitle('FurniPlan');
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url && /^https?:/i.test(url) && !url.startsWith('http://127.0.0.1:')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });
  } catch (err) {
    writeLog(`Startup failed: ${err && err.stack ? err.stack : err}`);
    dialog.showErrorBox('FurniPlan', 'تعذر تشغيل خادم FurniPlan المحلي. أعد تثبيت النسخة V115.');
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  try { if (localServer) localServer.close(); } catch (_) {}
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

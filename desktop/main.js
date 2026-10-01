const { app, BrowserWindow, shell, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Windows 10/11: avoid Chromium/GPU black-window issues on some Intel/AMD drivers.
// FurniPlan is a 2D planner, so software rendering is a safe fallback.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

app.setName('FurniPlan');
app.setAppUserModelId('com.sadeer.furniplan');

function writeLog(message) {
  try {
    const dir = app.getPath('userData');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'FurniPlan-startup.log'), `[${new Date().toISOString()}] ${message}\n`);
  } catch (_) {}
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const indexPath = path.join(__dirname, '..', 'index.html');

  writeLog(`Starting. index=${indexPath} exists=${fs.existsSync(indexPath)}`);

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
    icon: path.join(__dirname, '..', 'build', 'furniplan.ico'),
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
  }, 1200);

  win.once('ready-to-show', () => {
    clearTimeout(revealTimer);
    win.maximize();
    win.show();
  });

  win.webContents.on('did-finish-load', () => writeLog('Page loaded successfully.'));

  win.webContents.on('render-process-gone', (_event, details) => {
    writeLog(`Renderer process gone: ${JSON.stringify(details)}`);
    dialog.showErrorBox('FurniPlan', 'تعذر تشغيل واجهة البرنامج. أغلق البرنامج وافتحه مرة أخرى. تم إنشاء سجل تشخيص داخل مجلد بيانات FurniPlan.');
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    writeLog(`Load failed: ${errorCode} ${errorDescription} ${validatedURL}`);
    const msg = `تعذر فتح واجهة FurniPlan.\n\n${errorDescription} (${errorCode})`;
    const safe = msg.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html dir="rtl"><meta charset="utf-8"><body style="font-family:Segoe UI,Tahoma;background:#fff;color:#111;padding:40px"><h2>FurniPlan</h2><p>${safe}</p><p>أعد تثبيت البرنامج من نسخة V113.</p></body></html>`));
  });

  win.loadFile(indexPath).catch(err => {
    writeLog(`loadFile rejected: ${err && err.stack ? err.stack : err}`);
    dialog.showErrorBox('FurniPlan', 'تعذر تحميل ملفات البرنامج. أعد تثبيت FurniPlan V113.');
  });

  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win.setTitle('FurniPlan');
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && /^https?:/i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  writeLog('Electron ready.');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

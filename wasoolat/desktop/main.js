const { app, BrowserWindow, shell, screen } = require('electron');
const path = require('path');

app.setName('الوصولات');
app.setAppUserModelId('com.sadeer.wasoolat');

function markDesktopOfflineReady(win) {
  const script = `
    (() => {
      const pendingText = 'جاري تجهيز البرنامج ليعمل بدون نت';
      const readyText = 'البرنامج لا يحتاج النت ليعمل';

      const all = Array.from(document.querySelectorAll('body *'));
      const target = all.find(el => {
        const t = (el.textContent || '').trim();
        return t.includes(pendingText) && el.children.length <= 3;
      });

      if (target) {
        // Replace only the status wording, preserving the existing container.
        target.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && (node.nodeValue || '').includes(pendingText)) {
            node.nodeValue = node.nodeValue.replace(/جاري تجهيز البرنامج ليعمل بدون نت…?/g, readyText);
          }
        });

        if ((target.textContent || '').includes(pendingText)) {
          target.textContent = readyText;
        }

        target.style.color = '#000';
        target.style.fontWeight = '700';

        // Remove warning marks inside the status area.
        target.querySelectorAll('*').forEach(el => {
          const txt = (el.textContent || '').trim();
          if (txt === '⚠' || txt === '⚠️' || txt === '!' || txt === '❗') el.remove();
        });

        // Add a small green readiness light if one is not already present.
        const parent = target.parentElement || target;
        let dot = parent.querySelector('[data-wasoolat-desktop-ready]');
        if (!dot) {
          dot = document.createElement('span');
          dot.setAttribute('data-wasoolat-desktop-ready', '1');
          dot.setAttribute('aria-label', 'جاهز للعمل بدون إنترنت');
          dot.style.display = 'inline-block';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.background = '#19a64a';
          dot.style.boxShadow = '0 0 0 2px rgba(25,166,74,.18)';
          dot.style.marginInlineStart = '7px';
          dot.style.verticalAlign = 'middle';
          target.insertAdjacentElement('afterend', dot);
        }
      }
    })();
  `;
  win.webContents.executeJavaScript(script).catch(() => {});
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    x: workArea.x, y: workArea.y, width: workArea.width, height: workArea.height,
    minWidth: 900, minHeight: 650, show: false, autoHideMenuBar: true,
    backgroundColor: '#03132b', title: 'الوصولات',
    icon: path.join(__dirname, '..', 'build', 'wasoolat.ico'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.webContents.on('did-finish-load', () => {
    // Electron loads the app locally (file://), so the desktop edition is already offline-capable.
    // Do not leave the PWA service-worker status waiting forever.
    markDesktopOfflineReady(win);
    setTimeout(() => markDesktopOfflineReady(win), 500);
    setTimeout(() => markDesktopOfflineReady(win), 1500);
  });

  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('page-title-updated', (event) => { event.preventDefault(); win.setTitle('الوصولات'); });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && /^https?:/i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

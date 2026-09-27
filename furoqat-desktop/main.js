const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 980,
    minHeight: 700,
    show: false,
    backgroundColor: '#061a36',
    title: 'الفروقات',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'furoqat', 'index.html'));
  win.once('ready-to-show', ()=>{ win.maximize(); win.show(); });
}

app.whenReady().then(()=>{
  createWindow();
  app.on('activate', ()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow(); });
});

app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });

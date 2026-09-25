const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
app.setName('FurniPlan - تأثيثي');
app.setAppUserModelId('com.sadeer.furniplan');
function createWindow(){
  const win=new BrowserWindow({
    width:1600,height:1000,minWidth:1100,minHeight:700,show:false,autoHideMenuBar:true,
    backgroundColor:'#0f172a',icon:path.join(__dirname,'..','build','furniplan.ico'),
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  win.loadFile(path.join(__dirname,'..','index.html'));
  win.once('ready-to-show',()=>{win.maximize();win.show();});
  win.webContents.setWindowOpenHandler(({url})=>{
    if(url&&(/^https?:/i).test(url)){shell.openExternal(url);return {action:'deny'};}
    return {action:'allow'};
  });
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

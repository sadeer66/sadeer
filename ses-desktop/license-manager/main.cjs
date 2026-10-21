'use strict';
const {app,BrowserWindow,dialog,ipcMain,session,safeStorage}=require('electron');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const {generateOwnerKeys,issue}=require('./issuer.cjs');const {DEVICE,STAGES}=require('./core.cjs');
const {Registry}=require('./registry.cjs');const crypto=require('node:crypto');
app.setPath('userData',path.join(app.getPath('appData'),'SES-License-Manager'));
let window;
const gotLock=app.requestSingleInstanceLock();if(!gotLock)app.quit();
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
if(gotLock)app.whenReady().then(async()=>{
  const registry=new Registry(path.join(app.getPath('userData'),'issued-licenses.dat'),{
    encode:text=>{if(!safeStorage.isEncryptionAvailable())throw Error('تعذّر تأمين سجل التراخيص على Windows.');return safeStorage.encryptString(text);},
    decode:bytes=>safeStorage.decryptString(bytes),
  });
  const url=pathToFileURL(path.join(__dirname,'manager.html')).href;
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!['manager.html','manager.js'].map(name=>pathToFileURL(path.join(__dirname,name)).href).includes(details.url)}));
  window=new BrowserWindow({width:940,height:850,show:false,backgroundColor:'#f3eadb',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
  window.removeMenu();window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(e,next)=>{if(next!==url)e.preventDefault();});
  const handle=(name,fn)=>ipcMain.handle('ses-owner:'+name,async(e,value)=>{if(e.sender!==window.webContents||e.senderFrame!==window.webContents.mainFrame||e.senderFrame.url!==url)throw Error('غير مسموح.');return fn(value);});
  handle('generate',async value=>{
    const generated=generateOwnerKeys(value?.passphrase);
    const chosen=await dialog.showOpenDialog(window,{title:'اختر مكان حفظ مفاتيح المالك',properties:['openDirectory','createDirectory']});if(chosen.canceled)return{cancelled:true};
    const folder=path.join(chosen.filePaths[0],'SES-Owner-Keys-'+new Date().toISOString().replace(/[:.]/g,'-'));
    fs.mkdirSync(folder,{mode:0o700});
    fs.writeFileSync(path.join(folder,'SES-Owner-Private.pem'),generated.privateKey,{flag:'wx',mode:0o600});
    fs.writeFileSync(path.join(folder,'SES-Public-Key.json'),JSON.stringify(generated.publicConfig,null,2),{flag:'wx'});
    return{folder,publicFile:path.join(folder,'SES-Public-Key.json')};
  });
  handle('request',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'فتح طلب تفعيل المشتري',properties:['openFile'],filters:[{name:'SES request',extensions:['sesrequest','json']}]});if(result.canceled)return{cancelled:true};
    if(fs.statSync(result.filePaths[0]).size>8192)throw Error('ملف طلب التفعيل كبير أو غير صحيح.');
    let r;try{r=JSON.parse(fs.readFileSync(result.filePaths[0],'utf8'));}catch{throw Error('تعذّرت قراءة طلب التفعيل.');}
    if(r.format!=='SES-REQUEST-1'||r.product!=='ses-desktop'||!DEVICE.test(r.deviceId))throw Error('طلب التفعيل غير صحيح.');
    return{deviceId:r.deviceId};
  });
  handle('issue',async value=>{
    if(!value||!DEVICE.test(value.deviceId)||!Array.isArray(value.programs)||!value.programs.length||value.programs.some(x=>!STAGES.includes(x)))throw Error('تحقق من رمز الجهاز والبرامج المختارة.');
    const source=await dialog.showOpenDialog(window,{title:'اختر مفتاح المالك الخاص المشفر',properties:['openFile'],filters:[{name:'Owner private key',extensions:['pem']}]});if(source.canceled)return{cancelled:true};
    if(fs.statSync(source.filePaths[0]).size>16384)throw Error('ملف المفتاح غير صحيح.');
    const token=issue(fs.readFileSync(source.filePaths[0],'utf8'),value.passphrase,value);
    const name=(value.customer||'Customer').replace(/[\\/:*?"<>|]/g,'-').slice(0,80);
    const target=await dialog.showSaveDialog(window,{title:'حفظ ترخيص المشتري',defaultPath:name+'-SES.seslicense',filters:[{name:'SES license',extensions:['seslicense']}]});if(target.canceled)return{cancelled:true};
    const key=crypto.createPrivateKey({key:fs.readFileSync(source.filePaths[0],'utf8'),format:'pem',passphrase:value.passphrase});
    const publicKey=crypto.createPublicKey(key).export({format:'pem',type:'spki'});
    const record=registry.add(token,publicKey);
    try{fs.writeFileSync(target.filePath,token);}catch{throw Error('حُفظ الترخيص في السجل، لكن تعذّر حفظ الملف. يمكنك إعادة حفظه من السجل.');}
    return{file:target.filePath,licenseId:record.licenseId};
  });
  handle('list',()=>registry.list());
  handle('export',async value=>{const record=registry.find(value?.licenseId);const name=record.customer.replace(/[\\/:*?"<>|]/g,'-').slice(0,80);const result=await dialog.showSaveDialog(window,{title:'إعادة حفظ ملف الترخيص',defaultPath:name+'-SES.seslicense',filters:[{name:'SES license',extensions:['seslicense']}]});if(result.canceled)return{cancelled:true};fs.writeFileSync(result.filePath,record.token);return{file:result.filePath};});
  handle('backup',async()=>{const text=registry.backup();const result=await dialog.showSaveDialog(window,{title:'نسخة احتياطية لسجل التراخيص',defaultPath:'SES-License-Registry.sesregistry',filters:[{name:'SES registry backup',extensions:['sesregistry']}]});if(result.canceled)return{cancelled:true};fs.writeFileSync(result.filePath,text);return{file:result.filePath};});
  handle('restore',async()=>{const result=await dialog.showOpenDialog(window,{title:'دمج نسخة سجل التراخيص',properties:['openFile'],filters:[{name:'SES registry backup',extensions:['sesregistry']}]});if(result.canceled)return{cancelled:true};const file=result.filePaths[0];if(fs.statSync(file).size>32*1024*1024)throw Error('ملف السجل كبير جدًا.');return registry.restore(fs.readFileSync(file,'utf8'));});
  await window.loadURL(url);
  if(!app.isPackaged&&process.argv.includes('--smoke-test')){
    if(!await window.webContents.executeJavaScript("(async()=>!!document.getElementById('generate')&&!!document.getElementById('issue')&&!!document.getElementById('historyBody')&&typeof window.SESOwner.generate==='function'&&Array.isArray(await window.SESOwner.list()))()"))throw Error('Owner screen failed');
    console.log('Owner manager UI and isolated preload passed.');app.exit(0);
  }else window.show();
}).catch(e=>{if(!app.isPackaged&&process.argv.includes('--smoke-test')){console.error(e);app.exit(1);}else{dialog.showErrorBox('SES',e.message);app.quit();}});
app.on('window-all-closed',()=>app.quit());

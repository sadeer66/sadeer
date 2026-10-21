'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const {deviceCode,verifyLicense,PRODUCT}=require('./core.cjs');
function windowsDevice(){
  if(process.platform!=='win32')throw Error('هذه النسخة مخصصة لتفعيل Windows.');
  const text=execFileSync('reg.exe',['query','HKLM\\SOFTWARE\\Microsoft\\Cryptography','/v','MachineGuid','/reg:64'],{encoding:'utf8',windowsHide:true,timeout:5000});
  return deviceCode(/MachineGuid\s+REG_SZ\s+([a-f0-9-]+)/i.exec(text)?.[1]||'');
}
function createActivation({app,window,ipcMain,dialog,safeStorage,clipboard,root,origin,keys}){
  const deviceId=windowsDevice();
  const store=path.join(app.getPath('userData'),'activation-v1.dat');
  const activationURL=pathToFileURL(path.join(__dirname,'activation.html')).href;
  const files=[activationURL,pathToFileURL(path.join(__dirname,'activation.js')).href];
  let license=null;
  function readSaved(){try{const bytes=fs.readFileSync(store);if(bytes.length>65536)return null;return verifyLicense(safeStorage.decryptString(bytes),keys,deviceId);}catch{return null;}}
  license=readSaved();
  function persist(text){
    const validated=verifyLicense(text,keys,deviceId);
    if(!safeStorage.isEncryptionAvailable())throw Error('تعذّر حفظ التفعيل بصورة محمية على Windows.');
    fs.mkdirSync(path.dirname(store),{recursive:true});
    const temporary=store+'.tmp';fs.writeFileSync(temporary,safeStorage.encryptString(text),{mode:0o600});fs.renameSync(temporary,store);
    license=validated;return validated;
  }
  function validateSender(event){
    if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame)throw Error('غير مسموح.');
    const url=event.senderFrame.url;
    if(url!==activationURL&&new URL(url).origin!==origin)throw Error('غير مسموح.');
  }
  const handle=(name,fn)=>ipcMain.handle('ses-license:'+name,async event=>{validateSender(event);return fn();});
  handle('info',()=>{
    const aliases=JSON.parse(fs.readFileSync(path.join(root,'shared-library/index.json'))).aliases;
    const icon='data:image/png;base64,'+fs.readFileSync(path.join(root,aliases['assets/icons/ses-180-v9.png'])).toString('base64');
    return {deviceId,configured:Object.keys(keys).length>0,license,icon};
  });
  handle('copy',()=>{clipboard.writeText(deviceId);return true;});
  handle('request',async()=>{
    const result=await dialog.showSaveDialog(window,{title:'حفظ طلب تفعيل SES',defaultPath:'SES-Activation-Request.sesrequest',filters:[{name:'SES activation request',extensions:['sesrequest']}]});
    if(result.canceled)return{saved:false};
    fs.writeFileSync(result.filePath,JSON.stringify({format:'SES-REQUEST-1',product:PRODUCT,deviceId,createdAt:new Date().toISOString(),version:app.getVersion()},null,2),{flag:'w'});
    return{saved:true};
  });
  handle('import',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'استيراد ترخيص SES',properties:['openFile'],filters:[{name:'SES license',extensions:['seslicense']}]});
    if(result.canceled)return{cancelled:true};
    const file=result.filePaths[0];if(fs.statSync(file).size>32768)throw Error('ملف الترخيص أكبر من الحجم المسموح.');
    persist(fs.readFileSync(file,'utf8'));return{activated:true};
  });
  handle('launch',async()=>{
    license=readSaved();if(!license)throw Error('يلزم تفعيل نسخة SES أولًا.');
    setTimeout(()=>window.loadURL(origin+'/?v=activation1').catch(error=>dialog.showErrorBox('SES',error.message)),25);
    return true;
  });
  return{deviceId,activationURL,files,getLicense:()=>license,persist,readSaved,show:()=>window.loadURL(activationURL)};
}
module.exports={createActivation,windowsDevice};

const { _electron: electron } = require('playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
(async()=>{
 const userData=fs.mkdtempSync(path.join(os.tmpdir(),'receipt-v92-'));
 const app=await electron.launch({executablePath:path.resolve('dist/win-unpacked/Receipt Pro.exe'),args:['--user-data-dir='+userData]});
 try{
 const page=await app.firstWindow();const errors=[],nativeDialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{nativeDialogs.push(d.type());await d.dismiss()});
 await page.waitForTimeout(4600);
 const type=async(id,value)=>{const el=page.locator('#'+id);await el.click();await el.press('ControlOrMeta+A');await el.pressSequentially(value);assert.equal(await el.inputValue(),value,id+' accepts keyboard input')};
 const confirm=async()=>{await page.locator('#receiptMessageDialog[open]').waitFor();await page.click('#receiptMessageOK');await page.locator('#receiptMessageDialog').waitFor({state:'hidden'})};
 for(const number of [undefined,'12']){
  const backup={entries:[{id:100,receipt:1,date:'2026-10-01',kind:'office',amount:75,net:75,commission:0,details:'Restored expense',receiptNo:'7',receiptImages:['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=']}],company:{name:'Test Company',officePercent:0},statementMeta:{client:'Restored Owner',site:'45',work:'Construction',date:'2026-10-01',...(number?{number}:{})}};
  await page.locator('#importFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await confirm();
  await page.waitForFunction(()=>document.getElementById('statementClient').value==='Restored Owner');
  await type('officeDetails','Draft before new list');
  await page.click('.action-list');await page.locator('#receiptMessageDialog[open]').waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.inputValue('#officeDetails'),'Draft before new list');
  assert.equal(await page.locator('#tbody tr').count(),1);
  await page.click('.action-list');await confirm();
  await page.waitForFunction(()=>document.getElementById('officeDetails').value==='');
  assert.equal(await page.inputValue('#statementNumber'),number?'13':'2');
  assert.equal(await page.inputValue('#statementClient'),'Restored Owner');
  assert.equal(await page.inputValue('#statementSite'),'45');
  assert.equal(await page.locator('#tbody tr').count(),0);
  await type('officeDetails','Keyboard works after restore and new list');await type('officeAmount','125');
  await type('statementWork','New work');await type('statementNumber','20');await type('officeReceiptNo','55');
  await page.click('#officeSubmitBtn');await page.waitForFunction(()=>document.querySelectorAll('#tbody tr').length===1);
  await page.click('.action-list');await confirm();await page.waitForFunction(()=>document.getElementById('statementNumber').value==='21');
  await type('officeDetails','Second new list works');
 }
 await page.click('#officeSubmitBtn');await confirm(); // validation notice, still editable afterwards
 await type('officeAmount','200');
 await page.click('.action-owner');await confirm();await page.waitForFunction(()=>document.getElementById('statementClient').value==='');
 await type('statementClient','Brand new owner');await type('officeDetails','Owner reset works');
 // Verify the actual backup action writes all three files, then restores the JSON.
 const downloadDir=fs.mkdtempSync(path.join(os.tmpdir(),'receipt-backup-'));
 await app.evaluate(({BrowserWindow},folder)=>{
  globalThis.receiptTestDownloads=[];
  BrowserWindow.getAllWindows()[0].webContents.session.on('will-download',(_event,item)=>{
   const filename=item.getFilename();item.setSavePath(folder+'/'+filename);
   item.once('done',(_event,state)=>globalThis.receiptTestDownloads.push({filename,state}));
  });
 },downloadDir);
 await type('officeAmount','250');await page.click('#officeSubmitBtn');
 await page.waitForFunction(()=>document.querySelectorAll('#tbody tr').length===1);
 const before=await page.evaluate(async()=>JSON.parse(await (await buildBackupJsonBlob()).text()));
 await page.click('.action-backup');await page.locator('#receiptMessageInput').waitFor({state:'visible'});
 await page.click('#receiptMessageCancel');assert.deepEqual(await app.evaluate(()=>globalThis.receiptTestDownloads),[]);
 await page.click('.action-backup');await page.locator('#receiptMessageInput').fill('نسخة:اختبار92');await page.click('#receiptMessageOK');
 await page.locator('#receiptMessageDialog[open]').waitFor();
 assert(!(await page.locator('#receiptMessageText').textContent()).includes('تعذر'),'backup success notice');
 await page.click('#receiptMessageOK');
 let completed=[];
 for(let i=0;i<150;i++){completed=await app.evaluate(()=>globalThis.receiptTestDownloads);if(completed.length===3)break;await new Promise(r=>setTimeout(r,200))}
 assert.equal(completed.length,3,'three actual downloads');assert(completed.every(x=>x.state==='completed'));
 const filenames=fs.readdirSync(downloadDir);assert.deepEqual(filenames.map(f=>path.extname(f)).sort(),['.doc','.json','.pdf']);
 const jsonPath=path.join(downloadDir,filenames.find(f=>f.endsWith('.json')));
 const saved=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
 assert.deepEqual(saved.entries,before.entries);assert.deepEqual(saved.statementMeta,before.statementMeta);assert.equal(saved.version,92);
 assert(fs.readFileSync(path.join(downloadDir,filenames.find(f=>f.endsWith('.pdf')))).subarray(0,5).equals(Buffer.from('%PDF-')));
 assert(fs.readFileSync(path.join(downloadDir,filenames.find(f=>f.endsWith('.doc'))),'utf8').includes(before.statementMeta.client));
 await page.click('.action-owner');await confirm();
 await page.locator('#importFile').setInputFiles(jsonPath);await confirm();
 await page.waitForFunction(()=>document.querySelectorAll('#tbody tr').length===1);
 const restored=await page.evaluate(async()=>JSON.parse(await (await buildBackupJsonBlob()).text()));
 assert.deepEqual(restored.entries,before.entries);assert.deepEqual(restored.statementMeta,before.statementMeta);
 await type('officeDetails','Keyboard still works after backup restore');
 console.log('PASS: backup naming, cancellation, real JSON/Word/PDF file downloads, valid file contents and JSON restore round trip on packaged Windows EXE.');
 await page.screenshot({path:'dist/receipt-v92-focus-check.png'});
 assert.deepEqual(nativeDialogs,[]);assert.deepEqual(errors,[]);
 console.log('PASS: Windows packaged EXE restores legacy/current backups, cancels safely, creates repeated lists, preserves owner/increments number, accepts real keyboard input after dialogs, and resets owner without native dialogs or JS errors.');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exit(1)});

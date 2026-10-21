'use strict';
const fs=require('node:fs');const path=require('node:path');
const {keyId,verifyLicense}=require('./core.cjs');
function normalize(record){
  if(!record||typeof record.token!=='string'||typeof record.publicKey!=='string'||record.publicKey.length>4096||record.publicKey.includes('PRIVATE KEY'))throw Error('سجل ترخيص غير صحيح.');
  let token,payload;try{token=JSON.parse(record.token);payload=JSON.parse(Buffer.from(token.payload,'base64url').toString('utf8'));}catch{throw Error('تعذّرت قراءة بيانات سجل الترخيص.');}
  const id=keyId(record.publicKey);const verified=verifyLicense(record.token,{[id]:record.publicKey},payload.deviceId);
  return{...verified,keyId:id,token:record.token,publicKey:record.publicKey};
}
class Registry{
  constructor(file,codec={encode:text=>Buffer.from(text),decode:bytes=>bytes.toString('utf8')}){this.file=file;this.codec=codec;}
  read(){
    if(!fs.existsSync(this.file))return[];
    try{if(fs.statSync(this.file).size>32*1024*1024)throw Error();const doc=JSON.parse(this.codec.decode(fs.readFileSync(this.file)));return this.validate(doc);}
    catch{throw Error('تعذّرت قراءة سجل التراخيص. لم تُحذف بياناته؛ استعد نسخة احتياطية سليمة.');}
  }
  validate(doc){if(doc?.format!=='SES-REGISTRY-1'||!Array.isArray(doc.licenses)||doc.licenses.length>10000)throw Error('نسخة سجل التراخيص غير صحيحة.');const rows=doc.licenses.map(normalize);if(new Set(rows.map(x=>x.licenseId)).size!==rows.length)throw Error('أرقام تراخيص مكررة داخل النسخة.');return rows;}
  write(rows,{backup=true}={}){
    const text=JSON.stringify({format:'SES-REGISTRY-1',licenses:rows},null,2);const bytes=this.codec.encode(text);
    fs.mkdirSync(path.dirname(this.file),{recursive:true});const tmp=this.file+'.tmp';const fd=fs.openSync(tmp,'w',0o600);
    try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    if(backup&&fs.existsSync(this.file))fs.copyFileSync(this.file,this.file+'.bak');
    fs.renameSync(tmp,this.file);
  }
  add(token,publicKey){const record=normalize({token,publicKey});const rows=this.read();const old=rows.find(x=>x.licenseId===record.licenseId);if(old){if(old.token!==token)throw Error('رقم ترخيص متعارض.');return record;}this.write([...rows,record]);return record;}
  list(){return this.read().map(({token,publicKey,...row})=>row).reverse();}
  find(id){if(typeof id!=='string'||id.length>64)throw Error('رقم الترخيص غير صحيح.');const record=this.read().find(x=>x.licenseId===id);if(!record)throw Error('الترخيص غير موجود في السجل.');return record;}
  backup(){return JSON.stringify({format:'SES-REGISTRY-1',licenses:this.read()},null,2);}
  restore(text){if(typeof text!=='string'||Buffer.byteLength(text)>32*1024*1024)throw Error('ملف السجل كبير جدًا.');let doc;try{doc=JSON.parse(text);}catch{throw Error('نسخة السجل غير صحيحة.');}const incoming=this.validate(doc);let current,recovered=false;try{current=this.read();}catch{fs.copyFileSync(this.file,this.file+'.unreadable-'+Date.now());current=[];recovered=true;}const merged=new Map(current.map(x=>[x.licenseId,x]));let added=0;for(const row of incoming){const old=merged.get(row.licenseId);if(old&&old.token!==row.token)throw Error('تعارض في سجل التراخيص؛ لم يتم تغيير السجل.');if(!old){merged.set(row.licenseId,row);added++;}}this.write([...merged.values()],{backup:!recovered});return{added,total:merged.size,recovered};}
}
module.exports={Registry};

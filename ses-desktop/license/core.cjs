'use strict';
const crypto = require('node:crypto');
const STAGES = Object.freeze(['color','furni','sewer','electric']);
const PRODUCT = 'ses-desktop';
const DEVICE = /^SES1-(?:[A-F0-9]{4}-){7}[A-F0-9]{4}$/;
function deviceCode(machineGuid) {
  if (typeof machineGuid !== 'string' || !/^[a-f0-9-]{32,40}$/i.test(machineGuid.trim())) throw Error('تعذّر قراءة هوية تثبيت Windows.');
  const value=crypto.createHash('sha256').update('SES-device-v1\0'+machineGuid.trim().toLowerCase()).digest('hex').slice(0,32).toUpperCase();
  return 'SES1-'+value.match(/.{4}/g).join('-');
}
function keyId(publicKey) {
  const key=crypto.createPublicKey(publicKey);
  if(key.asymmetricKeyType!=='ed25519')throw Error('نوع مفتاح التفعيل غير صحيح.');
  return crypto.createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex').slice(0,24);
}
function validatePayload(p, deviceId) {
  if (!p || p.version!==1 || p.product!==PRODUCT || typeof p.licenseId!=='string' || !/^[a-f0-9-]{36}$/i.test(p.licenseId)) throw Error('صيغة الترخيص غير صحيحة.');
  if(!DEVICE.test(p.deviceId)||p.deviceId!==deviceId)throw Error('هذا الترخيص مخصص لجهاز آخر.');
  if(typeof p.customer!=='string'||!p.customer.trim()||p.customer.length>100)throw Error('اسم صاحب الترخيص غير صحيح.');
  if(!Array.isArray(p.programs)||!p.programs.length||p.programs.length>4||new Set(p.programs).size!==p.programs.length||p.programs.some(x=>!STAGES.includes(x)))throw Error('صلاحيات البرامج غير صحيحة.');
  if(!Number.isFinite(Date.parse(p.issuedAt))||p.expiresAt!==null)throw Error('هذه النسخة تدعم الترخيص الدائم فقط.');
  return p;
}
function verifyLicense(text, keys, deviceId) {
  if(typeof text!=='string'||Buffer.byteLength(text)>32768)throw Error('ملف الترخيص أكبر من الحجم المسموح.');
  let token;try{token=JSON.parse(text);}catch{throw Error('تعذّرت قراءة ملف الترخيص.');}
  if(token?.format!=='SES-LICENSE-1'||typeof token.keyId!=='string'||typeof token.payload!=='string'||typeof token.signature!=='string')throw Error('ملف التفعيل غير صحيح.');
  if(!Object.hasOwn(keys,token.keyId))throw Error('الترخيص لم يصدر بمفتاح SES المعتمد لهذه النسخة.');
  if(!/^[A-Za-z0-9_-]+$/.test(token.payload)||!/^[A-Za-z0-9_-]{86}$/.test(token.signature))throw Error('توقيع الترخيص غير صحيح.');
  const publicKey=crypto.createPublicKey(keys[token.keyId]);
  if(publicKey.asymmetricKeyType!=='ed25519'||keyId(keys[token.keyId])!==token.keyId)throw Error('مفتاح التحقق غير صحيح.');
  const bytes=Buffer.from(token.payload,'base64url'),signature=Buffer.from(token.signature,'base64url');
  if(!crypto.verify(null,bytes,publicKey,signature))throw Error('ملف الترخيص عُدّل أو أن توقيعه غير صحيح.');
  let payload;try{payload=JSON.parse(bytes.toString('utf8'));}catch{throw Error('بيانات الترخيص غير صحيحة.');}
  return validatePayload(payload,deviceId);
}
function mayRead(license,name,target=name) {
  if(!license)return false;
  // Shared pictures remain usable by all purchased programs; engine code is stage-specific.
  if(target.startsWith('shared-library/files/'))return true;
  const stage=/^apps\/([^/]+)\//.exec(name)?.[1];
  return !stage||license.programs.includes(stage);
}
module.exports={STAGES,PRODUCT,DEVICE,deviceCode,keyId,verifyLicense,validatePayload,mayRead};

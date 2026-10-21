'use strict';
const crypto=require('node:crypto');
const {keyId,validatePayload}=require('./core.cjs');
function generateOwnerKeys(passphrase){
  if(typeof passphrase!=='string'||passphrase.length<12||passphrase.length>256)throw Error('اختر كلمة مرور لا تقل عن 12 حرفًا.');
  const pair=crypto.generateKeyPairSync('ed25519');
  const publicKey=pair.publicKey.export({format:'pem',type:'spki'});
  const privateKey=pair.privateKey.export({format:'pem',type:'pkcs8',cipher:'aes-256-cbc',passphrase});
  return{privateKey,publicConfig:{product:'ses-desktop',keys:{[keyId(publicKey)]:publicKey}}};
}
function issue(privatePem,passphrase,{deviceId,customer,programs}){
  if(typeof privatePem!=='string'||!privatePem.includes('BEGIN ENCRYPTED PRIVATE KEY')||privatePem.length>16384)throw Error('اختر ملف مفتاح SES الخاص المشفر.');
  let key;try{key=crypto.createPrivateKey({key:privatePem,format:'pem',passphrase});}catch{throw Error('تعذّر فتح المفتاح الخاص. تحقق من الملف وكلمة المرور.');}
  if(key.asymmetricKeyType!=='ed25519')throw Error('نوع المفتاح غير صحيح.');
  const publicKey=crypto.createPublicKey(key).export({type:'spki',format:'pem'});
  const payload=validatePayload({version:1,product:'ses-desktop',licenseId:crypto.randomUUID(),deviceId,customer:typeof customer==='string'?customer.trim():customer,programs,issuedAt:new Date().toISOString(),expiresAt:null},deviceId);
  const bytes=Buffer.from(JSON.stringify(payload));
  return JSON.stringify({format:'SES-LICENSE-1',keyId:keyId(publicKey),payload:bytes.toString('base64url'),signature:crypto.sign(null,bytes,key).toString('base64url')},null,2);
}
module.exports={generateOwnerKeys,issue};

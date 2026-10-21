'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {deviceCode,verifyLicense,mayRead,keyId}=require('./core.cjs');const {generateOwnerKeys,issue}=require('../license-manager/issuer.cjs');
const password='local test password 2026';
const a=deviceCode('12345678-1234-1234-1234-123456789abc'),b=deviceCode('87654321-1234-1234-1234-123456789abc');
test('Device ID is stable across case and whitespace, distinct per Windows identity',()=>{assert.equal(a,deviceCode(' 12345678-1234-1234-1234-123456789ABC '));assert.notEqual(a,b);assert.throws(()=>deviceCode('unknown'));});
test('Encrypted owner key issues a permanent device-bound license; tampering is rejected',()=>{
 const owner=generateOwnerKeys(password);assert.match(owner.privateKey,/BEGIN ENCRYPTED PRIVATE KEY/);assert.throws(()=>crypto.createPrivateKey(owner.privateKey));
 const options={deviceId:a,customer:'مشتري تجريبي',programs:['color','furni']};const token=issue(owner.privateKey,password,options);const keys=owner.publicConfig.keys;const result=verifyLicense(token,keys,a);
 assert.equal(result.customer,options.customer);assert.equal(result.expiresAt,null);assert.deepEqual(result.programs,options.programs);assert.throws(()=>verifyLicense(token,keys,b),/جهاز آخر/);
 assert.throws(()=>issue(owner.privateKey,'wrong password',options));assert.throws(()=>issue(owner.privateKey,password,{...options,programs:['unknown']}));
 const parsed=JSON.parse(token),p=JSON.parse(Buffer.from(parsed.payload,'base64url'));p.programs.push('electric');parsed.payload=Buffer.from(JSON.stringify(p)).toString('base64url');assert.throws(()=>verifyLicense(JSON.stringify(parsed),keys,a),/توقيعه/);
 const other=generateOwnerKeys(password);assert.throws(()=>verifyLicense(token,other.publicConfig.keys,a),/المعتمد/);
 const invalid=JSON.parse(token);invalid.signature=Buffer.alloc(64).toString('base64url');assert.throws(()=>verifyLicense(JSON.stringify(invalid),keys,a));
 assert.throws(()=>verifyLicense('x'.repeat(32769),keys,a));assert.throws(()=>verifyLicense('{}',keys,a));
 assert.ok(mayRead(result,'apps/furni/engine.html'));assert.equal(mayRead(result,'apps/electric/engine.html'),false);assert.equal(mayRead(null,'index.html'),false);assert.ok(mayRead(result,'apps/electric/assets/a.png','shared-library/files/hash.png'));
 const publicPem=Object.values(keys)[0];assert.equal(keyId(publicPem),Object.keys(keys)[0]);assert.ok(!JSON.stringify(owner.publicConfig).includes('PRIVATE'));
});
test('Owner registry persists licenses, re-exports identical tokens, and merges backups without duplication',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const {Registry}=require('../license-manager/registry.cjs');const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ses-registry-'));
 try{
  const owner=generateOwnerKeys(password),publicKey=Object.values(owner.publicConfig.keys)[0],token=issue(owner.privateKey,password,{deviceId:a,customer:'اختبار السجل',programs:['furni']});
  const file=path.join(folder,'registry.dat'),registry=new Registry(file);const record=registry.add(token,publicKey);registry.add(token,publicKey);assert.equal(new Registry(file).list().length,1);assert.equal(registry.find(record.licenseId).token,token);
  assert.equal(registry.list()[0].token,undefined);assert.ok(!registry.backup().includes('PRIVATE KEY'));
  const restored=new Registry(path.join(folder,'restored.dat'));assert.equal(restored.restore(registry.backup()).added,1);assert.equal(restored.restore(registry.backup()).added,0);assert.equal(restored.find(record.licenseId).token,token);
  const before=restored.backup();const corrupt=JSON.parse(before);const parsed=JSON.parse(corrupt.licenses[0].token);parsed.signature=Buffer.alloc(64).toString('base64url');corrupt.licenses[0].token=JSON.stringify(parsed);assert.throws(()=>restored.restore(JSON.stringify(corrupt)));assert.equal(restored.backup(),before);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});

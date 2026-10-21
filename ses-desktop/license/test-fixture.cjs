'use strict';
// CI-only fixture. This file and its throwaway private key are excluded from packaged apps.
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {keyId}=require('./core.cjs');
module.exports=()=>{
  const pair=crypto.generateKeyPairSync('ed25519');const pem=pair.publicKey.export({type:'spki',format:'pem'});const id=keyId(pem);
  return{keys:{[id]:pem},async activate(controller,origin,window){
    assert.equal((await fetch(origin+'/apps/furni/engine.html')).status,403);
    assert.equal(controller.getLicense(),null);
    const data={version:1,product:'ses-desktop',licenseId:crypto.randomUUID(),deviceId:controller.deviceId,customer:'SES CI test only',programs:['color','furni','sewer','electric'],issuedAt:new Date().toISOString(),expiresAt:null};
    const payload=Buffer.from(JSON.stringify(data));const token=JSON.stringify({format:'SES-LICENSE-1',keyId:id,payload:payload.toString('base64url'),signature:crypto.sign(null,payload,pair.privateKey).toString('base64url')});
    await controller.show();
    assert.ok(await window.webContents.executeJavaScript("!!document.getElementById('device')"));
    controller.persist(token);assert.deepEqual(controller.readSaved(),data);
    assert.equal((await fetch(origin+'/apps/furni/engine.html')).status,200);
    console.log('Activation screen, locked server, signed device license, and DPAPI persistence passed.');
  }};
};

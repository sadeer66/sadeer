'use strict';
const fs=require('node:fs');const path=require('node:path');const {keyId}=require('./core.cjs');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'public-keys.json')));
if(config.product!=='ses-desktop'||!config.keys||!Object.keys(config.keys).length)throw Error('Customer packaging requires the owner public key. Generate it locally in SES License Manager and supply SES-Public-Key.json.');
for(const [id,pem]of Object.entries(config.keys)){if(keyId(pem)!==id||pem.includes('PRIVATE KEY'))throw Error('Invalid owner public-key configuration.');}
console.log('Pinned owner verification key validated.');

'use strict';
const fs = require('node:fs');
const path = require('node:path');
module.exports = async function smoke(window, root) {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'shared-library/index.json')));
  const samples = ['color','furni','sewer','electric'].map(stage => {
    const alias = Object.keys(index.aliases).find(x => x.startsWith(`apps/${stage}/`) && /\.(png|webp|jpe?g)$/.test(x));
    return {stage, src:alias ? '/' + alias : '/' + Object.values(index.aliases).find(x => /\.(png|webp|jpe?g)$/.test(x))};
  });
  const result = await window.webContents.executeJavaScript(`(async () => {
    const until = async fn => {for(let n=0;n<1200;n++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out waiting for SES');};
    await until(()=>window.SESProject);
    const check=(v,message)=>{if(!v)throw Error(message);};
    check(document.querySelectorAll('.program-card').length===4,'Four program cards');
    const report=[];
    for(const sample of ${JSON.stringify(samples)}){
      const entry=await window.SESProject.stage(sample.stage);
      check(entry.api&&entry.frame,'Stage API '+sample.stage);
      const image=new entry.frame.contentWindow.Image();
      image.src=sample.src;await image.decode();
      check(image.naturalWidth>0,'Shared image decoded '+sample.stage);
      const canvas=entry.frame.contentDocument.createElement('canvas');canvas.width=8;canvas.height=8;
      canvas.getContext('2d').drawImage(image,0,0,8,8);check(canvas.toDataURL().startsWith('data:image/png'),'Untainted canvas '+sample.stage);
      const state=await entry.api.capture(false);await entry.api.restore(state.native);
      report.push({stage:sample.stage,image:sample.src,width:image.naturalWidth,nativeRoundtrip:true});
    }
    const collected=await window.SESProject.collect(false);
    await window.SESProject.restore(window.SESCore.validate(JSON.parse(JSON.stringify(collected))));
    return {programs:report,unifiedSaveRoundtrip:true};
  })()`);
  console.log(JSON.stringify(result, null, 2));
  return result;
};

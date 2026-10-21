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
      await window.SESProject.switchTo(sample.stage);
      const doc=entry.frame.contentDocument;
      await until(()=>doc.getElementById('sesDesktopSwitch')?.isConnected&&doc.getElementById('sesDesktopSave')?.isConnected&&doc.getElementById('sesDesktopOpen')?.isConnected);
      const panel=sample.stage==='color'?doc.getElementById('filePanel'):sample.stage==='furni'?doc.getElementById('fp222-panel-file'):doc.getElementById('sewerPane_file');
      check(panel.contains(doc.getElementById('sesDesktopSave'))&&panel.contains(doc.getElementById('sesDesktopOpen')),'SES actions in native File panel '+sample.stage);
      check(entry.frame.contentWindow.getComputedStyle(doc.getElementById('sesDesktopSave')).backgroundColor!==entry.frame.contentWindow.getComputedStyle(doc.getElementById('sesDesktopOpen')).backgroundColor,'Distinctive file action colors');
      for(const [control,button]of [['saveUnified','sesDesktopSave'],['openUnified','sesDesktopOpen']]){
        const original=document.getElementById(control).onclick;let called=0;
        try{document.getElementById(control).onclick=()=>{called++;};doc.getElementById(button).click();check(called===1,'Native file button invokes shared '+control);}finally{document.getElementById(control).onclick=original;}
      }
      const toolbar=sample.stage==='color'?doc.querySelector('.top'):sample.stage==='furni'?doc.getElementById('fp222Tabs'):doc.getElementById('sewerRibbonTabs');
      check(toolbar.contains(doc.getElementById('sesDesktopSwitch')),'SES switch in native toolbar '+sample.stage);
      check(getComputedStyle(document.getElementById('sesMenuToggle')).display==='none','No floating SES button');
      doc.getElementById('sesDesktopSwitch').click();
      check(document.getElementById('sesDesktopNavigator').open,'Internal navigation dialog opens');
      check(document.querySelectorAll('#sesDesktopNavGrid [data-stage]').length===3&&document.querySelector('#sesDesktopNavGrid [data-home]'),'Three alternate apps and Home');
      check(!document.querySelector('#sesDesktopNavGrid [data-stage="'+sample.stage+'"]'),'Active app omitted from alternate apps');
      document.getElementById('sesDesktopNavClose').click();
      check(!document.getElementById('sesDesktopNavigator').open,'Dialog closes');
      const image=new entry.frame.contentWindow.Image();
      image.src=sample.src;await image.decode();
      check(image.naturalWidth>0,'Shared image decoded '+sample.stage);
      const canvas=entry.frame.contentDocument.createElement('canvas');canvas.width=8;canvas.height=8;
      canvas.getContext('2d').drawImage(image,0,0,8,8);check(canvas.toDataURL().startsWith('data:image/png'),'Untainted canvas '+sample.stage);
      const state=await entry.api.capture(false);await entry.api.restore(state.native);
      report.push({stage:sample.stage,image:sample.src,width:image.naturalWidth,nativeRoundtrip:true,fileActions:true,toolbarSwitch:true,navigationDialog:true});
    }
    const collected=await window.SESProject.collect(false);
    await window.SESProject.restore(window.SESCore.validate(JSON.parse(JSON.stringify(collected))));
    window.SESDesktop.open('electric');document.querySelector('#sesDesktopNavGrid [data-stage="color"]').click();
    await until(()=>[...document.querySelectorAll('#frames iframe')].some(f=>!f.hidden&&f.src.includes('/color/')));
    check(!document.getElementById('sesDesktopNavigator').open,'Program tile navigation works');
    window.SESDesktop.open('electric');document.querySelector('#sesDesktopNavGrid [data-home]').click();
    await until(()=>!document.body.classList.contains('in-app'));
    check(!document.getElementById('home').hidden,'Home navigation works');
    return {programs:report,unifiedSaveRoundtrip:true};
  })()`);
  console.log(JSON.stringify(result, null, 2));
  return result;
};

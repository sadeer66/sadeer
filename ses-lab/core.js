'use strict';
window.SESCore={
 schema:'ses-project',version:1,
 async digest(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')},
 validate(doc){
  if(doc?.schema!==this.schema||doc.version!==1||!doc.stages||typeof doc.stages!=='object')throw Error('ملف SES غير صالح أو بإصدار غير مدعوم');
  for(const id of ['color','furni'])if(doc.stages[id]){const n=doc.stages[id].native;const w=id==='color'?n?.project?.width:n?.canvas?.width,h=id==='color'?n?.project?.height:n?.canvas?.height;if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>16384||h>16384)throw Error('أبعاد خارطة المشروع غير صالحة');}
  return doc;
 },
 async exchange(source,target,sourceState,targetState){
  if(!sourceState?.map)return false;
  const map=sourceState.map;
  if(target.id==='furni'){
   const different=targetState?.map&&targetState.map.key!==map.key;
   if(different&&!confirm('الخارطة في الأثاث مختلفة. نقل الخارطة الجديدة سيمسح توزيع الأثاث في هذه النسخة التجريبية. هل تريد المتابعة؟'))throw Error('أُلغي نقل الخارطة؛ بقيت المراحل محفوظة');
   await target.applyShared(map,!!different);
  }else if(!targetState?.map){await target.applyShared(map)}
  else if(targetState.map.key===map.key){target.setCalibration(map.pxPerCm)}
  else{if(!confirm('الخارطة في التلوين مختلفة. استبدالها يمسح طبقات التلوين في النسخة التجريبية. هل تريد المتابعة؟'))throw Error('أُلغي نقل الخارطة؛ بقيت المراحل محفوظة');await target.applyShared(map)}
  source.bindKey(map.key);target.bindKey(map.key);return true;
 }
};

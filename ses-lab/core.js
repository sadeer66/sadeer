'use strict';
window.SESCore={
 schema:'ses-project',version:1,stages:['color','furni','sewer','electric'],
 async digest(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')},
 validate(doc){
  if(doc?.schema!==this.schema||doc.version!==1||!doc.stages||typeof doc.stages!=='object'||Array.isArray(doc.stages))throw Error('ملف SES غير صالح أو بإصدار غير مدعوم');
  for(const[id,state]of Object.entries(doc.stages)){if(!this.stages.includes(id))throw Error('مرحلة غير مدعومة في ملف المشروع');const n=state?.native,w=id==='color'?n?.project?.width:n?.canvas?.width,h=id==='color'?n?.project?.height:n?.canvas?.height;if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>16384||h>16384)throw Error('أبعاد خارطة المشروع غير صالحة');if(id!=='color'&&!Array.isArray(n.items))throw Error('عناصر المرحلة غير صالحة');}
  return doc;
 },
 async exchange(source,target,sourceState,targetState){
  if(!sourceState?.map)return false;const map=sourceState.map,different=!!targetState?.map&&targetState.map.key!==map.key;
  const names={color:'التلوين',furni:'الأثاث',sewer:'المجاري',electric:'الكهرباء'};
  if(different&&!confirm('الخارطة في '+names[target.id]+' مختلفة. استبدالها يمسح عمل هذه المرحلة في النسخة التجريبية. هل تريد المتابعة؟'))throw Error('أُلغي نقل الخارطة؛ بقيت المراحل محفوظة');
  try{if(target.id!=='color'||!targetState?.map||different)await target.applyShared(map,different);else target.setCalibration(map.pxPerCm)}catch(error){if(targetState?.native)await target.restore(targetState.native);throw error}
  source.bindKey(map.key);target.bindKey(map.key);return true;
 }
};

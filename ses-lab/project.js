'use strict';
(()=>{
 const by=id=>document.getElementById(id),stages=['color','furni'],frames=new Map(),pending=new Map();
 let active=null,lastStage=null,busy=false,dirty=false,title='مشروعي',lastSaved=null,recovery=null;
 const empty=()=>({schema:'ses-project',version:1,title,updatedAt:new Date().toISOString(),activeStage:active||lastStage,stages:{}});
 function setMenu(open){const visible=!!open&&document.body.classList.contains('in-app');document.body.classList.toggle('ses-menu-open',visible);by('sesMenuToggle').setAttribute('aria-expanded',String(visible));by('sesMenuBackdrop').hidden=!visible;}
 by('sesMenuToggle').onclick=()=>setMenu(!document.body.classList.contains('ses-menu-open'));
 by('sesMenuClose').onclick=()=>setMenu(false);
 by('sesMenuBackdrop').onclick=()=>setMenu(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
 const status=(message,error=false)=>{by('projectStatus').textContent=message;by('projectStatus').classList.toggle('error',error)};
 async function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open(new URLSearchParams(location.search).has('qa')?'ses-lab-qa-v1':'ses-lab-projects-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function draftWrite(doc){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(doc,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
 async function draftRead(){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
 async function stage(id){
  if(frames.has(id))return frames.get(id);
  if(pending.has(id))return pending.get(id).promise;
  SESLoading.show(id);
  const frame=document.createElement('iframe');frame.title=id==='color'?'التلوين — نسخة تجريبية مستقلة':'الأثاث — نسخة تجريبية مستقلة';frame.allow='fullscreen; clipboard-read; clipboard-write';frame.hidden=true;frame.src='apps/'+id+'/?v=progress6'+(new URLSearchParams(location.search).has('qa')?'&qa=1':'');
  const entry={frame,fail:null,promise:null};
  entry.promise=new Promise((resolve,reject)=>{const deadline=Date.now()+180000;let timer;
   entry.fail=error=>{clearInterval(timer);pending.delete(id);frame.remove();reject(error)};
   timer=setInterval(()=>{if(frame.contentWindow?.SESStage){clearInterval(timer);pending.delete(id);const ready={frame,api:frame.contentWindow.SESStage};frames.set(id,ready);resolve(ready)}else if(Date.now()>deadline)entry.fail(Error('لم يكتمل فتح البرنامج. تحقق من الاتصال ثم أعد المحاولة'))},100);
  });
  pending.set(id,entry);by('frames').append(frame);return entry.promise;
 }
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||!e.data||typeof e.data!=='object')return;
  const entry=pending.get(e.data.stage);if(!entry||entry.frame.contentWindow!==e.source)return;
  if(e.data.type==='ses-load-progress')SESLoading.update(e.data.stage,e.data);
  if(e.data.type==='ses-load-error')entry.fail(Error(e.data.message||'تعذر تحميل ملفات البرنامج'));
 });
 async function collect(preview=false){const doc=empty();for(const [id,e]of frames){const state=await e.api.capture(preview);state.native.sharedKey=state.map?.key||null;doc.stages[id]=state}return doc}
 async function autosave(){if(busy||!frames.size)return;try{const doc=await collect(false);await draftWrite(doc);lastSaved=doc;dirty=false;by('restoreDraft').hidden=false;status('حُفظت نسخة استعادة على هذا الجهاز · '+new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'}))}catch(e){status('لم يكتمل الحفظ التلقائي: '+e.message,true)}}
 async function run(action){if(busy)return;busy=true;document.body.classList.add('project-busy');try{await action()}catch(e){status(e.message,true);SESLoading.fail(e.message)}finally{busy=false;document.body.classList.remove('project-busy')}}
 async function switchTo(id){SESLoading.show(id,frames.has(id));try{
  const previous=frames.has(active||lastStage)?active||lastStage:null,source=previous&&frames.get(previous);status('جارٍ فتح المرحلة وتجهيز الخارطة…');
  let sourceState=source?await source.api.capture(false):null;
  const target=await stage(id);SESLoading.preparing();
  if(previous&&previous!==id){const before=await target.api.capture(false);if(sourceState?.map&&(id==='furni'||!before.map||before.map.key!==sourceState.map.key))sourceState=await source.api.capture(true);await SESCore.exchange(source.api,target.api,sourceState,before)}
  for(const [key,e]of frames)e.frame.hidden=key!==id;
  active=id;lastStage=id;by('workspace').hidden=false;by('home').hidden=true;document.body.classList.add('in-app');target.api.refresh();setMenu(false);
  for(const b of document.querySelectorAll('[data-program]'))b.setAttribute('aria-pressed',String(b.dataset.program===id));
  await SESLoading.finish(target.frame);dirty=true;status(sourceState?.map?'تم فتح المرحلة ونقل الخارطة والمعايرة؛ بيانات كل مرحلة محفوظة':'افتح خارطة وعايرها داخل المرحلة، ثم انتقل من الشريط العلوي');
 }catch(error){SESLoading.fail(error.message);throw error}}
 async function restore(doc){
  SESCore.validate(doc);const before=await collect(false);const created=[];
  try{
   for(const id of stages)if(doc.stages[id]){if(!frames.has(id))created.push(id);const e=await stage(id);await e.api.restore(doc.stages[id].native)}
  }catch(error){for(const [id,state]of Object.entries(before.stages))await frames.get(id).api.restore(state.native);for(const id of created){frames.get(id)?.frame.remove();frames.delete(id)}throw error}
  for(const [id,e]of frames)if(!doc.stages[id]){e.frame.remove();frames.delete(id)}
  title=doc.title||'مشروعي';by('projectName').value=title;active=null;lastStage=null;
  const id=stages.includes(doc.activeStage)&&doc.stages[doc.activeStage]?doc.activeStage:stages.find(x=>doc.stages[x]);
  if(id)await switchTo(id);else showHome();lastSaved=doc;dirty=false;try{await draftWrite(doc)}catch{}status('تم فتح مشروع SES بمراحل التلوين والأثاث');
 }
 function showHome(){setMenu(false);if(active)lastStage=active;for(const e of frames.values())e.frame.hidden=true;by('home').hidden=false;by('workspace').hidden=true;document.body.classList.remove('in-app');active=null}
 window.SESProject={stage,switchTo,collect,restore};
 document.querySelectorAll('[data-program]').forEach(button=>button.onclick=()=>run(()=>switchTo(button.dataset.program)));
 if(!document.fullscreenEnabled)by('fullscreen').hidden=true;else by('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){status(e.message,true)}};
 by('homeButton').onclick=()=>run(async()=>{if(active)await frames.get(active).api.capture(false);showHome()});
 by('projectName').onchange=()=>{title=by('projectName').value.trim()||'مشروعي';dirty=true};
 by('saveUnified').onclick=()=>run(async()=>{const doc=await collect(false);let localSaved=true;try{await draftWrite(doc)}catch{localSaved=false}const blob=new Blob([JSON.stringify(doc)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(title.replace(/[\\/:*?"<>|]/g,'-')||'SES-Project')+'.ses';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);lastSaved=doc;dirty=false;status(localSaved?'تم تجهيز ملف المشروع الموحّد وحفظ نسخة استعادة على الجهاز':'تم تجهيز ملف المشروع الموحّد؛ تعذّر الحفظ التلقائي على هذا الجهاز')});
 by('openUnified').onclick=()=>by('unifiedFile').click();
 by('unifiedFile').onchange=()=>{const file=by('unifiedFile').files[0];if(file)run(async()=>{const doc=SESCore.validate(JSON.parse(await file.text()));if(frames.size&&!confirm('فتح المشروع يستبدل العمل الحالي في النسخة التجريبية. احفظه أولًا إذا لزم. متابعة؟'))return;await restore(doc)});by('unifiedFile').value=''};
 by('restoreDraft').onclick=()=>run(async()=>{const doc=recovery||lastSaved||await draftRead();if(!doc)throw Error('لا توجد نسخة استعادة');if(frames.size&&!confirm('استعادة آخر حفظ تلقائي واستبدال العمل الحالي؟'))return;await restore(doc);recovery=null});
 by('newUnified').onclick=()=>run(async()=>{if(frames.size&&!confirm('إنشاء مشروع تجريبي جديد؟ احفظ المشروع الحالي أولًا.'))return;for(const e of frames.values())e.frame.remove();frames.clear();active=null;lastStage=null;title='مشروعي';by('projectName').value=title;showHome();dirty=false;status('مشروع جديد — اختر التلوين أو الأثاث للبدء')});
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&[...frames.values()].some(x=>x.frame.contentWindow===e.source)&&e.data==='ses-dirty')dirty=true});
 setInterval(autosave,30000);
 draftRead().then(doc=>{if(doc){SESCore.validate(doc);recovery=doc;by('restoreDraft').hidden=false;status('توجد نسخة استعادة سابقة على هذا الجهاز — اضغط «استعادة تلقائية» لفتحها')}}).catch(()=>status('الحفظ التلقائي غير متاح؛ استخدم حفظ المشروع لتنزيل ملفك',true));
})();

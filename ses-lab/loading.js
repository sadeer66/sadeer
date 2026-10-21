'use strict';
(()=>{
 const get=id=>document.getElementById(id);let current=null,completed=false;
 const names={color:'تلوين المخطط',furni:'تخطيط الأثاث',sewer:'تمديدات المجاري',electric:'تمديدات الكهرباء'};
 function setPercent(value){const n=Math.max(0,Math.min(100,Math.floor(value)));get('sesLoadFill').style.width=n+'%';get('sesLoadTrack').setAttribute('aria-valuenow',String(n));get('sesLoadPercent').textContent=n+'%';}
 window.SESLoading={
  show(id,cached=false){current=id;completed=false;get('sesTransition').setAttribute('aria-busy','true');get('sesTransition').dataset.stage=id;get('sesTransition').hidden=false;get('sesTransition').classList.remove('load-error');get('sesLoadBack').hidden=true;get('sesLoadTitle').textContent='جارٍ الانتقال إلى برنامج '+(names[id]||'SES');get('sesLoadDetail').textContent=cached?'البرنامج محمّل؛ جارٍ تجهيز مشروعك…':'جارٍ تحميل ملفات البرنامج…';setPercent(cached?99:0);},
  update(id,data){if(id!==current||completed||get('sesTransition').hidden)return;const ratio=data.total>0?Math.max(0,Math.min(1,data.loaded/data.total)):0;setPercent(Math.min(99,ratio*100));get('sesLoadDetail').textContent=ratio>=1?'اكتمل تحميل الملفات؛ جارٍ تجهيز الواجهة…':'تحميل ملفات البرنامج · '+(data.loaded/1048576).toFixed(1)+' من '+(data.total/1048576).toFixed(1)+' ميغابايت';},
  preparing(){if(!current)return;get('sesLoadDetail').textContent='جارٍ تجهيز الواجهة ونقل الخارطة والمعايرة…';setPercent(99);},
  async finish(frame){
   if(!current)return;this.preparing();
   // Wait for the actual visible fonts and images, then for the layout to paint.
   const doc=frame.contentDocument;
   if(doc.fonts?.ready)await doc.fonts.ready;
   const viewport=frame.contentWindow,visible=[...doc.images].filter(im=>{const r=im.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<viewport.innerHeight&&r.left<viewport.innerWidth});
   await Promise.all(visible.map(im=>im.complete?Promise.resolve():im.decode().catch(()=>{})));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   completed=true;get('sesTransition').setAttribute('aria-busy','false');setPercent(100);get('sesLoadDetail').textContent='اكتمل فتح البرنامج';
   await new Promise(resolve=>requestAnimationFrame(resolve));get('sesTransition').hidden=true;current=null;
  },
  fail(message){if(!current)return;completed=true;get('sesTransition').setAttribute('aria-busy','false');get('sesTransition').classList.add('load-error');get('sesLoadTitle').textContent='تعذّر إكمال فتح البرنامج';get('sesLoadDetail').textContent=message;get('sesLoadBack').hidden=false;},
  get active(){return current!==null&&!get('sesTransition').hidden}
 };
 get('sesLoadBack').onclick=()=>{get('sesTransition').hidden=true;current=null;};
})();

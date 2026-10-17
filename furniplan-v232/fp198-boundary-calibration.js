/* Correct axis stretch using two independently measured plan spans. Original image is retained. */
(function(){
 'use strict';
 let session=null;
 const modal=document.getElementById('scaleModal'),heading=modal.querySelector('h3'),description=modal.querySelector('p'),field=modal.querySelector('.field label'),apply=document.getElementById('applyCalBtn');
 const original={heading:heading.textContent,description:description.textContent,field:field.textContent,apply:apply.textContent};
 function restoreText(){heading.textContent=original.heading;description.textContent=original.description;field.textContent=original.field;apply.textContent=original.apply;}
 function cancel(){session=null;restoreText();}
 function calculate(w,h,dx,dy,widthCm,depthCm){
  if(![w,h,dx,dy,widthCm,depthCm].every(v=>Number.isFinite(v)&&v>0))throw Error('أدخل عرضًا وعمقًا صحيحين.');
  const xScale=dx/widthCm,yScale=dy/depthCm,ratio=xScale/yScale;
  const rawHeight=h*ratio,fit=Math.min(1,2100/w,2100/rawHeight);
  const width=Math.max(1,Math.round(w*fit)),height=Math.max(1,Math.round(rawHeight*fit));
  if(width<32||height<32)throw Error('النسبة بين العرض والعمق غير مناسبة؛ تحقق من الحدود والقيم والوحدات.');
  return {width,height,sx:width/w,sy:height/h,scale:xScale*width/w};
 }
 function begin(){
  cancel();
  if(!bgImage||dxfModel){alert(dxfModel?'ملف DXF يعتمد وحداته الأصلية؛ معايرة الحدود مخصصة للخارطة المصورة.':'ارفع صورة الخارطة أولًا.');return;}
  document.getElementById('calibrateBtn').onclick();
  session={axis:'width'};
  setStatus('معايرة الحدود 1 / 2 — حدّد نقطتي العرض أفقيًا من اليسار إلى اليمين، دون الهوامش البيضاء');
 }
 function capture(pair){
  if(!session)return false;
  const horizontal=session.axis==='width',dx=Math.abs(pair[1].x-pair[0].x),dy=Math.abs(pair[1].y-pair[0].y),span=horizontal?dx:dy,cross=horizontal?dy:dx;
  if(span<8||cross>span*.1){alert(horizontal?'حدّد نقطتين على خط عرض أفقي واحد، ومتباعدتين بوضوح.':'حدّد نقطتين على خط عمق عمودي واحد، ومتباعدتين بوضوح.');points=[];draw();return true;}
  session.span=span;pendingCalDistancePx=span;calValue.value='';calUnit.value='m';
  heading.textContent=horizontal?'معايرة الحدود — العرض (1 / 2)':'معايرة الحدود — الطول / العمق (2 / 2)';
  description.textContent=horizontal?'أدخل العرض الحقيقي بين النقطتين. بعده سنحدد العمق؛ لن تتغير الخارطة حتى اكتمال الخطوتين.':'أدخل الطول أو العمق الحقيقي بين النقطتين. سيتم تصحيح نسبة العرض والعمق للخارطة كاملة.';
  field.textContent=horizontal?'العرض الحقيقي':'الطول / العمق الحقيقي';apply.textContent=horizontal?'التالي: تحديد العمق':'اعتماد معايرة الحدود';
  calPreview.textContent='أدخل القياس الصحيح واختر الوحدة.';scaleModal.style.display='flex';targetCursor.style.display='none';calValue.focus();return true;
 }
 function refreshMeasures(){
  window.FP201ColorLayers?.invalidate();
  measurements.forEach(m=>{if(m.p1&&m.p2)m.cm=Math.hypot(m.p2.x-m.p1.x,m.p2.y-m.p1.y)/pxPerCm;});
  areaPolygons.forEach(a=>Object.assign(a,polygonAreaStats(a.points||[])));
 }
 function accept(){
  if(!session)return false;
  const cm=Number(calValue.value)*(calUnit.value==='m'?100:1);
  if(!Number.isFinite(cm)||cm<=0||!session.span){alert('أدخل قياسًا صحيحًا أكبر من صفر.');return true;}
  if(session.axis==='width'){
   session.widthCm=cm;session.dx=session.span;session.axis='depth';session.span=null;
   scaleModal.style.display='none';pendingCalDistancePx=null;points=[];hideLiveMeasureBadge();
   setStatus('معايرة الحدود 2 / 2 — حدّد نقطتي الطول / العمق عموديًا من الأعلى إلى الأسفل');draw();return true;
  }
  let result;try{result=calculate(canvas.width,canvas.height,session.dx,session.span,session.widthCm,cm);}catch(e){alert(e.message);return true;}
  const before=cloneEditState(),sx=result.sx,sy=result.sy;
  const move=p=>{p.x*=sx;p.y*=sy;};
  items.forEach(move);mapLabels.forEach(move);
  measurements.forEach(m=>{if(m.p1)move(m.p1);if(m.p2)move(m.p2);m.offsetX=(m.offsetX||0)*sx;m.offsetY=(m.offsetY||0)*sy;});
  areaPolygons.forEach(a=>{(a.points||[]).forEach(move);a.cardOffsetX=(a.cardOffsetX||0)*sx;a.cardOffsetY=(a.cardOffsetY||0)*sy;});
  canvas.width=result.width;canvas.height=result.height;pxPerCm=result.scale;refreshMeasures();
  cancel();scaleModal.style.display='none';pendingCalDistancePx=null;points=[];areaDraft=[];hideLiveMeasureBadge();activateWorkingTool('select');
  updateScaleUI();updateStageSize();syncSelectedPanel();commitHistory(before);draw();fitToViewportSoon();
  setStatus('تم اعتماد العرض والعمق وتصحيح الخارطة كاملة — يمكن التراجع بزر تراجع');return true;
 }
 window.FP198Boundary={begin,capture,cancel,calculate,refreshMeasures,isActive:()=>!!session};
 const regular=document.getElementById('calibrateBtn'),regularClick=regular.onclick;
 regular.onclick=function(){cancel();return regularClick.apply(this,arguments);};
 const oldApply=apply.onclick;apply.onclick=function(){if(!accept()){const before=cloneEditState();oldApply.apply(this,arguments);if(pxPerCm!==before.pxPerCm){refreshMeasures();commitHistory(before);draw();}}};
 const cancelButton=document.getElementById('cancelCalBtn'),oldCancel=cancelButton.onclick;cancelButton.onclick=function(){cancel();return oldCancel.apply(this,arguments);};
 function setup(){
  const standard=document.getElementById('v44Calibrate');if(!standard)return;
  standard.title='المعايرة العادية — مسافة واحدة';
  const caption=standard.querySelector('.iconLabel');if(caption)caption.textContent='معايرة عادية';
  const b=document.createElement('button');b.type='button';b.id='fp198BoundaryBtn';b.className='modernIconBtn';b.title='معايرة حدود الخارطة: العرض ثم الطول / العمق';b.setAttribute('aria-label',b.title);
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14"/><path d="M5 2h14M2 5v14M5 1v2M19 1v2M1 5h2M1 19h2"/></svg><span class="iconLabel">معايرة حدود</span>';
  b.onclick=begin;standard.after(b);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

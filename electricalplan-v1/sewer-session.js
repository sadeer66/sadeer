/* V101 trial: one tool transaction; explicit commit/cancel and complete mode cleanup. */
(function(){
'use strict';
function boot(){
 const $=id=>document.getElementById(id),copy=v=>JSON.parse(JSON.stringify(v));
 const panel=document.querySelector('.mapPanel');if(!panel||!window.SewerPlan)return;
 let session=null,ending=false,moveArmed=false,continueTap=null,ignoreContinueClickUntil=0;
 const tools=new Set(['v44Calibrate','v44Measure','v65Area','v44Label','sewerStartRoute','sewerAddT','sewerAddY','unifiedEdit','sewerDeletePiece','colorPolygon','colorWand','lMove']);
 const transforms=new Set(['lPlus','lMinus','lRot180','lRot90','lRot45','lReset','lFlipH','lFlipV','lFront','lBack','lCopy','lColor','lDelete']);
 const floating=document.createElement('div');floating.id='trialToolButtons';floating.hidden=true;
 floating.innerHTML='<button type="button" id="trialToolIcon" aria-label="الأداة الحالية"></button><button type="button" id="trialToolAccept" aria-label="تثبيت وإنهاء" title="تثبيت وإنهاء">✓</button><button type="button" id="trialToolCancel" aria-label="إلغاء وإنهاء" title="إلغاء وإنهاء">×</button>';
 panel.appendChild(floating);
 const style=document.createElement('style');style.textContent=`
 .mapPanel{position:relative!important}
 #trialToolButtons{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;direction:ltr;gap:6px;z-index:900;background:none;border:0;padding:0;box-shadow:none}
 #trialToolButtons[hidden],#trialToolButtons button[hidden]{display:none!important}
 #trialToolButtons button{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:6px!important;margin:0;border:1px solid #ffffff66;border-radius:8px;color:white;font:700 23px/1 Arial;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px #0003;touch-action:manipulation;cursor:pointer}
 #trialToolIcon{background:#183752}#trialToolAccept{background:#168144}#trialToolCancel{background:#c43737}
 #trialToolIcon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8}#trialToolIcon img{max-width:24px;max-height:24px;object-fit:contain}#trialToolIcon b{font-size:20px}
 #unifiedOk,#unifiedCancel{display:none!important}
 `;document.head.appendChild(style);
 function icon(source){const button=$('trialToolIcon');button.replaceChildren();const glyph=source?.querySelector('svg,b,img,.iconGlyph,.glyph');if(glyph){const n=glyph.cloneNode(true);n.removeAttribute('id');button.appendChild(n);}else button.textContent='✎';button.title=source?.title||source?.getAttribute('aria-label')||'الأداة الحالية';button.setAttribute('aria-label',button.title);}
 function snapshot(){return {core:cloneEditState(),pipes:window.SewerPlan.snapshot(),engineering:copy(window.SewerEngineering.exportData()),scale:pxPerCm,undo:undoStack.slice(),redo:redoStack.slice()};}
 function clear(){
  window.SewerDelete?.stop();window.SewerEngineering.endInteraction(true);window.SewerPlan.endInteraction(true);
  mode='select';points=[];areaDraft=[];pendingFurnitureDef=null;pendingMapLabelText='';pendingCalDistancePx=null;
  clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;
  drag=null;panDrag=null;measureDrag=null;mapLabelDrag=null;areaCardDrag=null;aimingTouchId=null;labelPlaceTap=null;areaTouchTap=null;
  snapGuides=[];dxfActiveSnap=null;inspectorEditBefore=null;
  if(typeof v99LibraryPointerDrag!=='undefined')v99LibraryPointerDrag=null;
  hideLiveMeasureBadge();targetCursor.style.display='none';canvas.style.cursor='';
  updateInteractionCursor();syncAreaToolLabel();syncSelectedPanel();window.SewerUnifiedRail?.refresh();window.SewerContextUI?.refresh();draw();
 }
 function end(commit){
  if(ending)return;ending=true;const saved=session;
  try{
   if(commit&&mode==='areaMeasure'&&areaDraft.length>=3)finishAreaTool();
   window.SewerDelete?.stop();window.SewerColorLayers.endInteraction(commit);
   window.SewerEngineering.endInteraction(commit);window.SewerPlan.endInteraction(commit);
   if(!commit&&saved){window.SewerPlan.restoreSnapshot(saved.before.pipes);restoreEditState(saved.before.core);window.SewerEngineering.importData(saved.before.engineering,true);pxPerCm=saved.before.scale;undoStack=saved.before.undo;redoStack=saved.before.redo;updateHistoryButtons();}
   session=null;moveArmed=false;clear();floating.hidden=true;
   setStatus(window.FurniPlanLanguage?.get?.()==='en'?(commit?'Completed — choose another tool':'Cancelled — choose another tool'):(commit?'تم التثبيت وإنهاء الأداة — يمكنك اختيار أداة أخرى':'تم الإلغاء وإنهاء الأداة — يمكنك اختيار أداة أخرى'));
  }finally{ending=false;}
 }
 function begin(id,source){
  if(ending)return;if(session?.id===id)return;
  if(session)end(true);else{window.SewerDelete?.stop();window.SewerEngineering.endInteraction(true);window.SewerPlan.endInteraction(true);mode='select';points=[];areaDraft=[];pendingFurnitureDef=null;}
  session={id,before:snapshot()};moveArmed=id==='lMove';$('trialToolAccept').hidden=moveArmed;$('trialToolCancel').hidden=moveArmed;icon(source||$(id));floating.hidden=false;
 }
 function openLabelDialog(){
  if(!hasPlan()){setStatus('ارفع الخارطة أولاً لإضافة مسمى');end(false);return;}
  const overlay=document.createElement('div');overlay.id='trialLabelDialog';
  const en=window.FurniPlanLanguage?.get?.()==='en';
  overlay.style.cssText='position:fixed;inset:0;z-index:50000;background:#0008;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML='<form role="dialog" aria-modal="true" aria-labelledby="trialLabelTitle" style="width:min(400px,90vw);padding:22px;background:#162c43;color:white;border:1px solid #7793ad;border-radius:14px;box-shadow:0 12px 50px #0008;direction:rtl"><h3 id="trialLabelTitle" style="margin:0 0 16px">'+(en?'Add a title':'إضافة مسمى')+'</h3><input id="trialLabelText" type="text" maxlength="200" autocomplete="off" required style="box-sizing:border-box;width:100%;padding:12px;background:#fff;color:#172b42;border:1px solid #9db2c5;border-radius:7px;font:18px Tahoma" aria-label="'+(en?'Title text':'نص المسمى')+'"><div style="display:flex;gap:10px;margin-top:18px"><button type="submit" style="background:#168144;color:white;padding:10px 22px">✓ '+(en?'Place on plan':'وضع على الخارطة')+'</button><button type="button" data-cancel style="background:#b63232;color:white;padding:10px 22px">× '+(en?'Cancel':'إلغاء')+'</button></div></form>';
  document.body.appendChild(overlay);const field=overlay.querySelector('input');
  const close=()=>overlay.remove();
  overlay.querySelector('[data-cancel]').onclick=()=>{close();end(false);};
  overlay.querySelector('form').onsubmit=e=>{e.preventDefault();const value=field.value.trim();if(!value){field.focus();return;}close();activateWorkingTool('labelPlace');pendingMapLabelText=value;selectedMapLabelId=null;selectedMeasureId=null;clearFurnitureSelection();syncSelectedPanel();updateInteractionCursor();setStatus(en?'Click the title position on the plan':'انقر موضع المسمى على الخارطة');draw();};
  overlay.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();end(false);}});
  field.focus();
 }
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 // Capture at window level, before older document/canvas tool handlers.
 window.addEventListener('click',e=>{
  const b=e.target.closest?.('button');if(!b||b.disabled)return;
  if(b.id==='v44Label'||b.id==='addMapLabelBtn'){consume(e);if(session)end(true);begin('v44Label',$('v44Label'));openLabelDialog();return;}
  if(b.id==='sewerContinue'&&Date.now()<ignoreContinueClickUntil){consume(e);return;}
  if(b.id==='sewerContinue'){const ref=window.SewerPlan.selectionReference();consume(e);if(window.SewerPlan.canContinueRoute(ref)){begin('sewerContinue',b);window.SewerPlan.continueRoute(ref);}return;}
  if(b.id==='trialToolAccept'){consume(e);end(true);return;}
  if(b.id==='trialToolCancel'){consume(e);end(false);return;}
  if(b.id==='trialToolIcon'){consume(e);return;}
  if(['unifiedOk','sewerActionOk','sewerFinishRoute'].includes(b.id)&&session){consume(e);end(true);return;}
  if(['unifiedCancel','sewerActionCancel','colorCancel','lDeselect'].includes(b.id)&&session){consume(e);end(false);return;}
  if(b.id==='colorConfirm'&&session){consume(e);end(true);return;}
  if((b.id.startsWith('sewerTab_')&&!['sewerTab_pipes','sewerTab_text'].includes(b.id))||['v101Library','v44New','v44Open','v44Upload','v60Dxf','se61Real','se61Eng'].includes(b.id)){if(session)end(true);return;}
  if(tools.has(b.id)){
   begin(b.id,b);
   if(b.id==='lMove'){consume(e);clear();moveArmed=true;floating.hidden=false;return;}
  }else if(transforms.has(b.id)){
   if(!session)begin('selection',b);else icon(b);
  }
 },true);
 window.addEventListener('pointerdown',e=>{
  if(e.target.closest?.('.elGlowCheck'))return;
  if(e.button>0||ending)return;
  if(e.pointerType==='touch'&&e.target.closest?.('#sewerContinue')){const ref=window.SewerPlan.selectionReference();if(window.SewerPlan.canContinueRoute(ref))continueTap={id:e.pointerId,x:e.clientX,y:e.clientY,ref};return;}

  if(e.target.closest?.('#trialToolButtons')){e.stopPropagation();return;}
  const card=e.target.closest?.('.fcard,.archCard,.fullLibCard,.se61-symbol-card');
  if(card){if(!session||session.id!=='placement')begin('placement',card);return;}
  if(e.target!==canvas||(session&&!moveArmed)||window.SewerNavigation?.active)return;
  const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
  const pipeHit=window.SewerPlan.hitPiece(p,e.pointerType==='touch'),engineeringHit=window.SewerEngineering.isActive()&&window.SewerEngineering.hitPiece(p);
  if(hitTest(p)||hitTestMeasurement(p)||hitTestMapLabel(p)||hitTestAreaCard(p)||pipeHit||engineeringHit){
   const fromMove=moveArmed;
   begin('selection',$('unifiedEdit'));
   if(e.pointerType==='touch'&&window.SewerPlan.touchRouteEndpoint(p))window.SewerPlan.toolAction('edit');
   else if(fromMove&&engineeringHit)window.SewerEngineering.toolAction('edit');
   else if(fromMove&&pipeHit&&!window.SewerEngineering.isActive())window.SewerPlan.toolAction('edit');
  }
 },true);
 window.addEventListener('pointerup',e=>{
  const tap=continueTap;if(!tap||tap.id!==e.pointerId)return;continueTap=null;
  if(Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>12||!e.target.closest?.('#sewerContinue'))return;
  consume(e);ignoreContinueClickUntil=Date.now()+800;
  if(window.SewerPlan.canContinueRoute(tap.ref)){begin('sewerContinue',$('sewerContinue'));window.SewerPlan.continueRoute(tap.ref);}
 },true);
 window.addEventListener('pointercancel',()=>{continueTap=null;},true);
 const originalActivate=activateWorkingTool;
 activateWorkingTool=function(next){if(!ending&&!session&&next!=='select'){const ids={measure:'v44Measure',calibrate:'v44Calibrate',areaMeasure:'v65Area',labelPlace:'v44Label',sewerRoute:'sewerStartRoute',place:'v101Library'};begin(ids[next]||next,$(ids[next]||'unifiedEdit'));}return originalActivate.apply(this,arguments);};
 window.activateWorkingTool=activateWorkingTool;
 window.addEventListener('keydown',e=>{if(!session||e.target.closest?.('#trialLabelDialog')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='Escape'){consume(e);end(false);}else if(e.key==='Enter'){consume(e);end(true);}},true);
 // A right click must not resurrect an old measurement or drawing tool.
 window.addEventListener('contextmenu',e=>{if(e.target===canvas){consume(e);if(session)end(true);}},true);
 window.SewerToolSession={begin,end,get active(){return session?.id||null;},get panOnly(){return false;},get moveArmed(){return moveArmed;}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

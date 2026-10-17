/* One completed operation per activation; right-click re-arms the last working tool. */
(() => {
 'use strict';
 let last=null;
 const text=(ar,en)=>window.FurniPlanLanguage?.get?.()==='en'?en:ar;
 const actions={measure:'measureBtn',calibrate:'calibrateBtn',labelPlace:'addMapLabelBtn'};
 function rememberMode(next){
  if(next==='place'&&pendingFurnitureDef)last={mode:'place',def:JSON.parse(JSON.stringify(pendingFurnitureDef))};
  else if(['measure','calibrate','labelPlace','areaMeasure','surfaceDraw'].includes(next))last={mode:next};
 }
 function rememberMove(){last={mode:'select'};}
 function repeat(){
  if(!last){setStatus(text('اختر أداة أولًا، ثم كلك يمين لإعادتها','Choose a tool first; right-click repeats it'));return;}
  const prior=last;
  // Cancel only unfinished transient marks, without changing saved geometry.
  window.FP199Surfaces?.cancel();
  window.FP201ColorLayers?.cancel();
  points=[];areaDraft=[];drag=null;panDrag=null;measureDrag=null;mapLabelDrag=null;areaCardDrag=null;
  hideLiveMeasureBadge();targetCursor.style.display='none';
  if(prior.mode==='place')armFurniturePlacement(JSON.parse(JSON.stringify(prior.def)));
  else if(prior.mode==='button')document.getElementById(prior.button)?.click();
  else if(prior.button==='fp198BoundaryBtn')window.FP198Boundary?.begin();
  else if(actions[prior.mode])document.getElementById(actions[prior.mode])?.click();
  else if(prior.mode==='areaMeasure'){activateWorkingTool('select');toggleAreaTool();}
  else if(prior.mode==='color')window.FP201ColorLayers?.start(prior.kind);
  else if(prior.mode==='surfaceDraw')window.FP199Surfaces?.begin();
  else if(prior.mode==='select'){
   activateWorkingTool('select');setStatus(text('أداة التحريك جاهزة — اسحب القطعة ثم اتركها لإنهاء الحركة','Move is ready — drag and release an item to finish'));
  }
  last=prior;draw();
 }
 function install(){
  const core=activateWorkingTool;
  activateWorkingTool=function(next){rememberMode(next);return core.apply(this,arguments);};
  window.activateWorkingTool=activateWorkingTool;
  const add=addItem;
  addItem=function(def){const result=add.apply(this,arguments);if(result)last={mode:'place',def:JSON.parse(JSON.stringify(def))};return result;};
  window.addItem=addItem;
 }
 // Record the explicit move and boundary-calibration buttons after their handlers.
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('button');
  if(button?.id==='lMove')rememberMove();
  if(['lPlus','lMinus','lRot180','lRot90','lRot45','lFlipH','lFlipV','lReset','lFront','lBack','lCopy','lGroup','lUngroup','lArrange'].includes(button?.id))last={mode:'button',button:button.id};
  if(button?.id==='fp198BoundaryBtn'&&window.FP198Boundary?.isActive())last={mode:'calibrate',button:'fp198BoundaryBtn'};
 });
 const onPlan=e=>!!e.target.closest?.('#stage,#canvas,#furniplanHighResolution');
 for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','auxclick'])window.addEventListener(type,e=>{
  if(e.button===2&&onPlan(e)){e.preventDefault();e.stopImmediatePropagation();}
 },{capture:true,passive:false});
 window.addEventListener('contextmenu',e=>{
  if(!onPlan(e))return;e.preventDefault();e.stopImmediatePropagation();repeat();
 },{capture:true,passive:false});
 window.FP201Tools={repeat,rememberMove,rememberMeasure:()=>{last={mode:'measure'};},rememberColor:kind=>{last={mode:'color',kind};}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

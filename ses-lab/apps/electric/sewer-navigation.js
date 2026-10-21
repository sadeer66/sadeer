/* Two-finger map navigation takes priority over piece/pipe editing. */
(function(){
'use strict';
function boot(){
 const scroller=document.getElementById('mainScroll');if(!scroller||typeof canvas==='undefined')return;
 const touches=new Map();let gesture=null,frame=0,settling=false,pan=null;
 const api=window.SewerNavigation={get active(){return !!gesture||settling||!!pan;}};
 const pair=()=>[...touches.values()].slice(0,2);
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const distance=(a,b)=>Math.max(8,Math.hypot(a.x-b.x,a.y-b.y));
 function block(e){e.preventDefault();e.stopImmediatePropagation();}
 function paint(){frame=0;if(!gesture||touches.size<2)return;const [a,b]=pair(),mid=midpoint(a,b);
  const next=Math.max(.4,Math.min(12,gesture.zoom*distance(a,b)/gesture.distance));
  if(Math.abs(next-zoom)>.0001)setZoomPercent(next*100);
  const rect=canvas.getBoundingClientRect();
  scroller.scrollLeft+=rect.left+gesture.anchor.x*rect.width/canvas.width-mid.x;
  scroller.scrollTop+=rect.top+gesture.anchor.y*rect.height/canvas.height-mid.y;
  suppressCanvasClickUntil=Date.now()+700;
  window.SewerHighResolution?.refresh();
 }
 function canPan(e){
  if(e.target!==canvas||mode!=="select"||window.SewerPlan?.isDrawing()||pendingFurnitureDef)return false;
  const rect=canvas.getBoundingClientRect(),p={x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};
  return !hitTest(p)&&!hitTestMeasurement(p)&&!hitTestMapLabel(p)&&!hitTestAreaCard(p)&&!hitTestAreaDelete(p)&&!window.SewerPlan?.hitPiece?.(p)&&!(window.SewerEngineering?.isActive()&&window.SewerEngineering.hitPiece?.(p));
 }
 function begin(){
  pan=null;
  const [a,b]=pair(),mid=midpoint(a,b),rect=canvas.getBoundingClientRect();
  gesture={zoom,distance:distance(a,b),anchor:{x:(mid.x-rect.left)*canvas.width/rect.width,y:(mid.y-rect.top)*canvas.height/rect.height}};
  window.SewerPlan?.cancelPointerDrag();window.SewerEngineering?.cancelPointerDrag();cancelInteractionForPinch();
  mapLabelDrag=null;areaCardDrag=null;pinchState=null;activeCanvasTouches.clear();
  targetCursor.style.display='none';suppressCanvasClickUntil=Date.now()+700;
  for(const id of touches.keys())try{scroller.setPointerCapture(id);}catch(_){}
 }
 scroller.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touches.size>=2){settling=false;if(!gesture)begin();block(e);}else if(settling)block(e);else if(canPan(e)){pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};block(e);try{scroller.setPointerCapture(e.pointerId);}catch(_){};}
 },true);
 scroller.addEventListener('pointermove',e=>{
  if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(gesture){block(e);if(touches.size>=2&&!frame)frame=requestAnimationFrame(paint);}else if(pan&&pan.id===e.pointerId){block(e);scroller.scrollLeft=pan.left-(e.clientX-pan.x);scroller.scrollTop=pan.top-(e.clientY-pan.y);}else if(settling)block(e);
 },{capture:true,passive:false});
 function end(e){
  if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;
  const navigating=!!gesture||settling||!!pan;
  if(gesture&&touches.size>=2){if(frame){cancelAnimationFrame(frame);frame=0;}paint();}
  touches.delete(e.pointerId);if(pan&&pan.id===e.pointerId)pan=null;
  if(navigating){block(e);try{scroller.releasePointerCapture(e.pointerId);}catch(_){};activeCanvasTouches.clear();pinchState=null;cancelInteractionForPinch();
   if(touches.size<2){gesture=null;settling=touches.size>0;}
   if(!touches.size){settling=false;suppressCanvasClickUntil=Date.now()+700;window.SewerContextUI?.refresh();window.SewerHighResolution?.refresh();draw();}
  }
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])scroller.addEventListener(type,end,true);
 window.addEventListener('blur',()=>{touches.clear();pan=null;gesture=null;settling=false;if(frame)cancelAnimationFrame(frame);frame=0;activeCanvasTouches.clear();pinchState=null;cancelInteractionForPinch();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

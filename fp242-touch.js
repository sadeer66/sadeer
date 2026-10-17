/* One owner for two-finger navigation across the entire plan viewport. */
(()=>{
 const view=document.getElementById('mainScroll'),points242=new Map();
 let gesture=null,frame=0;
 const stop=e=>{if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();};
 const pair=()=>[...points242.values()].slice(0,2);
 function resetEdits(){
  cancelInteractionForPinch();
  for(const edit of [mapLabelDrag,areaCardDrag])if(edit?.moved&&edit.before)restoreEditState(edit.before);
  mapLabelDrag=null;areaCardDrag=null;aimingTouchId=null;areaTouchTap=null;labelPlaceTap=null;pinchState=null;activeCanvasTouches.clear();
  targetCursor.style.display='none';hideLiveMeasureBadge();draw();
 }
 function start(){
  document.body.classList.add("fp233Navigating");
  const [a,b]=pair(),r=canvas.getBoundingClientRect();
  gesture={distance:Math.max(8,Math.hypot(a.x-b.x,a.y-b.y)),zoom,ax:((a.x+b.x)/2-r.left)/r.width,ay:((a.y+b.y)/2-r.top)/r.height};
 }
 function render(){
  frame=0;if(!gesture||points242.size<2)return;
  const [a,b]=pair(),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  setZoomPercent(100*gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance);
  const r=canvas.getBoundingClientRect();view.scrollLeft+=r.left+gesture.ax*r.width-mx;view.scrollTop+=r.top+gesture.ay*r.height-my;
  suppressCanvasClickUntil=Date.now()+800;
 }
 view.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||e.target.closest('button,input,select,textarea,#furnitureIconToolbar'))return;
  points242.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points242.size===1&&e.target!==canvas&&mode==='select'&&!pendingFurnitureDef&&!document.getElementById('mapLockToggle')?.checked){gesture={};try{view.setPointerCapture(e.pointerId)}catch{}stop(e);}
  if(points242.size>=2){resetEdits();start();for(const id of points242.keys())try{view.setPointerCapture(id)}catch{}stop(e);}
 },true);
 view.addEventListener('pointermove',e=>{
  if(!points242.has(e.pointerId))return;
  const prior=points242.get(e.pointerId);points242.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(!gesture)return;
  if(points242.size>=2){if(!frame)frame=requestAnimationFrame(render);}else{view.scrollLeft-=e.clientX-prior.x;view.scrollTop-=e.clientY-prior.y;}
  suppressCanvasClickUntil=Date.now()+800;stop(e);
 },{capture:true,passive:false});
 function end(e){
  if(!points242.has(e.pointerId))return;
  const owned=!!gesture;
  if(frame){cancelAnimationFrame(frame);frame=0;if(e.type==='pointerup')render();}
  points242.delete(e.pointerId);
  if(!owned)return;
  activeCanvasTouches.delete(e.pointerId);suppressCanvasClickUntil=Date.now()+800;
  if(points242.size>=2)start();
  if(!points242.size){gesture=null;view.classList.remove('panning');window.FurniPlanHighResolution?.refresh();requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('fp233Navigating')));}
  stop(e);
 }
 window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
 view.addEventListener('lostpointercapture',e=>{if(e.target===view&&points242.has(e.pointerId)&&!view.hasPointerCapture(e.pointerId))end(e)},true);
 window.addEventListener('blur',()=>{points242.clear();gesture=null;activeCanvasTouches.clear();pinchState=null;panDrag=null;if(frame)cancelAnimationFrame(frame);frame=0;});
})();

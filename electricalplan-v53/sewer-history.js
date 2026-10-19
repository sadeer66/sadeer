(function(){
'use strict';
function boot(){
 const clone=v=>JSON.parse(JSON.stringify(v,(k,x)=>k.startsWith('_')?undefined:x));const undo=[],redo=[];let current=null,restoring=false,timer=0,held=false,watchUntil=0;
 let libraryRevision=0,librarySnapshot=null;const oldRenderLibrary=renderLibrary;renderLibrary=function(){libraryRevision++;librarySnapshot=null;return oldRenderLibrary.apply(this,arguments);};
 const imageKeys=new Map();function imageKey(value){if(!imageKeys.has(value))imageKeys.set(value,imageKeys.size+1);return imageKeys.get(value);}
 const identities=new WeakMap();let nextIdentity=1;const identity=o=>{if(!o||typeof o!=='object')return 0;if(!identities.has(o))identities.set(o,nextIdentity++);return identities.get(o);};
 const controlIds=['gridToggle','dimsToggle','labelsToggle','shadowToggle','snapToggle','autoDimsToggle','furnitureLockToggle','measureLockToggle','mapLabelLockToggle','mapLockToggle','bgLayerToggle','furnitureLayerToggle','measureLayerToggle','mapLabelLayerToggle','measureArrowsToggle','furnitureSummaryToggle','sewerVisible','sewerAutoElbows','sewerPipeMaterial','sewerPipeDiameter','sewerCreateOutline','sewerCreateOutlineSize','measureSizeRange','mapLabelSizeRange','uiIconSizeRange','uiLabelSizeRange'];
 function capture(){const core=cloneEditState(),sewer=window.SewerPlan.snapshot(false),engineering=window.SewerEngineering.exportData();delete sewer.items;
 const controls={};for(const id of controlIds){const el=document.getElementById(id);if(el)controls[id]=el.type==='checkbox'?el.checked:el.value;}
 const data={core,sewer,engineering,guide:window.SewerColorGuide?.serialize(),colors:window.SewerColorLayers.historySnapshot?window.SewerColorLayers.historySnapshot():window.SewerColorLayers.serialize(),opacity:window.SewerOpacity.serialize(),library:librarySnapshot||(librarySnapshot=clone(furniture)),labelStyle:window.SewerLabelStyle?.snapshot?.(),controls,width:canvas.width,height:canvas.height,scale:pxPerCm,measureScale:measureDisplayScale,labelScale:mapLabelDisplayScale};
 const sig=JSON.stringify({...data,library:libraryRevision,core:{items:core.items,measurements:core.measurements,mapLabels:core.mapLabels,areaPolygons:core.areaPolygons},background:identity(bgImage),dxf:identity(dxfModel)},(key,value)=>key.startsWith('_')?undefined:(key==='src'||key==='mask')&&typeof value==='string'?imageKey(value):value);
 return {data,background:bgImage,dxf:dxfModel,signature:sig};}
 function buttons(){for(const id of ['undoBtn','v44Undo']){const b=document.getElementById(id);if(b)b.disabled=restoring||!undo.length;}for(const id of ['redoBtn','v44Redo']){const b=document.getElementById(id);if(b)b.disabled=restoring||!redo.length;}}
 function checkpoint(){if(restoring||held||window.SewerNavigation?.active||window.SewerColorGuide?.isPlacing())return;const snap=capture();if(!current){current=snap;buttons();return;}if(snap.signature!==current.signature){undo.push(current);if(undo.length>35)undo.shift();redo.length=0;current=snap;}buttons();}
 function schedule(){if(restoring||timer)return;timer=setTimeout(()=>{timer=0;checkpoint();},140);}
 async function restore(snap){const viewport={x:mainScroll.scrollLeft,y:mainScroll.scrollTop};restoring=true;buttons();try{const d=snap.data;window.SewerColorGuide?.finishLegend(false);window.SewerColorGuide?.load(d.guide);
 // Close unfinished edit sessions before replacing their model.
 window.SewerPlan.toolAction('cancel');
 bgImage=snap.background;dxfModel=snap.dxf;if(canvas.width!==d.width)canvas.width=d.width;if(canvas.height!==d.height)canvas.height=d.height;pxPerCm=d.scale;measureDisplayScale=d.measureScale;mapLabelDisplayScale=d.labelScale;
 furniture.splice(0,furniture.length,...clone(d.library));
 for(const [id,value] of Object.entries(d.controls)){const el=document.getElementById(id);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=value;}
 window.SewerPlan.restoreSnapshot({...d.sewer,items:d.core.items});restoreEditState(d.core);
 if(d.labelStyle)window.SewerLabelStyle?.restore?.(d.labelStyle);window.SewerEngineering.importData(d.engineering,true);mode=d.sewer.drawing?'sewerRoute':'select';window.SewerOpacity.load(d.opacity);
 if(window.SewerColorLayers.restoreHistory)await window.SewerColorLayers.restoreHistory(d.colors);else await window.SewerColorLayers.load(d.colors);
 // UI-size handlers persist the two independent interface sliders.
 for(const id of ['uiIconSizeRange','uiLabelSizeRange'])document.getElementById(id)?.dispatchEvent(new Event('input',{bubbles:true}));
 for(const [id,value] of [['measureSizeLabel',d.measureScale],['mapLabelSizeValue',d.labelScale]]){const el=document.getElementById(id);if(el)el.textContent=Math.round(value*100)+'%';}
 saveLibraryState();buildCategoryButtons();updateStageSize();syncSelectedPanel();renderLibrary();draw();window.SewerContextUI?.refresh?.();current=capture();
 }finally{restoring=false;buttons();mainScroll.scrollLeft=viewport.x;mainScroll.scrollTop=viewport.y;window.SewerContextUI?.refresh?.();draw();window.SewerHighResolution?.refresh();}}
 async function step(forward){if(restoring)return;clearTimeout(timer);timer=0;held=false;checkpoint();const from=forward?redo:undo,to=forward?undo:redo;if(!from.length)return;const target=from.pop();to.push(current);await restore(target);setStatus(forward?'تمت إعادة التعديل':'تم التراجع عن التعديل');}
 for(const id of ['undoBtn','v44Undo']){const b=document.getElementById(id);if(b)b.onclick=()=>step(false);}for(const id of ['redoBtn','v44Redo']){const b=document.getElementById(id);if(b)b.onclick=()=>step(true);}
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();e.stopImmediatePropagation();step(e.key.toLowerCase()==='y'||e.shiftKey);}},true);
 function isNavigation(e){const el=e.target,id=el.closest?.('button')?.id||'';return id.startsWith('sewerTab_')||['se61Real','se61Eng','sewerLanguage','sewerPhoneClose','v101Library','lSummary','sewerMobileLibrary'].includes(id)||!!el.closest?.('#sewerCategoryMenu,#categoryList')||el.id==='zoomRange';}
 const heldPointers=new Set();document.addEventListener('pointerdown',e=>{if(!restoring){heldPointers.add(e.pointerId);held=true;}},true);
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{heldPointers.delete(e.pointerId);held=heldPointers.size>0;if(!held&&!isNavigation(e)&&!window.SewerNavigation?.active){watchUntil=Date.now()+1500;schedule();}},true);
 for(const type of ['click','input','change','keydown'])document.addEventListener(type,e=>{if(isNavigation(e))return;if(e.target.closest?.('#sewerFixedTools')&&e.target.closest?.('#v44Undo,#v44Redo'))return;watchUntil=Date.now()+(e.target.type==='file'?15000:1500);schedule();},true);
 const originalDraw=draw;draw=function(){const result=originalDraw.apply(this,arguments);if(Date.now()<watchUntil)schedule();return result;};
 doUndo=()=>step(false);doRedo=()=>step(true);
 window.SewerHistory={get restoring(){return restoring;},checkpoint,undo:()=>step(false),redo:()=>step(true),sizes:()=>({undo:undo.length,redo:redo.length})};
 checkpoint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

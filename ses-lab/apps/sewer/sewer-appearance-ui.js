/* V113: selection-aware colour popup and stable ribbon range gestures. */
(function(){'use strict';
const api={draggingRange:false,applyColor};window.SewerAppearanceUI=api;
function applyColor(value){
 if(!/^#[0-9a-f]{6}$/i.test(value))return;
 const eng=window.SewerEngineering?.isActive(),plan=window.SewerPlan;
 if(eng){const state=window.SewerEngineering.toolState();if(state.selected||state.canColor)window.SewerEngineering.toolAction('color',value);}
 else if(plan?.toolState().selected||plan?.toolState().canColor)plan.toolAction('color',value);
 else{const list=selectedItems().filter(it=>canEditItem(it));if(!list.length)return;const before=cloneEditState();for(const it of list){if(window.SewerDrainLayers?.supports(it))it.drainBaseColor=value;else{it.color=value;it.tintEnabled=!!it.src;}}tintedCache.clear();syncSelectedPanel();draw();commitHistory(before);}
 window.SewerUnifiedRail?.refresh();
}
function boot(){
 const baseDraw=draw;draw=function(){if(window.SewerHistory?.restoring)return;return baseDraw.apply(this,arguments);};
 const box=document.querySelector('.sewerRouteColor'),summary=box?.querySelector('summary'),panel=box?.querySelector('.sewerColorChoices');if(!panel)return;
 panel.id='sewerFloatingColors';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','ألوان الأنابيب والقطع / Pipe and fitting colours');document.body.append(panel);
 let anchor=summary;
 function close(){panel.hidden=true;summary.setAttribute('aria-expanded','false');}
 function position(){if(panel.hidden)return;const a=anchor.getBoundingClientRect(),b=panel.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(a.left,innerWidth-b.width-8))+'px';panel.style.top=Math.max(8,a.bottom+8+b.height<=innerHeight?a.bottom+8:a.top-b.height-8)+'px';}
 function open(el){anchor=el;panel.hidden=false;summary.setAttribute('aria-expanded','true');position();}
 summary.setAttribute('aria-haspopup','dialog');summary.setAttribute('aria-controls',panel.id);summary.onclick=e=>{e.preventDefault();if(panel.hidden)open(summary);else close();};
 // Both the pipe ribbon and selected-piece colour button use the same detached palette.
 const rail=document.getElementById('lColor');rail?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(panel.hidden)open(rail);else close();},true);
 panel.addEventListener('click',e=>{if(e.target.closest('button[data-color]'))close();});panel.querySelector('input')?.addEventListener('change',close);
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!anchor.contains(e.target))close();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
 let gesture=null;
 // Anchor the whole flowing ribbon through its scroll offset, never the panel alone.
 function pinAppearance(input){
  const panel=input.closest('#sewerInterfacePanel'),scroller=document.getElementById('sewerPrimaryScroll');
  if(!panel||!scroller||!scroller.contains(input))return null;
  return {panel,input,scroller,anchor:input.getBoundingClientRect()};
 }
 function alignAppearance(pin){
  if(!pin)return;
  const {input,scroller,anchor}=pin;
  for(let i=0;i<3;i++){
   let delta=input.getBoundingClientRect().left-anchor.left;
   if(Math.abs(delta)<.2)break;
   scroller.scrollLeft+=delta;
   delta=input.getBoundingClientRect().left-anchor.left;
   if(Math.abs(delta)<.2)break;
   // At a scroll boundary reserve real space at the edge, keeping every gap intact.
   const side=delta>0?'padding-right':'padding-left';
   const padding=parseFloat(getComputedStyle(scroller).getPropertyValue(side));
   const slack=delta<0?Math.max(0,scroller.lastElementChild.getBoundingClientRect().left-scroller.getBoundingClientRect().left-scroller.clientLeft-padding):0;
   scroller.style.setProperty(side,(padding+slack+Math.abs(delta))+'px','important');
  }
 }
 function unpinAppearance(pin){if(pin)alignAppearance(pin);}
 function restoreScroll(locks){for(const lock of locks){lock.el.scrollLeft=lock.x;lock.el.scrollTop=lock.y;}}
 function captureScroll(input){const locks=[];for(let el=input.parentElement;el;el=el.parentElement){if(el.id!=='sewerPrimaryScroll'&&(el.scrollWidth>el.clientWidth||el.scrollHeight>el.clientHeight))locks.push({el,x:el.scrollLeft,y:el.scrollTop});}return locks;}
 document.addEventListener('scroll',()=>{if(gesture){restoreScroll(gesture.locks);alignAppearance(gesture.pin);}},true);
 document.addEventListener('touchmove',e=>{if(gesture){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
 function update(e){if(!gesture||e.pointerId!==gesture.id)return;const {input,rect,rtl,min,max,step}=gesture;let f=Math.max(0,Math.min(1,(e.clientX-rect.left-gesture.thumb/2-gesture.grab)/(rect.width-gesture.thumb)));if(rtl)f=1-f;const value=Math.max(min,Math.min(max,min+Math.round((f*(max-min))/step)*step));const text=String(Number(value.toFixed(6)));if(input.value!==text){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));}restoreScroll(gesture.locks);alignAppearance(gesture.pin);}
 document.addEventListener('pointerdown',e=>{const input=e.target.closest('input[type="range"]');if(!input||input.disabled||e.button>0||!input.closest('#sewerRibbonHeader,#sewerSubRibbon'))return;e.preventDefault();e.stopImmediatePropagation();input.focus({preventScroll:true});gesture={input,locks:captureScroll(input),pin:pinAppearance(input),id:e.pointerId,rect:input.getBoundingClientRect(),rtl:getComputedStyle(input).direction==='rtl',min:Number(input.min||0),max:Number(input.max||100),step:input.step==='any'?.01:Number(input.step||1)};gesture.thumb=gesture.pin?16:0;const fraction=(Number(input.value)-gesture.min)/(gesture.max-gesture.min);const centre=gesture.rect.left+gesture.thumb/2+(gesture.rtl?1-fraction:fraction)*(gesture.rect.width-gesture.thumb);gesture.grab=gesture.pin&&Math.abs(e.clientX-centre)<=10?e.clientX-centre:0;api.draggingRange=true;try{input.setPointerCapture(e.pointerId);}catch(_){}update(e);},true);
 document.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();e.stopImmediatePropagation();update(e);},true);
 function finish(e){if(!gesture||e&&e.pointerId!==gesture.id)return;const {input,id,locks,pin}=gesture;gesture=null;api.draggingRange=false;try{input.releasePointerCapture(id);}catch(_){}unpinAppearance(pin);restoreScroll(locks);requestAnimationFrame(()=>restoreScroll(locks));input.dispatchEvent(new Event('change',{bubbles:true}));window.SewerContextUI?.refresh();}
 document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);window.addEventListener('blur',()=>finish());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

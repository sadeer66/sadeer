/* Match the map's reserved space to the rail's actual, translated width. */
(()=>{
 function boot(){
  const rail=document.getElementById('furnitureIconToolbar'),main=rail?.parentElement;
  if(!rail||!main)return;
  let pending=false;
  function update(){pending=false;const visible=getComputedStyle(rail).display!=='none';const width=visible?Math.ceil(rail.getBoundingClientRect().width)+12:4;const value=width+'px';if(main.style.getPropertyValue('padding-left')!==value)main.style.setProperty('padding-left',value,'important');}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  new ResizeObserver(update).observe(rail);
  document.addEventListener('input',event=>{if(event.target.matches('#uiIconSizeRange,#uiLabelSizeRange'))update();});
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',schedule);window.addEventListener('furniplan-language-changed',schedule);
  document.fonts?.ready.then(schedule);update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

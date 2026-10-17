/* V221: mobile toolbar stays inside viewport without clipping its controls. */
(() => {
 function init(){
  const css=document.createElement('style');css.id='fp213-mobile-layout';css.textContent=`
  #modernToolbarArea,#modernTopToolbar,#modernSliderRow{min-width:0!important;max-width:100%!important;touch-action:pan-x!important}
  #modernTopToolbar,#modernSliderRow{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
  #modernTopToolbar .topToolGroup{flex-shrink:0!important;touch-action:pan-x!important}
  #modernTopToolbar button,#modernTopToolbar label{touch-action:pan-x!important}
  #modernSliderRow{display:flex!important;flex-wrap:nowrap!important;gap:7px!important;padding:3px 4px 6px!important;scrollbar-width:thin!important}
  #modernSliderRow .modernSliderBox{flex:0 0 230px!important;width:230px!important;min-width:230px!important;height:42px!important;gap:7px!important;padding:4px 8px!important}
  #modernSliderRow .modernSliderBox:first-child{flex-basis:270px!important;width:270px!important;min-width:270px!important}
  #modernSliderRow input[type=range]{flex:1 1 110px!important;min-width:100px!important;min-height:32px!important;touch-action:none!important}
  #modernSliderRow .sliderValue{font-size:11px!important;min-width:36px!important}
  #modernSliderRow .sliderCaption{font-size:11px!important}
  #modernSliderRow input[type=range]::-webkit-slider-thumb{min-width:22px;min-height:22px}
  #fp201Materials > header{grid-column:auto!important;min-height:40px!important;height:auto!important;max-height:none!important;flex:0 0 auto!important;padding:0 0 6px!important;gap:8px!important;position:sticky;top:0;background:#102740;z-index:3}
  #fp201Materials > header button{width:40px!important;height:40px!important;min-width:40px!important;font-size:24px!important}
  #fp201Materials canvas{touch-action:pan-y!important}
  @media (max-width:1100px) and (orientation:portrait), (max-width:700px), (max-height:600px) and (pointer:coarse){
   html,body{width:100%!important;max-width:100%!important;overflow:hidden!important}
   .app{min-width:0!important;width:100%!important;max-width:100%!important;height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important;grid-template-rows:auto minmax(0,1fr) auto!important}
   .app>header{box-sizing:border-box!important;height:auto!important;min-height:0!important;max-height:none!important;padding:4px!important;gap:0!important;overflow:hidden!important;min-width:0!important;max-width:100%!important}
   .app>header .headerBrand{display:none!important}
   #modernToolbarArea{flex:1 1 0!important;width:100%!important;height:auto!important;gap:4px!important}
   #modernTopToolbar{width:100%!important;height:auto!important;min-height:calc(var(--tool-btn-h) + 12px)!important;max-height:none!important;flex:0 0 auto!important;padding:4px!important;margin:0!important;align-items:center!important}
   #modernTopToolbar .secondaryTop{display:inline-flex!important}
   #modernTopToolbar .modernIconBtn{width:var(--tool-btn-w)!important;min-width:var(--tool-btn-w)!important;height:var(--tool-btn-h)!important;min-height:var(--tool-btn-h)!important;flex:0 0 var(--tool-btn-w)!important}
   #modernTopToolbar .modernIconBtn svg{width:var(--tool-icon-size)!important;height:var(--tool-icon-size)!important}
   #modernTopToolbar .modernIconBtn .iconLabel{font-size:var(--tool-label-size)!important}
   #modernSliderRow{width:100%!important;height:52px!important;min-height:52px!important;max-height:52px!important;flex:0 0 52px!important;margin:0!important}
   #fp209LabelPicker{width:190px!important;max-width:190px!important;flex:0 0 190px!important}
   #fp209LabelSearch,#fp210OpenLabels{height:30px!important;min-height:30px!important;box-sizing:border-box!important}
   #fp201Materials{width:min(360px,calc(100vw - 16px))!important;max-height:70dvh!important;left:8px!important;bottom:calc(env(safe-area-inset-bottom) + 35px)!important}
  }`;document.head.appendChild(css);
  const header=document.querySelector('.app>header');
  const sync=()=>{if(!header)return;const mobile=matchMedia('(max-width:1100px) and (orientation:portrait), (max-width:700px), (max-height:600px) and (pointer:coarse)').matches;if(mobile)document.documentElement.style.setProperty('--tool-header-h',Math.ceil(header.getBoundingClientRect().height)+'px','important');};
  if(window.ResizeObserver&&header)new ResizeObserver(sync).observe(header);
  window.addEventListener('resize',()=>requestAnimationFrame(sync));window.addEventListener('orientationchange',()=>requestAnimationFrame(sync));requestAnimationFrame(sync);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

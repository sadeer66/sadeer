(()=>{
'use strict';
const css=document.createElement('style');css.textContent=`
body.fp222.fp224 #furnitureIconToolbar{left:0!important;right:auto!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0!important;align-items:flex-start!important;pointer-events:none!important}
body.fp222.fp224 #furnitureIconToolbar>[data-fp224-visible="1"]{pointer-events:auto!important;margin-left:0!important;margin-right:0!important}
body.fp222 #modernToolbarArea #fp228Default{display:inline-flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:38px!important;width:max-content!important;padding:3px 10px!important;white-space:nowrap}
#fp228Default svg{width:17px;height:17px}#fp228Default .iconLabel{font:9px Tahoma}

body.fp222.fp224 #furnitureIconToolbar{width:64px!important;max-width:64px!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn{box-sizing:border-box!important;width:60px!important;min-width:60px!important;max-width:60px!important;padding-inline:3px!important;overflow:hidden!important;flex-shrink:0!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn svg{width:var(--fp223-icon-size,17px)!important;height:var(--fp223-icon-size,17px)!important;min-width:0!important;min-height:0!important;flex-shrink:0!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn .iconLabel{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.2!important;font-size:var(--fp223-text-size,9px)!important;text-align:center!important}

body.fp222 #modernToolbarArea .modernIconBtn{padding-block:0!important}
`;document.head.append(css);
function init(){let b=document.getElementById('fp228Default');if(!b){const host=document.getElementById('fp222-panel-settings');if(!host)return;b=document.createElement('button');b.id='fp228Default';b.dataset.fp222Label='1';b.onclick=()=>{for(const id of ['uiIconSizeRange','uiLabelSizeRange']){const input=document.getElementById(id);if(input){input.value='150';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}}};host.prepend(b);}const host=document.getElementById('fp222-panel-settings');if(host&&host.firstElementChild!==b)host.prepend(b);const english=window.FurniPlanLanguage?.get()==='en';b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg><span class="iconLabel">'+(english?'Default':'الافتراضي')+'</span>';b.title=english?'Restore default button and text sizes':'إعادة حجم الأزرار والكتابة الافتراضي';}
setTimeout(init,1950);setTimeout(init,3000);document.addEventListener('click',e=>{if(e.target.closest('#fp222-tab-settings')){init();const host=document.getElementById('fp222-panel-settings');if(host)host.scrollLeft=0;}});window.addEventListener('furniplan-language-changed',init);
})();

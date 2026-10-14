(()=>{
'use strict';
const compact=()=>matchMedia('(max-width:1180px)').matches;
const css=document.createElement('style');css.textContent=`
body.fp222.fp224 #furnitureIconToolbar{height:auto!important;max-height:none!important;flex-direction:column!important;flex-wrap:nowrap!important;pointer-events:auto!important;touch-action:pan-y!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain;scrollbar-width:thin!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn{height:auto!important;min-height:0!important;max-height:none!important;flex:0 0 auto!important;padding:5px 3px!important;gap:3px!important;justify-content:center!important;touch-action:pan-y!important;background:#172d43!important;color:#f1f5f9!important;border-color:#67849c!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn:not(:disabled){opacity:1!important;filter:none!important;visibility:visible!important}
body.fp222.fp224 #furnitureIconToolbar .modernIconBtn svg{opacity:1!important;visibility:visible!important;color:inherit!important;stroke:currentColor!important;fill:none!important}
@media(max-width:1180px){
body.fp222 .app>aside.open{display:block!important;visibility:visible!important;opacity:1!important;position:fixed!important;left:auto!important;right:0!important;top:var(--fp232-header,180px)!important;bottom:36px!important;height:auto!important;max-height:none!important;width:min(310px,80vw)!important;max-width:80vw!important;transform:none!important;z-index:2500!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;background:#0d192b!important;padding:8px!important}
body.fp222 #sidebarScrim.show{display:block!important;top:var(--fp232-header,180px)!important;bottom:36px!important;z-index:2400!important}
body.fp222 .app>aside.open .libraryBrowser{display:grid!important;grid-template-columns:90px minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;height:100%!important;min-height:0!important;gap:6px!important}
body.fp222 .app>aside.open #library{display:grid!important;grid-template-columns:1fr!important;grid-column:2!important;grid-row:1!important;min-width:0!important;max-width:100%!important;overflow-y:auto!important}
body.fp222 .app>aside.open .categoryList{width:90px!important;min-width:0!important;max-width:90px!important;grid-column:1!important;grid-row:1!important;flex-direction:column!important;height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;position:static!important}
body.fp222 .app>aside.open .categoryList button{width:100%!important;min-width:0!important;max-width:100%!important;height:auto!important;min-height:34px!important;flex:0 0 auto!important;white-space:normal!important;overflow-wrap:anywhere;font-size:10px!important;padding:5px!important}
}
`;document.head.append(css);
function size(){const header=document.querySelector('.app>header');if(header)document.documentElement.style.setProperty('--fp232-header',Math.ceil(header.getBoundingClientRect().bottom)+'px');}
function openLibrary(){if(!compact())return;document.body.classList.remove('fp223-hide-library');const toggle=document.getElementById('fp223-ui-library');if(toggle)toggle.checked=true;size();setSidebarOpen(true);}
function init(){size();const header=document.querySelector('.app>header');if(header)new ResizeObserver(size).observe(header);document.addEventListener('click',e=>{const tab=e.target.closest('#fp222Tabs button');if(!tab||!compact())return;if(tab.id==='fp222-tab-library')requestAnimationFrame(openLibrary);else if(tab.id!=='fp225Guide')setSidebarOpen(false);});window.addEventListener('furniplan-language-changed',()=>{requestAnimationFrame(()=>{window.syncModernToolStates?.();window.FP224Context?.sync();size();});});window.addEventListener('resize',size);}
setTimeout(init,2100);
})();

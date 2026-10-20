/* Keep original live controls and listeners; change their layout only. */
(()=>{
function init(){
 const panels=document.getElementById('fp222Panels'),row=document.getElementById('fp241TopRow'),aside=document.querySelector('.app>aside');
 if(!panels||!row||!aside){setTimeout(init,50);return;}
 document.body.classList.add('fp236');
 const scales=document.getElementById('fp242Scales'),area=document.getElementById('modernToolbarArea');
 const head=document.createElement('div');head.id='fp236Header';row.before(head);head.append(scales,row);
 const libraryChildren=[...aside.children];aside.prepend(panels);
 const title=document.createElement('div');title.id='fp236PanelTitle';aside.prepend(title);
 const brand=document.getElementById('workspaceBrand'),view=document.getElementById('mainScroll');document.body.append(brand);
 function center(){const r=view.getBoundingClientRect();brand.style.setProperty('position','fixed','important');brand.style.setProperty('left',(r.left+view.clientWidth/2)+'px','important');brand.style.setProperty('top',(r.top+view.clientHeight/2)+'px','important');brand.style.setProperty('max-width',Math.max(0,view.clientWidth-20)+'px','important');brand.style.setProperty('display',view.classList.contains('has-plan')?'none':'flex','important');}
 function sync(){const tab=document.querySelector('#fp222Tabs [aria-selected=true]');const library=tab?.id==='fp222-tab-library';aside.classList.toggle('fp236Library',library);for(const child of libraryChildren)child.style.setProperty('display',library?'':'none','important');title.textContent=tab?.textContent||'';document.title='FurniPlan V236';center();}
 new MutationObserver(sync).observe(document.getElementById('fp222Tabs'),{subtree:true,attributes:true,attributeFilter:['aria-selected'],childList:true});
 new ResizeObserver(center).observe(view);new MutationObserver(center).observe(view,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',center);view.addEventListener('scroll',center,{passive:true});
 document.getElementById('fp222Tabs').addEventListener('click',()=>requestAnimationFrame(sync));
 // Vertical gestures in the side dock must not be claimed by old horizontal ribbons.
 for(const event of ['touchstart','touchmove','touchend'])aside.addEventListener(event,e=>{if(!e.target.closest('input[type=range],.touchDragHandle,.fp233Rail'))e.stopPropagation();},{passive:true});
 const style=document.createElement('style');style.textContent=`
 html body.fp236 .app{display:grid!important;direction:rtl!important;grid-template-columns:var(--fp236-side,280px) minmax(0,1fr)!important;grid-template-rows:auto minmax(0,1fr) auto!important;height:100dvh!important;width:100%!important;min-width:0!important}
 html body.fp236 .app>header{grid-row:1!important;grid-column:1/-1!important;position:relative!important;inset:auto!important;width:100%!important}
 html body.fp236 .app>main{grid-row:2!important;grid-column:2!important;position:relative!important;inset:auto!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:6px!important;overflow:hidden!important}
 html body.fp236 .app>aside,html body.fp236 .app>aside.open{grid-row:2!important;grid-column:1!important;position:relative!important;inset:auto!important;display:flex!important;visibility:visible!important;opacity:1!important;transform:none!important;width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;min-height:0!important;overflow:hidden!important;z-index:8!important;padding:5px!important;box-sizing:border-box!important;direction:rtl!important}
 html body.fp236 #sidebarScrim,html body.fp236 #mobileFullLibraryBtn{display:none!important}
 html body.fp236 #modernToolbarArea{display:block!important}
 html body.fp236 #fp236Header{display:flex!important;direction:rtl;gap:6px;align-items:center;min-width:0;width:100%}
 html body.fp236 #fp236Header #fp242Scales{position:relative!important;inset:auto!important;flex:0 0 170px!important;width:170px!important;min-width:170px!important;align-self:center!important}
 html body.fp236 #fp236Header #fp241TopRow{flex:1 1 0!important;min-width:0!important;width:0!important;overflow-x:auto!important;overflow-y:hidden!important;min-height:54px!important;touch-action:pan-x!important}
 html body.fp236 #fp236Header #fp241TopRow .headerBrand{position:static!important;flex:0 0 110px!important;min-width:110px!important;width:110px!important}
 html body.fp236 #fp236Header #fp241TopRow .headerBrand h1{height:40px!important}
 html body.fp236 #fp222Tabs #fp222-tab-library,html body.fp236 #fp222Tabs #fp225Guide{position:static!important;box-shadow:none!important}
 html body.fp236 #fp236PanelTitle{flex:none;padding:8px;color:#e0ae53;font:bold 13px Tahoma;border-bottom:1px solid #334b63}
 html body.fp236 .app>aside #fp222Panels{flex:1 1 0!important;min-height:0!important;width:100%!important;overflow-y:auto!important;overflow-x:hidden!important;border:0!important;border-radius:0!important;touch-action:pan-y!important}
 html body.fp236 .app>aside.fp236Library #fp222Panels{display:none!important}
 html body.fp236 .app>aside:not(.fp236Library)>.fp233LibrarySection,html body.fp236 .app>aside:not(.fp236Library)>.fp233More{display:none!important}
 html body.fp236 #fp222Panels .fp222Panel{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:7px!important;overflow:visible!important;padding:4px!important;min-width:0!important;width:100%!important;touch-action:pan-y!important}
 html body.fp236 #fp222Panels .fp222Panel[hidden]{display:none!important}
 html body.fp236 #fp222Panels .fp222Panel>*{width:100%!important;min-width:0!important;max-width:100%!important;flex:0 0 auto!important;box-sizing:border-box!important}
 html body.fp236 #fp222Panels :is(button,label.modernIconBtn){display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;padding:8px!important;width:100%!important;min-width:0!important;max-width:100%!important;height:auto!important;min-height:42px!important;white-space:normal!important;touch-action:pan-y!important;border-radius:7px!important}
 html body.fp236 #fp222Panels .iconLabel{font-size:var(--fp223-tab-size,12px)!important;white-space:normal!important;text-align:start!important;line-height:1.4!important;max-width:100%!important;width:auto!important;overflow-wrap:anywhere}
 html body.fp236 #fp222Panels :is(#fp201ColorGroup,#fp223Visibility,#fp209LabelPicker){display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;max-width:100%!important;touch-action:pan-y!important}
 html body.fp236 #fp222Panels .modernSliderBox{display:flex!important;flex-wrap:wrap!important;align-items:center!important;height:auto!important;gap:5px!important;padding:8px!important;background:#14273c;border-radius:7px}
 html body.fp236 #fp222Panels input:not([type=checkbox]):not([type=color]),html body.fp236 #fp222Panels select{min-width:0!important;max-width:100%!important;width:100%!important;flex:1 1 auto!important}
 html body.fp236 #fp222Panels input[type=range]{touch-action:none!important}
 html body.fp236 #fp222Panels .fp223Check{white-space:normal!important;min-height:36px;touch-action:pan-y!important}
 html body.fp236 .app>aside .libraryBrowser{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto minmax(0,1fr)!important}
 html body.fp236 .app>aside .categoryList{grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-column:1!important;grid-row:1!important;width:100%!important;max-width:100%!important;max-height:144px!important;height:auto!important}
 html body.fp236 .app>aside #library{grid-column:1!important;grid-row:2!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
 html body.fp236 .app>.appRights{grid-column:1/-1!important;grid-row:3!important}
 html body.fp236 #fp242Scales .sliderCaption{grid-column:1!important;grid-row:1!important}
 html body.fp236 #fp242Scales input[type=range]{grid-column:2!important;grid-row:1!important}
 html body.fp236 #fp242Scales .sliderValue{grid-column:3!important;grid-row:1!important;position:static!important;transform:none!important}
 html body.fp236 #fp222Panels #fpPhoneLibraryBtn{display:none!important}
 @media(max-height:500px){html body.fp236 .app>aside .categoryList{max-height:38px!important}html body.fp236 .app>aside .fp233More{max-height:28px!important}html body.fp236 #fp236PanelTitle{padding:3px!important}html body.fp236 .app>aside .sectionTitleRow{display:none!important}}
 html body.fp236 #workspaceBrand{z-index:3!important;pointer-events:none!important;transform:translate(-50%,-50%)!important}
 html body.fp236 #fp234Workspace{max-height:55dvh!important;width:min(430px,60vw)!important;height:auto!important;object-fit:contain!important}
 @media(max-width:1180px){html body.fp236{--fp236-side:240px}}
 @media(orientation:portrait) and (max-width:1180px){html body.fp236{--fp236-side:clamp(150px,34vw,250px)}html body.fp236 #fp236Header #fp242Scales{flex-basis:138px!important;width:138px!important;min-width:138px!important;height:54px!important;padding:2px 4px!important}html body.fp236 #modernToolbarArea #fp242Scales .fp223SizeBox{grid-template-columns:46px minmax(0,1fr) 27px!important;height:24px!important;gap:2px!important}html body.fp236 #fp242Scales .sliderCaption{font-size:8px!important}html body.fp236 #fp242Scales .sliderValue{font-size:9px!important;width:27px!important}}
 @media(max-width:600px),(max-height:500px) and (pointer:coarse){html body.fp236{--fp236-side:150px}html body.fp236 #fp236Header #fp241TopRow .headerBrand{flex-basis:62px!important;min-width:62px!important;width:62px!important}html body.fp236 #fp234Toolbar{width:60px!important;height:16px!important}html body.fp236 .app>aside #library{grid-template-columns:1fr!important;padding-right:29px!important}html body.fp236 .app>aside .categoryList{grid-template-columns:repeat(4,minmax(0,1fr))!important;max-height:112px!important}html body.fp236 .app>aside .sectionTitleRow{flex-wrap:wrap!important}html body.fp236 .app>aside .sectionTitleRow button{font-size:9px!important;min-width:0!important;white-space:normal!important}html body.fp236 #fp222Panels .iconLabel{font-size:11px!important}}
 html body.fp236 #fp236Header #fp242Scales input[type=range]{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
 @media(max-height:500px){html body.fp236 .app>aside .categoryList{max-height:38px!important}}
 `;document.head.append(style);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,350));else setTimeout(init,350);
})();

/* One footer for live instructions/properties and copyright; synchronized Guide shortcut. */
(()=>{
 let button,rights,info,requestedEmpty=false;
 const en=()=>window.FurniPlanLanguage?.get?.()==='en';
 function sync(){if(!button)return;const toggle=document.getElementById('furnitureSummaryToggle');button.textContent=en()?'Guide':'الدليل';button.title=toggle.checked?(en()?'Hide furniture guide':'إخفاء دليل الأثاث'):(en()?'Show furniture guide':'إظهار دليل الأثاث');button.setAttribute('aria-pressed',String(toggle.checked));
 rights.textContent=en()?'© 2026 FurniPlan — All rights reserved — Sadeer Yaseen Mohammed':'© 2026 FurniPlan — جميع الحقوق محفوظة — سدير ياسين محمد';
 const library=document.getElementById('fp222-tab-library');library.after(button);document.documentElement.style.setProperty('--fp225-library-width',library.getBoundingClientRect().width+'px');
 if(requestedEmpty&&toggle.checked&&!items.length){usedFurniturePanel.style.display='block';usedFurnitureGrid.textContent=en()?'Add furniture to the plan to see its guide.':'أضف أثاثاً إلى الخارطة ليظهر دليله هنا.';}
 }
 function init(){const footer=document.querySelector('.appRights');if(!footer||document.getElementById('fp225Guide'))return;
 document.body.classList.add('fp225');rights=document.createElement('span');rights.id='fp225Rights';rights.dataset.fp222Label='1';info=document.createElement('div');info.id='fp225FooterInfo';footer.replaceChildren(rights,info);
 for(const el of [...document.querySelectorAll('.mapPanel > .bottomInspector')])info.append(el);
 button=document.createElement('button');button.id='fp225Guide';button.type='button';button.dataset.fp222Label='1';button.setAttribute('aria-controls','usedFurniturePanel');button.onclick=()=>{const input=document.getElementById('furnitureSummaryToggle');input.checked=!input.checked;requestedEmpty=input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));syncUsedFurniturePanel(true);sync();};document.getElementById('fp222-tab-library').after(button);
 const original=syncUsedFurniturePanel;syncUsedFurniturePanel=function(){const r=original.apply(this,arguments);sync();return r;};
 document.getElementById('furnitureSummaryToggle').addEventListener('change',sync);
 window.addEventListener('furniplan-language-changed',()=>setTimeout(sync,150));
 new ResizeObserver(()=>{const el=document.getElementById('fp222-tab-library');document.documentElement.style.setProperty('--fp225-library-width',el.getBoundingClientRect().width+'px');}).observe(document.getElementById('fp222-tab-library'));
 const style=document.createElement('style');style.textContent=`
 body.fp225 .appRights{display:flex!important;flex-direction:row!important;direction:ltr!important;justify-content:flex-start!important;align-items:center!important;gap:12px!important;padding:3px 7px!important;min-height:36px!important;height:36px!important;max-height:36px!important;overflow:hidden!important;width:100%!important;box-sizing:border-box!important}
 #fp225Rights{flex:0 0 auto;max-width:38%;font:9px/1.3 Tahoma,Arial;color:#cbd5e1;text-align:left;white-space:normal;direction:rtl}
 #fp225FooterInfo{flex:1 1 0;min-width:0;height:100%;display:flex;align-items:center;justify-content:flex-start;direction:rtl;overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:thin;touch-action:pan-x}
 body.fp225 #fp225FooterInfo .bottomInspector{flex:0 0 auto!important;width:max-content!important;max-width:none!important;min-height:28px!important;height:28px!important;max-height:28px!important;padding:0 3px!important;margin:0!important;gap:7px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;white-space:nowrap!important}
 body.fp225 #fp225FooterInfo .mutedMsg,body.fp225 #fp225FooterInfo .measureHint{font-size:10px!important;line-height:1.3!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important}
 body.fp225 #fp225FooterInfo .selectedTitle,body.fp225 #fp225FooterInfo .inlineField{font-size:10px!important;white-space:nowrap!important}
 body.fp225 #fp225FooterInfo input:not([type=checkbox]),body.fp225 #fp225FooterInfo select,body.fp225 #fp225FooterInfo textarea,body.fp225 #fp225FooterInfo button{height:25px!important;min-height:25px!important;max-height:25px!important;font-size:10px!important;padding-block:2px!important;box-sizing:border-box!important}
 body.fp225 #fp225FooterInfo textarea{resize:none!important;min-width:180px!important}
 body.fp225 #fp222Tabs #fp225Guide{order:-1!important;position:sticky;right:calc(var(--fp225-library-width,90px) + 5px);z-index:4;background:#f7d51c!important;color:#18202a!important;border:1px solid #fff38a!important;box-shadow:0 0 0 3px #020617!important;font-weight:800!important;min-width:75px!important}
 body.fp225 #fp222Tabs #fp225Guide[aria-pressed=true]{background:#ffe037!important;box-shadow:inset 0 -3px #9d7b00,0 0 0 3px #020617!important}
 @media(max-width:700px){body.fp225 .appRights{gap:7px!important;padding-inline:5px!important}#fp225Rights{max-width:150px;font-size:7.5px;line-height:1.2}body.fp225 #fp225FooterInfo .mutedMsg{font-size:9px!important}}
 `;document.head.append(style);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900));else setTimeout(init,900);
})();

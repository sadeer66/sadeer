/* V222 trial: original live controls retained, grouped into compact contextual ribbons. */
(()=>{
 const groups=[
 ['file','ملف','File',['v44New','v44Open','v44Save','v44Upload','v60Dxf','v44Png','v44Pdf','v44Print']],
 ['map','خارطة','Plan',['v44Calibrate','fp198BoundaryBtn','v44Grid']],
 ['measure','قياس','Measure',['v44Measure','fp206MeasureStyleBtn','fpClearMeasureBtn','v54MeasureLine','v54Measures','v54LockMeasures']],
 ['labels','عناوين','Labels',['v44Label','fp209LabelPicker','fp197LabelStyleBtn','v54Labels','v54LockLabels']],
 ['surfaces','تلوين الخارطة','Plan colors',['fp201ColorGroup','v65Area']],
 ['view','إظهار وإخفاء','Visibility',['v54Map','v54Furniture']],
 ['library','المكتبة','Library',['v101Library','fpPhoneLibraryBtn']],
 ['settings','الإعدادات','Settings',['v44Info','v58Assistant']]
 ];
 let selected='file',nav,panels,common;
 const english=()=>window.FurniPlanLanguage?.get?.()==='en';
 function select(key){selected=key;for(const [k] of groups){const tab=document.getElementById('fp222-tab-'+k),panel=document.getElementById('fp222-panel-'+k);tab?.setAttribute('aria-selected',String(k===key));if(panel)panel.hidden=k!==key;}window.dispatchEvent(new Event('resize'));}
 function setup(){
  const area=document.getElementById('modernToolbarArea'),bar=document.getElementById('modernTopToolbar'),sliders=document.getElementById('modernSliderRow');if(!bar||(!nav&&!bar.children.length))return;
  if(!nav){
   document.body.classList.add('fp222');
   nav=document.createElement('div');nav.id='fp222Tabs';nav.setAttribute('role','tablist');
   common=document.createElement('div');common.id='fp222Common';
   panels=document.createElement('div');panels.id='fp222Panels';
   bar.before(nav);nav.after(common);area.append(panels);
   for(const [key,ar,en] of groups){
    const tab=document.createElement('button');tab.id='fp222-tab-'+key;tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-controls','fp222-panel-'+key);tab.onclick=()=>select(key);nav.append(tab);
    const panel=document.createElement('div');panel.id='fp222-panel-'+key;panel.className='fp222Panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panels.append(panel);
   }
   nav.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=groups.findIndex(g=>g[0]===selected);i=e.key==='Home'?0:e.key==='End'?groups.length-1:(i+(e.key==='ArrowRight'?1:-1)+groups.length)%groups.length;select(groups[i][0]);document.getElementById('fp222-tab-'+groups[i][0]).focus();});
  }
  for(const [key,ar,en,ids] of groups){const panel=document.getElementById('fp222-panel-'+key);document.getElementById('fp222-tab-'+key).textContent=english()?en:ar;for(const id of ids){const el=document.getElementById(id);if(el&&el.parentElement!==panel)panel.append(el);}}
  for(const id of ['v44Undo','v44Redo','v44Fit','v44Actual','fpLanguageToggle']){const el=document.getElementById(id);if(el&&el.parentElement!==common)common.append(el);}
  const sliderGroups={zoomRange:'common',measureSizeRange:'measure',mapLabelSizeRange:'labels',uiIconSizeRange:'common',uiLabelSizeRange:'common'};
  for(const box of [...sliders.children]){const id=box.querySelector('input')?.id;const key=sliderGroups[id]||'view';if(id==='zoomRange')box.id='fp222Zoom';(key==='common'?common:document.getElementById('fp222-panel-'+key)).append(box);}
  // Keep later-added controls available instead of silently losing them.
  for(const child of [...bar.children]){if(child.classList.contains('topToolGroup')){for(const el of [...child.children])document.getElementById('fp222-panel-settings').append(el);child.remove();}else document.getElementById('fp222-panel-settings').append(child);}
  for(const [id,ar,en] of [['v44Calibrate','معايرة','Scale'],['fp198BoundaryBtn','حدود','Bounds'],['fp197LabelStyleBtn','تنسيق','Style'],['fp206MeasureStyleBtn','تنسيق','Style'],['v54Labels','المسميات','Labels'],['v54LockLabels','قفل','Lock'],['v54LockMeasures','قفل','Lock'],['v54Measures','القياسات','Measures'],['v54MeasureLine','خط القياس','Lines'],['v54Furniture','الأثاث','Furniture'],['v54Map','الخارطة','Plan'],['v44New','جديد','New'],['v44Fit','ملاءمة','Fit'],['v44Redo','إعادة','Redo'],['v44Undo','تراجع','Undo']]){const label=document.querySelector('#'+id+' .iconLabel');if(label){label.dataset.fp222Label='1';label.textContent=english()?en:ar;}}
  const search=document.getElementById('fp209LabelSearch');if(search)search.placeholder=english()?'Search labels':'ابحث عن مسمى';
  select(selected);document.title='FurniPlan V231 — Approved / معتمدة';window.FP223Refresh?.();
 }
 function init(){
 const style=document.createElement('style');style.id='fp222-ribbon-style';style.textContent=`
 body.fp222 .app>header{padding:6px!important;min-height:0!important;height:auto!important;max-height:none!important;gap:0!important;overflow:hidden!important}
 body.fp222 .headerBrand{display:none!important}
 body.fp222 #modernToolbarArea{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;width:100%!important;max-width:100%!important;gap:6px!important;height:auto!important;padding:0!important}
 body.fp222 #modernTopToolbar,body.fp222 #modernSliderRow{display:none!important}
 #fp222Tabs,#fp222Common{display:flex;align-items:center;gap:5px;overflow-x:auto;min-width:0;white-space:nowrap;scrollbar-width:thin;touch-action:pan-x;padding:2px}
 #fp222Tabs{direction:rtl;min-height:46px}
 #fp222Tabs button{flex:0 0 auto;height:38px!important;min-height:38px!important;padding:0 12px!important;font:700 12px Tahoma,Arial!important;border:1px solid #47627c;border-radius:8px;background:#172d43;color:#eff7ff;white-space:nowrap}
 #fp222Tabs button[aria-selected=true]{background:#00648c;border-color:#3ec6ef;box-shadow:inset 0 -2px #4bd6ff}
 #fp222Tabs button:focus-visible{outline:2px solid #ffdb69;outline-offset:1px}
 #fp222Common{max-width:600px;direction:rtl} body.fp222 #modernToolbarArea #fp222Zoom{width:235px!important;min-width:235px!important;flex-basis:235px!important}
 #fp222Panels{grid-column:1/-1;min-width:0;border:1px solid #334b63;background:#0d1e30;border-radius:10px;overflow:hidden}
 .fp222Panel{display:flex;align-items:center;gap:7px;min-height:54px;padding:5px 9px;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;direction:rtl;touch-action:pan-x}
 .fp222Panel[hidden]{display:none!important}
 .fp222Panel>*{flex-shrink:0!important}
 body.fp222 #modernToolbarArea .modernIconBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:2px!important;width:54px!important;min-width:54px!important;height:38px!important;min-height:38px!important;flex:0 0 54px!important;padding:3px!important;border-radius:8px!important}
 body.fp222 #modernToolbarArea .modernIconBtn svg{width:17px!important;height:17px!important;min-height:17px!important}
 body.fp222 #modernToolbarArea .modernIconBtn .iconLabel{font-size:9px!important;line-height:1.05!important;white-space:nowrap!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important}
 body.fp222 #modernToolbarArea .modernSliderBox{display:flex!important;align-items:center;flex:0 0 180px!important;width:180px!important;min-width:180px!important;height:38px!important;box-sizing:border-box;padding:3px 6px!important;gap:5px!important;background:#14273c;border:1px solid #334b63;border-radius:8px}
 body.fp222 #modernToolbarArea .modernSliderBox input[type=range]{width:85px!important;min-width:50px!important;flex:1!important;height:28px!important;touch-action:none!important}
 body.fp222 #modernToolbarArea .sliderCaption{font-size:10px!important}
 body.fp222 #modernToolbarArea .sliderValue{font-size:10px!important;min-width:28px!important}
 body.fp222 #fp222Common .fpLanguageToggle{position:static!important;min-width:66px!important;height:38px!important;min-height:38px!important;font-size:11px!important;margin:0!important;order:0!important}
 body.fp222 #fp201ColorGroup{display:flex!important;gap:5px!important;padding:0!important;border:0!important;background:none!important}
 body.fp222 #fp209LabelPicker{display:flex!important;flex-direction:row!important;align-items:center;gap:5px;width:auto!important;max-width:none!important}
 body.fp222 #fp209LabelPicker input,body.fp222 #fp209LabelPicker select,body.fp222 #fp209LabelPicker button{height:34px!important;min-height:34px!important;max-width:180px!important;font-size:11px!important}
 body.fp222 .fp222Panel input:not([type=range]):not([type=checkbox]):not([type=color]),body.fp222 .fp222Panel select{height:34px!important;box-sizing:border-box}
 body.fp222 .app{grid-template-rows:auto minmax(0,1fr) auto!important}
 @media(max-width:1100px){body.fp222 #modernToolbarArea{grid-template-columns:minmax(0,1fr)!important}#fp222Common{max-width:none;grid-row:2;min-height:40px}#fp222Panels{grid-row:3}#fp222Tabs{min-height:40px}#fp222Tabs button{padding:0 10px!important}body.fp222 .fp222Panel{min-height:50px}}
 `;document.head.append(style);setup();setTimeout(setup,500);setTimeout(setup,1500);
 window.addEventListener('furniplan-language-changed',()=>setTimeout(setup,50));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100));else setTimeout(init,100);
})();

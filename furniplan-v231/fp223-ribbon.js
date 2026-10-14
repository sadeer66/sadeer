/* V223: synchronized visibility mirrors, permanent controls and text-sized buttons. */
(()=>{
 const en=()=>window.FurniPlanLanguage?.get?.()==='en';
 const toggles=[
 ['bgLayerToggle','الخارطة','Plan'],['furnitureLayerToggle','الأثاث','Furniture'],
 ['gridToggle','شبكة الخارطة','Grid'],['measureLayerToggle','القياسات','Measurements'],
 ['measureArrowsToggle','خطوط القياس','Measure lines'],['mapLabelLayerToggle','العناوين','Labels'],
 ['dimsToggle','أبعاد الأثاث','Furniture dimensions'],['labelsToggle','أسماء الأثاث','Furniture names'],
 ['shadowToggle','ظلال الأثاث','Furniture shadows'],['autoDimsToggle','المسافات التلقائية','Auto distances'],
 ['furnitureSummaryToggle','دليل الأثاث','Furniture guide']
 ];
 const uiToggles=[['library','المكتبة الجانبية','Sidebar library'],['tools','أدوات الأثاث','Furniture tools'],['help','المساعد السفلي','Bottom help'],['sliders','منزلقات القسم','Section sliders']];
 let installed=false,refreshQueued=false;
 function refresh(){
  if(!installed)return;
  document.getElementById('fp222Tabs').prepend(document.getElementById('fp222-tab-library'));
  for(const [id,ar,english] of toggles){const target=document.getElementById(id),copy=document.getElementById('fp223-vis-'+id);if(target&&copy){copy.checked=target.checked;copy.disabled=target.disabled;copy.nextElementSibling.textContent=en()?english:ar;}}
  for(const [key,ar,english] of uiToggles){const input=document.getElementById('fp223-ui-'+key);input.nextElementSibling.textContent=en()?english:ar;}
  const move=document.getElementById('fp223Move');move.querySelector('.iconLabel').textContent=en()?'Move':'تحريك';move.title=en()?'Move plan and furniture':'تحريك الخارطة والأثاث';move.classList.toggle('active',document.getElementById('lMove')?.classList.contains('active')||false);
  const icon=document.querySelector('#uiIconSizeRange')?.closest('.modernSliderBox'),label=document.querySelector('#uiLabelSizeRange')?.closest('.modernSliderBox');
  for(const [box,ar,english] of [[icon,'حجم الأيقونة','Icon size'],[label,'حجم الكتابة','Text size']]){if(!box)continue;box.classList.add('fp223SizeBox');box.querySelector('.sliderCaption').textContent=en()?english:ar;box.querySelector('.sliderCaption').dataset.fp222Label='1';}
  const selectedFit=document.getElementById('fp240Selected');if(selectedFit){selectedFit.disabled=!pxPerCm||!getSelectedIds().length;selectedFit.querySelector('.iconLabel').textContent=en()?'Selected':'المختار';selectedFit.title=en()?'Fit selected furniture in view':'ملاءمة العرض للأثاث المختار';}
  const common=document.getElementById('fp222Common');
  for(const element of [move,document.getElementById('v44Undo'),document.getElementById('v44Redo'),document.getElementById('fp222Zoom'),document.getElementById('v44Fit'),document.getElementById('v44Actual'),selectedFit,icon,label,document.getElementById('fpLanguageToggle')])if(element)common.append(element);
 }
 function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;refresh();});}
 function init(){
  if(installed||!document.getElementById('fp222Common'))return;
  installed=true;
  const root=document.documentElement;
  const topRow=document.createElement('div');topRow.id='fp241TopRow';const nav=document.getElementById('fp222Tabs'),commonRow=document.getElementById('fp222Common');nav.before(topRow);topRow.append(nav,commonRow);
  const side=document.getElementById('lMove');if(side)root.style.setProperty('--fp223-side-h',side.getBoundingClientRect().height+'px');
  const panel=document.getElementById('fp222-panel-view');
  const row=document.createElement('div');row.id='fp223Visibility';row.dataset.fp222Label='1';
  for(const [id,ar,english] of toggles){const target=document.getElementById(id);if(!target)continue;const label=document.createElement('label');label.className='fp223Check';const input=document.createElement('input');input.type='checkbox';input.id='fp223-vis-'+id;const text=document.createElement('span');input.onchange=()=>{target.checked=input.checked;target.dispatchEvent(new Event('change',{bubbles:true}));refresh();};target.addEventListener('change',refresh);label.append(input,text);row.append(label);}
  for(const [key] of uiToggles){const label=document.createElement('label');label.className='fp223Check';const input=document.createElement('input');input.type='checkbox';input.id='fp223-ui-'+key;input.checked=true;input.onchange=()=>{document.body.classList.toggle('fp223-hide-'+key,!input.checked);window.dispatchEvent(new Event('resize'));};label.append(input,document.createElement('span'));row.append(label);}
  panel.prepend(row);
  const move=document.createElement('button');move.type='button';move.id='fp223Move';move.className='modernIconBtn';move.dataset.fp222Label='1';move.innerHTML=side?.innerHTML||'<span>↔</span><span class="iconLabel"></span>';move.onclick=()=>{document.getElementById('lMove')?.click();refresh();};document.getElementById('fp222Common').prepend(move);
  const selectedFit=document.createElement('button');selectedFit.id='fp240Selected';selectedFit.type='button';selectedFit.className='modernIconBtn';selectedFit.dataset.fp222Label='1';selectedFit.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg><span class="iconLabel"></span>';selectedFit.onclick=()=>{const ids=new Set(getSelectedIds()),chosen=items.filter(it=>ids.has(it.id));if(!chosen.length||!pxPerCm)return;const corners=chosen.flatMap(itemCorners),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY);setZoomPercent(100*Math.min(Math.max(1,mainScroll.clientWidth-110)/w,Math.max(1,mainScroll.clientHeight-100)/h));requestAnimationFrame(()=>{const r=canvas.getBoundingClientRect(),v=mainScroll.getBoundingClientRect();mainScroll.scrollLeft+=r.left+(minX+maxX)/2*r.width/canvas.width-(v.left+mainScroll.clientWidth/2+30);mainScroll.scrollTop+=r.top+(minY+maxY)/2*r.height/canvas.height-(v.top+mainScroll.clientHeight/2);});};document.getElementById('fp222Common').append(selectedFit);
  document.addEventListener('pointerup',schedule);document.addEventListener('keyup',schedule);
  // Existing checkboxes remain authoritative: project loads and old controls update the mirrors.
  document.addEventListener('change',schedule);
  document.addEventListener('click',schedule);
  if(side)new MutationObserver(schedule).observe(side,{attributes:true,attributeFilter:['class']});
  document.getElementById('fp222-tab-view').addEventListener('click',refresh);
  document.getElementById('loadInput')?.addEventListener('change',()=>setTimeout(refresh,500));
  window.FP223Refresh=refresh;
  const style=document.createElement('style');style.id='fp223-style';style.textContent=`
  body.fp222 #modernToolbarArea{direction:rtl!important;grid-template-columns:max-content minmax(0,1fr)!important}
  body.fp222 #fp222Common{width:100%!important;max-width:none!important;box-sizing:border-box!important}
  body.fp222 #fp222Tabs{position:relative}
  body.fp222 #fp222Tabs #fp222-tab-library{order:-1!important;position:sticky;right:0;z-index:4;background:#d82027!important;border:1px solid #ff7b7b!important;color:white!important;font-weight:800!important;min-width:90px!important;box-shadow:0 0 0 3px #020617!important}
  body.fp222 #fp222Tabs #fp222-tab-library[aria-selected=true]{background:#f12b31!important;box-shadow:inset 0 -3px #fff,0 0 0 3px #020617!important}
  body.fp222 button,body.fp222 label.modernIconBtn{width:max-content!important;min-width:max-content!important;flex-shrink:0!important;white-space:nowrap!important}
  body.fp222 #modernToolbarArea .modernIconBtn{width:max-content!important;min-width:54px!important;max-width:none!important;flex:0 0 auto!important;padding-inline:9px!important;height:38px!important;min-height:38px!important}
  body.fp222 #modernToolbarArea .modernIconBtn .iconLabel{width:max-content!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important;font-size:var(--fp223-text-size,9px)!important;white-space:nowrap!important}
  body.fp222 #modernToolbarArea .modernIconBtn svg{width:var(--fp223-icon-size,17px)!important;height:var(--fp223-icon-size,17px)!important;min-height:0!important;flex-shrink:1!important}
  body.fp222 #modernToolbarArea :is(.modernIconBtn,#fp226TextBtn,#fp228Default){padding-block:0!important;gap:1px!important}
  body.fp222 #modernToolbarArea :is(.modernIconBtn,#fp226TextBtn,#fp228Default) svg{width:min(var(--fp223-icon-size,17px),calc(34px - var(--fp223-text-size,9px)*1.05))!important;height:min(var(--fp223-icon-size,17px),calc(34px - var(--fp223-text-size,9px)*1.05))!important;flex-shrink:0!important}
  body.fp222 #fp222Tabs button{font-size:var(--fp223-tab-size,12px)!important}
  body.fp222 #furnitureIconToolbar{width:max-content!important;max-width:45vw!important}
  body.fp222 #furnitureIconToolbar .modernIconBtn{width:auto!important;min-width:max-content!important;flex:0 0 auto!important;padding-inline:9px!important;height:var(--fp223-side-h)!important;min-height:var(--fp223-side-h)!important}
  body.fp222 #furnitureIconToolbar .iconLabel{width:max-content!important;max-width:none!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important}
  body.fp222 .bottomBtn,body.fp222 .fullLibMiniBtn{max-width:none!important;flex-basis:auto!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important}
  body.fp222 #modernToolbarArea .fp223SizeBox{position:relative;padding-top:13px!important;width:145px!important;min-width:145px!important;flex-basis:145px!important}
  body.fp222 .fp223SizeBox .sliderCaption{position:absolute;top:0;right:6px;font-size:9px!important;line-height:12px}
  body.fp222 .fp223SizeBox .sliderGlyph{display:none!important}
  body.fp222 #modernToolbarArea #fp222Zoom{width:max-content!important;min-width:max-content!important;flex:0 0 auto!important}
  body.fp222 #modernToolbarArea #fp222Zoom #zoomRange{width:141px!important;min-width:141px!important;max-width:141px!important;flex:0 0 141px!important}
  body.fp222 .libraryBrowser{grid-template-columns:max-content minmax(0,1fr)!important}
  body.fp222 .categoryList{min-width:0!important}
  body.fp222 .categoryList button{max-width:none!important}
  body.fp222 #fp209LabelPicker{flex:0 0 auto!important;width:max-content!important}
  body.fp222 #fp209LabelPicker input{width:180px!important;min-width:180px!important;flex:0 0 180px!important}
  body.fp222 #fp209LabelPicker button{max-width:none!important;flex:0 0 auto!important}
  @media(max-width:1100px){body.fp222{--fp223-side-h:78px!important}}
  @media(max-width:700px){body.fp222{--fp223-side-h:69px!important}}
  #fp223Visibility{display:flex;align-items:center;gap:13px;flex:0 0 auto;direction:rtl}
  .fp223Check{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#e9f1fa;white-space:nowrap;cursor:pointer}
  .fp223Check input{width:17px!important;height:17px!important;min-width:17px;accent-color:#1687e9;margin:0;cursor:pointer}
  body.fp223-hide-tools #furnitureIconToolbar{display:none!important}
  body.fp223-hide-help #selectedEmpty{display:none!important}
  body.fp223-hide-sliders .fp222Panel .modernSliderBox{display:none!important}
  body.fp223-hide-library .app>aside,body.fp223-hide-library #sidebarScrim{display:none!important}
  body.fp223-hide-library .app{grid-template-columns:0 minmax(0,1fr)!important}
  @media(max-width:1450px){body.fp222 #modernToolbarArea{grid-template-columns:minmax(0,1fr)!important}body.fp222 #fp222Common{max-width:100%!important;grid-row:2}body.fp222 #fp222Panels{grid-row:3}}
  body.fp222 #modernToolbarArea{grid-template-columns:minmax(0,1fr)!important}
  body.fp222 #fp241TopRow{grid-column:1/-1;grid-row:1;display:flex;align-items:center;gap:6px;width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;direction:rtl;scrollbar-width:thin;touch-action:pan-x;box-sizing:border-box}
  body.fp222 #fp241TopRow #fp222Tabs,body.fp222 #fp241TopRow #fp222Common{width:max-content!important;max-width:none!important;min-width:max-content!important;flex:0 0 auto!important;overflow:visible!important;grid-row:auto!important}
  body.fp222 #fp222Panels{grid-row:2!important}
  `;document.head.append(style);
  let iconFrame=false;
  function syncControlIcons(){if(iconFrame)return;iconFrame=true;requestAnimationFrame(()=>{iconFrame=false;const wanted=parseFloat(getComputedStyle(root).getPropertyValue('--fp223-icon-size'))||17;for(const icon of document.querySelectorAll('button svg,label.modernIconBtn svg,.sliderGlyph svg')){const host=icon.closest('button,label.modernIconBtn,.sliderGlyph');const label=host.querySelector('.iconLabel');const h=host.getBoundingClientRect().height;const cs=getComputedStyle(host);const vertical=cs.flexDirection==='column';const reserved=(vertical&&label?label.getBoundingClientRect().height+(parseFloat(cs.rowGap)||0):0)+(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0)+(parseFloat(cs.borderTopWidth)||0)+(parseFloat(cs.borderBottomWidth)||0);const size=Math.max(10,Math.min(wanted,h>0&&!host.closest('#furnitureIconToolbar')&&!host.classList.contains('sliderGlyph')?h-reserved:wanted));for(const key of ['width','height','min-width','min-height','max-width','max-height'])icon.style.setProperty(key,size+'px','important');icon.style.setProperty('flex-shrink','0','important');icon.style.setProperty('margin','0','important');}for(const el of document.querySelectorAll('button')){if(el.children.length||!/^\s*[✓✔✕×✖↔↕⟳⟲＋+−–]\s*$/.test(el.textContent))continue;el.style.setProperty('font-size',Math.min(wanted,Math.max(12,el.clientHeight-8))+'px','important');}});}
  new MutationObserver(syncControlIcons).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',syncControlIcons);
  const syncScale=()=>{const is=(+document.getElementById('uiIconSizeRange').value||150)/150,ts=(+document.getElementById('uiLabelSizeRange').value||150)/150;root.style.setProperty('--fp223-text-size',Math.max(7,9*ts)+'px');root.style.setProperty('--fp223-tab-size',Math.max(10,12*ts)+'px');root.style.setProperty('--fp223-icon-size',Math.max(12,17+(is-1)*6)+'px');syncControlIcons();};
  document.getElementById('uiIconSizeRange').addEventListener('input',syncScale);document.getElementById('uiLabelSizeRange').addEventListener('input',syncScale);syncScale();refresh();
  window.addEventListener('furniplan-language-changed',()=>setTimeout(refresh,100));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250));else setTimeout(init,250);
})();

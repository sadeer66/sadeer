(function(){
'use strict';
const rename=s=>String(s||'').replace(/الأكواع/g,'العكوس').replace(/أكواع/g,'عكوس').replace(/الكوع/g,'العكس').replace(/كوع/g,'عكس');
const isEnglish=()=>window.FurniPlanLanguage?.get?.()==='en';
const tr=(ar,en)=>isEnglish()?en:ar;
const fmt=n=>Number.isFinite(Number(n))?Number(n).toLocaleString(isEnglish()?'en-US':'ar-IQ',{maximumFractionDigits:1}):'—';
const diameterLabel=d=>isEnglish()?fmt(d)+' in':window.SewerFittingSizes.label(d);
function isPipeItem(it){return !!it&&(!!window.SewerFittingSizes?.partFor(it)||!!it.sewerAttachment||!!it.engineeringKind||/assets\/(pipes|drains)\//.test(it.src||''));}
window.SewerContextUI={isPipeItem};
function info(ref){const api=window.SewerPlan;if(!ref)return null;
 if(ref.type==='furniture'){const it=typeof items!=='undefined'?items.find(v=>v.id===ref.id):null;if(!isPipeItem(it))return null;const d=window.SewerFittingSizes.nominal(it);return {title:rename(isEnglish()?(it.nameEn||window.FurniPlanLanguage.translate(it.name)):it.name),details:[it.engineeringText||'',d?tr('القطر ','Diameter ')+diameterLabel(d):'', tr('الأبعاد ','Dimensions ')+fmt(it.w)+' × '+fmt(it.h)+tr(' سم',' cm'),tr('الدوران ','Rotation ')+fmt(it.rot||0)+'°',it.sewerAttachment?tr('متصل بالأنبوب','Connected to pipe'):tr('قطعة مستقلة','Independent part')].filter(Boolean)};}
 if(ref.type==='symbol')return {title:rename(ref.name),details:[tr('الدوران ','Rotation ')+fmt(ref.angle)+'°']};
 if(ref.type==='junction'){const j=api.getJunctions()[ref.index];if(!j)return null;return {title:({tee:tr('وصلة T','Tee'),wye:tr('وصلة Y','Wye'),cross:tr('صليب','Cross')})[j.kind]||tr('وصلة','Fitting'),details:[tr('القطر ','Diameter ')+diameterLabel(j.diameter),tr('الدوران ','Rotation ')+fmt(j.rotation||0)+'°']};}
 const r=ref.draft?api.getDraft()?.route:api.getRoutes()[ref.route];if(!r)return null;let length=0;for(let i=1;i<r.points.length;i++)length+=Math.hypot(r.points[i].x-r.points[i-1].x,r.points[i].y-r.points[i-1].y);
 const scale=typeof pxPerCm==='number'?pxPerCm:0,details=[r.material,tr('القطر ','Diameter ')+diameterLabel(r.diameter)];
 let title=tr('أنبوب','Pipe');if(ref.type==='elbow'){const i=ref.point,a=r.points[i-1],b=r.points[i],c=r.points[i+1];const angle=a&&b&&c?window.SewerGeometry.turn(a,b,c):0;title=tr('عكس ','Elbow ')+fmt(angle)+'°';details.push(Math.abs(angle-45)<.001||Math.abs(angle-90)<.001?tr('زاوية صحيحة','Valid angle'):tr('زاوية غير صالحة — صحّحها إلى 45° أو 90°','Invalid angle — adjust to 45° or 90°'));}else if(ref.type==='coupling')title=tr('وصلة مستقيمة','Coupling');else if(scale>0)details.push(tr('طول المسار ','Route length ')+fmt(length/scale/100)+tr(' م',' m'));return {title,details};
}
window.SewerContextUI.info=info;
function boot(){
 const $=id=>document.getElementById(id),top=$('modernTopToolbar'),area=$('modernToolbarArea'),rail=$('furnitureIconToolbar'),sliders=$('modernSliderRow');if(!top||!area||!rail)return;
 document.body.classList.add('sewer-ribbon-ui');
 const header=document.createElement('div');header.id='sewerRibbonHeader';area.prepend(header);
 const modes=document.createElement('div');modes.id='sewerModeDock';header.append(modes);for(const id of ['se61Real','se61Eng'])if($(id))modes.append($(id));
 const tabs=document.createElement('nav');tabs.id='sewerRibbonTabs';tabs.setAttribute('aria-label','أقسام البرنامج');header.append(tabs);
 const fixed=document.createElement('div');fixed.id='sewerFixedTools';header.append(fixed);
 const mainRow=document.createElement('div');mainRow.id='sewerPrimaryScroll';header.append(mainRow);mainRow.append(tabs,fixed);
 const subRow=document.createElement('div');subRow.id='sewerSubRibbon';area.append(subRow);subRow.append(top,sliders);
 const move=$('lMove');if(move){move.title='تحريك وتحديد أنبوب أو عكس أو قطعة';fixed.append(move);}
 for(const id of ['v44Undo','v44Redo','unifiedOk','unifiedCancel'])if($(id))fixed.append($(id));
 // Relocate the existing controls so their listeners and file inputs remain intact.
 const panes={},tabButtons={};let active='file',busy=false,lastSelection='';
 const names={file:'ملف',map:'خارطة',measure:'قياس',text:'عناوين',color:'تلوين الخارطة',visibility:'إظهار وإخفاء',pipes:'الأنابيب',library:'المكتبة',settings:'الإعدادات'};
 const english={file:'File',map:'Plan',measure:'Measure',text:'Titles',color:'Plan colours',visibility:'Show / hide',pipes:'Pipes',library:'Library',settings:'Settings'};
 const definitions={
 file:['v44New','v44Open','v44Save','v44Upload','v60Dxf','v44Png','v44Pdf','v44Print'],
 map:['v44Calibrate','resetScaleBtn','v54Map','v44Grid'],
 measure:['v44Measure','v65Area','v54MeasureLine','v54Measures','v54LockMeasures','clearMeasuresBtn'],
 pipes:['sewerStartRoute','sewerContinue','sewerFinishRoute','sewerAddT','sewerAddY','sewerRotateFit','sewerClearRoutes','sewerHideInnerLine','sewerShadowToggle'],
 library:['v101Library','addLibraryItemBtn','resetLibraryBtn','lSummary','v54Furniture'],
 text:['v44Label','v54Labels','v54LockLabels','sewerLabelSettingsPanel'],
 visibility:[],settings:['v44Info','v58Assistant']};
 function take(node,pane){if(node)pane.append(node);}
 function check(id,title,pane){const input=$(id);if(!input)return;const label=document.createElement('label');label.className='sewerRibbonCheck';label.append(input,document.createTextNode(title));pane.append(label);}
 function button(id,label,fn,pane){const b=document.createElement('button');b.type='button';b.id=id;b.className='sewerRibbonButton';b.textContent=label;b.onclick=fn;pane.append(b);return b;}
 for(const [key,name] of Object.entries(names)){const tab=button('sewerTab_'+key,name,()=>activate(key),tabs);tab.setAttribute('aria-controls','sewerPane_'+key);tabButtons[key]=tab;const pane=document.createElement('div');pane.id='sewerPane_'+key;pane.className='sewerRibbonPane';panes[key]=pane;top.append(pane);for(const id of definitions[key]||[])take($(id),pane);}
 take(top.querySelector('.colorLayerTools'),panes.color);
 take(document.querySelector('.sewerFields'),panes.pipes);
 take(document.querySelector('.sewerRouteColor'),panes.pipes);
 take(top.querySelector('.sewerOutlineControls'),panes.pipes);
 take(document.querySelector('.sewerCreationOutline'),panes.pipes);
 check('sewerAutoElbows','إضافة العكوس تلقائياً',panes.pipes);
 check('sewerVisible','إظهار الشبكة',panes.pipes);
 check('mapLockToggle','قفل الخارطة',panes.map);
 check('furnitureLockToggle','قفل الأثاث',panes.settings);
 for(const [id,title] of [['se61Lengths','أطوال المسارات'],['se61Diameters','أقطار الأنابيب'],['se61Black','خطوط هندسية داكنة']])check(id,title,panes.settings);
 // Keep all remaining tools reachable in Settings; retired duplicates stay hidden.
 const retired=new Set(['unifiedEdit','sewerEnterEdit','sewerHideFittingLabels','sewerPipeLabels','sewerUndoDelete','sewerUndoPoint','sewerUndoFit','colorSelectionUndo','colorSelectionRedo']);
 for(const b of [...top.querySelectorAll('.modernIconBtn')])if(!b.closest('.sewerRibbonPane')&&!retired.has(b.id))take(b,panes.settings);
 for(const id of retired)if($(id))$(id).style.setProperty('display','none','important');
 for(const child of [...top.children])if(!child.classList.contains('sewerRibbonPane'))child.style.setProperty('display','none','important');
 $('sewerPlannerPanel')?.style.setProperty('display','none','important');
 const zoom=[...sliders.children].find(b=>b.querySelector('#zoomRange'));if(zoom){zoom.id='sewerZoomDock';fixed.append(zoom);}
 for(const id of ['v44Fit','v44Actual'])take($(id),fixed);
 const selectedView=button('sewerFitSelected','المختار',()=>window.SewerSelectedView?.fit(),fixed);selectedView.disabled=true;selectedView.classList.add('modernIconBtn');selectedView.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg><span class="iconLabel">المختار</span>';
 const language=button('sewerLanguage','English',()=>{const api=window.FurniPlanLanguage;if(api)api.set(api.get()==='ar'?'en':'ar');},header);
 // Full-library activation is independent of the category menu and ribbon drag state.
 const fullLibraryButton=$('v101Library');
 if(fullLibraryButton){fullLibraryButton.classList.remove('fpV195PrimaryLibrary');fullLibraryButton.onclick=e=>{e.preventDefault();const menu=$('sewerCategoryMenu');if(menu)menu.hidden=true;$('sewerTab_library')?.setAttribute('aria-expanded','false');window.openFullLibrary?.();};}
 tabButtons.library.onclick=()=>{activate('library');window.openFullLibrary?.();};
 const guideGrid=$('usedFurnitureGrid'),guidePanel=$('usedFurniturePanel');
 const guideScroll=document.createElement('input');guideScroll.id='sewerGuideScroll';guideScroll.type='range';guideScroll.min='0';guideScroll.max='1000';guideScroll.value='0';guideScroll.setAttribute('aria-label',tr('تمرير الدليل','Scroll guide'));guidePanel.append(guideScroll);
 guideScroll.oninput=()=>{guideGrid.scrollTop=(guideGrid.scrollHeight-guideGrid.clientHeight)*Number(guideScroll.value)/1000;};
 function syncGuideScroll(){const max=guideGrid.scrollHeight-guideGrid.clientHeight;guideScroll.hidden=max<=1;if(max>1)guideScroll.value=String(Math.round(guideGrid.scrollTop/max*1000));}
 guideGrid.addEventListener('scroll',syncGuideScroll,{passive:true});new ResizeObserver(syncGuideScroll).observe(guideGrid);new MutationObserver(()=>requestAnimationFrame(syncGuideScroll)).observe(guideGrid,{childList:true,subtree:true});
 const uiPanel=document.createElement('div');uiPanel.id='sewerInterfacePanel';uiPanel.hidden=false;fixed.append(uiPanel);
 for(const [id,label] of [['uiIconSizeRange','الأيقونات'],['uiLabelSizeRange','الكتابة']]){const input=$(id);if(input){const box=input.closest('.modernSliderBox');if(box){const name=document.createElement('span');name.textContent=label;box.prepend(name);uiPanel.append(box);}}}
 button('sewerResetInterface','تهيئة',()=>{for(const id of ['uiIconSizeRange','uiLabelSizeRange']){const el=$(id);if(el){el.value=150;el.dispatchEvent(new Event('input',{bubbles:true}));}}},panes.settings);
 const resetAppearance=$('sewerResetInterface');resetAppearance.classList.add('modernIconBtn');resetAppearance.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg><span class="iconLabel">تهيئة</span>';
 const visibilityLinks=[];
 function mirror(id,ar,en){const original=$(id);if(!original)return;const label=document.createElement('label');label.className='sewerRibbonCheck';const input=document.createElement('input');input.type='checkbox';input.id='sewerVisibility_'+id;const text=document.createElement('span');text.textContent=ar;label.append(input,text);panes.visibility.append(label);input.onchange=()=>{original.checked=input.checked;original.dispatchEvent(new Event('change',{bubbles:true}));sync();};visibilityLinks.push({input,text,ar,en,read:()=>!!original.checked});}
 for(const args of [['bgLayerToggle','الخارطة','Plan'],['furnitureLayerToggle','الأثاث','Furniture'],['sewerVisible','شبكة الأنابيب','Pipe network'],['measureLayerToggle','القياسات','Measurements'],['measureArrowsToggle','خطوط القياس','Dimension lines'],['mapLabelLayerToggle','العناوين','Titles'],['gridToggle','الشبكة المربعة','Grid'],['dimsToggle','أبعاد الأثاث','Furniture dimensions'],['labelsToggle','أسماء الأثاث','Furniture names'],['shadowToggle','ظلال الأثاث','Furniture shadows'],['autoDimsToggle','المسافات التلقائية','Automatic distances'],['furnitureSummaryToggle','دليل القطع والكميات','Parts and quantities']])mirror(...args);
 for(const [key,id,ar,en] of [['innerLine','sewerHideInnerLine','الخط الداخلي للأنابيب','Pipe centreline'],['shadow','sewerShadowToggle','ظل الأنابيب','Pipe shadows'],['outline','sewerOutlineToggle','الحد الخارجي للأنابيب','Pipe outline']]){const label=document.createElement('label');label.className='sewerRibbonCheck';const input=document.createElement('input');input.type='checkbox';input.id='sewerVisibility_'+key;const text=document.createElement('span');text.textContent=ar;label.append(input,text);panes.visibility.append(label);input.onchange=()=>{const current=window.SewerPlan.getDisplay()[key];if(current!==input.checked)$(id)?.click();sync();};visibilityLinks.push({input,text,ar,en,read:()=>!!window.SewerPlan.getDisplay()[key]});}
 const uiVisibility={library:true,helper:true,sliders:true};
 for(const [key,ar,en] of [['library','المكتبة الجانبية','Library sidebar'],['helper','المساعد السفلي','Bottom assistant'],['sliders','منزلقات القسم','Section sliders']]){const label=document.createElement('label');label.className='sewerRibbonCheck';const input=document.createElement('input');input.type='checkbox';input.checked=true;const text=document.createElement('span');label.append(input,text);panes.visibility.append(label);input.onchange=()=>{uiVisibility[key]=input.checked;document.body.classList.toggle('sewer-hide-'+key,!input.checked);sync();};visibilityLinks.push({input,text,ar,en,read:()=>uiVisibility[key]});}
 function activate(key){if(key==='pipes')key='library';if(document.documentElement.classList.contains('sewer-phone-ui')&&key!=='library'){document.body.classList.remove('sewer-phone-drawer-open');document.getElementById('sewerCategoryMenu')?.setAttribute('hidden','');}active=key;for(const [name,pane] of Object.entries(panes)){pane.style.setProperty('display',name===key?'flex':'none','important');tabButtons[name].classList.toggle('active',name===key);tabButtons[name].setAttribute('aria-pressed',String(name===key));}sync();window.ElectricalRightPanel?.section(key);}
 const helper=document.createElement('div');helper.id='sewerContextHelper';helper.className='bottomInspector';helper.dir=isEnglish()?'ltr':'rtl';helper.innerHTML='<strong></strong><span></span>';$('selectedPanel')?.parentElement.append(helper);
 const phone=/iPhone|iPod|iPad|Android/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(navigator.userAgent));
 const primary=$('sewerPrimaryScroll');if(primary)primary.append(language);
 // V128: stable sizing dock, two-tone brand, then the scrolling ribbon.
 const brand=document.createElement('div');brand.id='sewerHeaderBrand';brand.dir='ltr';brand.setAttribute('aria-label','SewerPlan');brand.innerHTML='<span>Sewer</span><b>Plan</b>';
 header.prepend(uiPanel,brand);primary.prepend(modes);
 const handset=/iPhone|iPod/i.test(navigator.userAgent)||(/Android/i.test(navigator.userAgent)&&Math.min(screen.width,screen.height)<600);
 if(handset&&primary){document.documentElement.classList.add('sewer-handset-ui');primary.prepend(modes);}
 if(phone){document.documentElement.classList.add('sewer-phone-ui');const rights=document.querySelector('.appRights');if(rights){const copy=document.createElement('span');copy.className='sewerRightsCopy';while(rights.firstChild)copy.append(rights.firstChild);rights.append(copy,helper);}}

 if(phone){
  const aside=document.querySelector('.app>aside');
  const close=document.createElement('button');close.id='sewerPhoneClose';close.type='button';close.textContent='×';close.setAttribute('aria-label','إغلاق المكتبة');aside.prepend(close);close.onclick=()=>document.body.classList.remove('sewer-phone-drawer-open');
  const picker=document.createElement('select');picker.id='sewerPhoneCategory';picker.hidden=true;panes.library.prepend(picker);
  const menu=document.createElement('div');menu.id='sewerCategoryMenu';menu.hidden=true;menu.setAttribute('role','menu');document.body.append(menu);
  const libraryTab=button('sewerLibraryCategories',tr('المكتبة الصغيرة','Compact library'),()=>{},panes.library);libraryTab.setAttribute('aria-haspopup','menu');libraryTab.setAttribute('aria-expanded','false');
  function closeMenu(){menu.hidden=true;libraryTab.setAttribute('aria-expanded','false');}
  function positionMenu(){const r=libraryTab.getBoundingClientRect();menu.style.top=Math.ceil(r.bottom+4)+'px';menu.style.left=Math.max(5,Math.min(r.left,innerWidth-205))+'px';}
  function showCategories(){updateCategories();const show=menu.hidden;closeMenu();if(show){menu.hidden=false;positionMenu();libraryTab.setAttribute('aria-expanded','true');}}
  libraryTab.onclick=()=>{activate('library');showCategories();};
  window.addEventListener('resize',()=>{if(!menu.hidden)positionMenu();});
  $('sewerPrimaryScroll')?.addEventListener('scroll',closeMenu,{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();document.body.classList.remove('sewer-phone-drawer-open');}});
  function updateCategories(){
   const en=isEnglish();
   const eng=!!window.SewerEngineering?.isActive();const source=eng?[...$('se61Categories').options]:[...$('categoryList').querySelectorAll('button')];
   const entries=source.map((el,i)=>({value:eng?el.value:String(i),text:el.textContent,category:el.dataset.category})).filter(entry=>!['مطبخ','__colorGuide'].includes(entry.category));
   selectedView.disabled=!window.SewerSelectedView?.bounds();setText(selectedView.querySelector('.iconLabel'),en?'Selected':'المختار');setText($('sewerResetInterface').querySelector('.iconLabel'),en?'Reset':'تهيئة');
 const signature=JSON.stringify(entries)+eng;if(picker.dataset.signature===signature)return;picker.dataset.signature=signature;picker.replaceChildren();
   menu.replaceChildren();const full=document.createElement('button');full.type='button';full.id='sewerMobileFullLibrary';full.textContent=en?'Full library':'المكتبة الكاملة';full.setAttribute('role','menuitem');full.onclick=()=>{closeMenu();window.openFullLibrary?.();};menu.append(full);entries.forEach(e=>{const opt=document.createElement('option');opt.value=e.value;opt.textContent=e.text;picker.append(opt);const b=document.createElement('button');b.type='button';b.textContent=e.text;b.setAttribute('role','menuitem');b.onclick=()=>{picker.value=e.value;picker.dispatchEvent(new Event('change',{bubbles:true}));closeMenu();};menu.append(b);});
   if(eng)picker.value=$('se61Categories').value;
   else{const i=source.findIndex(el=>el.classList.contains('active'));if(i>=0)picker.value=String(i);}
  }
  function showDrawerParts(){
   if(window.SewerEngineering?.isActive())return;
   const library=$('library');if(!library)return;
   library.querySelectorAll('details').forEach(section=>{section.open=true;});
   library.querySelectorAll('img[data-fpid]').forEach(img=>{img.loading='eager';if(typeof fpLoadLibraryImage==='function')fpLoadLibraryImage(img);});
  }
  const previousRender=renderLibrary;renderLibrary=function(){const result=previousRender.apply(this,arguments);if(document.body.classList.contains('sewer-phone-drawer-open'))requestAnimationFrame(showDrawerParts);return result;};
  picker.onchange=()=>{document.body.classList.add('sewer-phone-drawer-open');if(window.SewerEngineering?.isActive()){const select=$('se61Categories');select.value=picker.value;select.dispatchEvent(new Event('change',{bubbles:true}));}else $('categoryList').querySelectorAll('button')[Number(picker.value)]?.click();requestAnimationFrame(showDrawerParts);};
  document.addEventListener('click',e=>{if(e.target.closest('#sewerRibbonTabs button')&&!e.target.closest('#sewerTab_library')){document.body.classList.remove('sewer-phone-drawer-open');closeMenu();}if(e.target.closest('#se61Real,#se61Eng,#sewerTab_library'))requestAnimationFrame(updateCategories);},true);
  document.addEventListener('click',e=>{if(!e.target.closest('#sewerCategoryMenu,#sewerLibraryCategories'))closeMenu();const button=e.target.closest('button');if(!button||!document.body.classList.contains('sewer-phone-drawer-open'))return;if(button.closest('#sewerCategoryMenu,.app>aside,#sewerPane_library,#furnitureIconToolbar,#sewerFloatingColors,#libraryModal,#sewerActionBar')||['sewerTab_library','unifiedOk','unifiedCancel'].includes(button.id))return;document.body.classList.remove('sewer-phone-drawer-open');},true);
  window.addEventListener('furniplan-language-changed',()=>requestAnimationFrame(updateCategories));
  new MutationObserver(updateCategories).observe($('categoryList'),{childList:true,subtree:true});
  requestAnimationFrame(updateCategories);
  const headerNode=document.querySelector('.app>header');new ResizeObserver(()=>document.documentElement.style.setProperty('--sewer-phone-header',Math.ceil(headerNode.getBoundingClientRect().bottom)+'px')).observe(headerNode);
 }
 const helpEnglish={file:'Start a new project, open a saved project, or import a plan.',map:'Calibrate the plan using two points and a known distance.',measure:'Choose a distance or area tool, then mark points on the plan.',pipes:'Choose the pipe type and diameter, then draw a route. Adjust its appearance here.',library:'Open the library and drag a part onto the plan.',text:'Add a title or select existing text to edit it.',color:'Select an area using points or the magic wand, choose a colour, then confirm.',visibility:'Show or hide layers and interface panels. Their original controls remain in their sections.',settings:'Project information, help, and additional settings.'};
 const help={file:'ابدأ بمشروع جديد أو افتح مشروعاً محفوظاً أو اجلب خارطة.',map:'عاير الخارطة بنقطتين ومسافة معلومة قبل الرسم بالحجم الحقيقي.',measure:'اختر قياس مسافة أو حساب مساحة، ثم حدد النقاط على الخارطة.',pipes:'اختر نوع الأنبوب وقطره ثم ابدأ رسم المسار. التحكم بمظهره موجود هنا.',library:'افتح المكتبة لاختيار قطعة وسحبها إلى الخارطة.',text:'أضف مسمّى أو اختر كتابة موجودة لتعديلها.',color:'حدد مساحة بالنقاط أو بالعصا السحرية، اختر اللون ثم أكّد.',visibility:'أظهر أو أخفِ الطبقات وأجزاء الواجهة. تبقى مفاتيحها موجودة في أقسامها الأصلية.',settings:'معلومات المشروع والمساعدة والإعدادات الإضافية.'};
 let interfaceSignature="";
 function setText(el,text){const label=el.querySelector?.('.elTabText')||el;if(label.textContent!==text)label.textContent=text;}
 function sync(){if(window.SewerNavigation?.active||window.SewerAppearanceUI?.draggingRange)return;if(busy)return;busy=true;try{
 const api=window.SewerPlan;if(!api)return;const en=window.FurniPlanLanguage?.get?.()==='en';for(const key in tabButtons)setText(tabButtons[key],en?english[key]:names[key]);setText(language,en?'العربية':'English');for(const link of visibilityLinks){link.input.checked=link.read();setText(link.text,en?link.en:link.ar);}const eng=!!window.SewerEngineering?.isActive(),state=eng?window.SewerEngineering.toolState():api.toolState();let ref=eng?window.SewerEngineering.selectionReference():api.selectionReference();const selected=typeof selectedItems==='function'?selectedItems():[];if(!ref&&selected.length===1)ref={type:'furniture',id:selected[0].id};const data=info(ref),special=currentMapLabel()||currentMeasure(),hasSelection=!!ref||selected.length>0,part=!!state.piece||!!state.editable||(!state.editing&&selected.length>0),ordinary=!data&&selected.length>0;
 selectedView.disabled=!window.SewerSelectedView?.bounds();setText(selectedView.querySelector('.iconLabel'),en?'Selected':'المختار');setText($('sewerResetInterface').querySelector('.iconLabel'),en?'Reset':'تهيئة');
 const signature=JSON.stringify([en,active,eng,state,ref,selected.map(it=>[it.id,it.locked]),data,special?.id,hasPlan(),visibilityLinks.map(link=>link.read()),uiVisibility]);if(signature===interfaceSignature)return;interfaceSignature=signature;
 const sig=JSON.stringify(ref||{})+'|'+(special?.id||'');if(sig!==lastSelection){lastSelection=sig;const next=data?'library':currentMapLabel()?'text':currentMeasure()?'measure':ordinary?'library':null;if(next&&next!==active&&!window.ElectricalRightPanel?.customActive){active=next;window.ElectricalRightPanel?.section(next);for(const key in panes){panes[key].style.setProperty('display',key===active?'flex':'none','important');tabButtons[key].classList.toggle('active',key===active);}}}
 for(const id of ['unifiedOk','unifiedCancel'])if($(id))$(id).style.setProperty('display','none','important');
 const allowed=new Set(['lColor','lDeselect','sewerBaseColorButton','sewerTransparencyButton']);if(part)for(const id of ['lPlus','lMinus','lRot180','lRot90','lRot45','lReset','lFlipH','lFlipV','lFront','lBack','lCopy','lLock','lEye','lDelete'])allowed.add(id);
 if(ordinary)for(const id of ['lDims','lNames','lShadow','lAuto','lMulti','lAll','lSnap','lGroup','lUngroup','lArrange'])allowed.add(id);
 if(data)allowed.add('sewerDeletePiece');
 for(const b of rail.querySelectorAll('.modernIconBtn'))b.style.setProperty('display',hasSelection&&!b.disabled&&allowed.has(b.id)?'inline-flex':'none','important');
 for(const sep of rail.querySelectorAll('.toolSep'))sep.style.setProperty('display','none','important');
 const opacity=$('sewerItemTransparencyTool');if(opacity){if(window.SewerPiecePopovers)opacity.style.removeProperty('display');else opacity.style.setProperty('display',ref?.type==='furniture'?'block':'none','important');}
 const visibleRail=[...rail.querySelectorAll('.modernIconBtn')].some(b=>b.style.display!=='none')||ref?.type==='furniture';document.body.classList.toggle('sewer-has-selection-tools',visibleRail);
 for(const box of sliders.children){const ids=[...box.querySelectorAll('input')].map(el=>el.id);const show=active==='measure'&&ids.includes('measureSizeRange')||active==='text'&&ids.includes('mapLabelSizeRange')||active==='pipes'&&ids.some(id=>['sewerShadowSize','sewerShadowDark'].includes(id))||['pipes','library','visibility'].includes(active)&&ids.includes('sewerLayerTransparency')||active==='color'&&ids.some(id=>['colorLayerTransparency','colorWandTolerance'].includes(id));box.style.setProperty('display',show?'flex':'none','important');}
 const anySlider=[...sliders.children].some(b=>b.style.display!=='none');sliders.style.setProperty('display',anySlider&&uiVisibility.sliders?'flex':'none','important');
 for(const id of ['sewerHideInnerLine','sewerShadowToggle'])if($(id))$(id).style.setProperty('display','inline-flex','important');
 const outline=panes.pipes.querySelector('.sewerOutlineControls');if(outline)outline.style.setProperty('display','flex','important');
 for(const id of ['se61Lengths','se61Diameters','se61Black'])if($(id))$(id).parentElement.style.display=eng?'flex':'none';
 const ready=typeof hasPlan==='function'&&hasPlan();for(const id of ['v44Calibrate','v44Measure','v65Area','resetScaleBtn'])if($(id))$(id).disabled=!ready;
 document.body.classList.toggle('sewer-context-active',!!data||(!ordinary&&!special));helper.dir=en?'ltr':'rtl';setText(helper.querySelector('strong'),data?.title||(en?english[active]:names[active]));setText(helper.querySelector('span'),data?data.details.join(' • '):(en?helpEnglish[active]:help[active]));
 }finally{busy=false;}}
 window.SewerContextUI.refresh=sync;window.SewerContextUI.activate=activate;
 let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync();});}
 const oldDraw=draw;draw=function(){const result=oldDraw.apply(this,arguments);schedule();return result;};
 for(const event of ['click','pointerup','input','change','keydown'])document.addEventListener(event,schedule,true);
 window.addEventListener('furniplan-language-changed',schedule);
 $('fileInput')?.addEventListener('change',()=>activate('map'));$('dxfInput')?.addEventListener('change',()=>activate('map'));
 // Native asynchronous map loading calls draw(), which enables calibration.
 activate('file');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

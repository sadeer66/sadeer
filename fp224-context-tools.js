/* Transactional contextual tools: keep the original handlers and stage edits until Done/Cancel. */
(()=>{
 let session=null,candidate=null,closing=false,queued=false,bar,hud,title,ok,no;
 const english=()=>window.FurniPlanLanguage?.get?.()==='en';
 const names={move:['تحريك','Move'],furniture:['تعديل الأثاث','Edit furniture'],place:['إضافة أثاث','Place furniture'],measure:['قياس','Measure'],labelPlace:['مسمى','Label'],label:['تعديل المسمى','Edit label'],areaMeasure:['مساحة','Area'],calibrate:['معايرة','Calibrate'],colorPolygon:['تحديد منطقة','Region'],colorWand:['عصا سحرية','Magic wand'],colorEdit:['تعديل اللون','Edit color']};
 const icons={move:'lMove',furniture:'lMove',place:'v101Library',measure:'v44Measure',labelPlace:'v44Label',label:'v44Label',areaMeasure:'v65Area',calibrate:'v44Calibrate',colorPolygon:'colorPolygon',colorWand:'colorWand',colorEdit:'colorEdit'};
 function snapshot(){return {edit:cloneEditState(),undo:undoStack.slice(),redo:redoStack.slice(),bgImage,bgData,dxfModel,zoom,scroll:[mainScroll.scrollLeft,mainScroll.scrollTop],checks:[...document.querySelectorAll('.mapTopbar input[type=checkbox]')].map(e=>[e.id,e.checked])};}
 function begin(kind,before){if(closing)return;if(!session)session={kind,before:before||candidate||snapshot()};else if(kind!=='select')session.kind=kind;candidate=null;schedule();}
 function detected(){if(/^color/.test(mode)||mode!=='select')return mode;if(getSelectedIds().length)return 'furniture';if(selectedMeasureId)return 'measure';if(selectedMapLabelId)return 'label';return null;}
 function schedule(){if(queued||closing)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
 function proxy(source){let b=document.getElementById('fp224-'+source);if(b)return b;const original=document.getElementById(source);if(!original)return null;b=document.createElement('button');b.type='button';b.id='fp224-'+source;b.className='modernIconBtn';b.dataset.source=source;b.onclick=()=>{original.click();schedule();};bar.append(b);return b;}
 function sync(){
  if(closing||!bar)return;const kind=detected();if(!session&&kind)begin(kind);if(session&&kind&&kind!=='select')session.kind=kind;
  const active=!!session;document.body.classList.toggle('fp224-editing',active);hud.hidden=!active;
  for(const b of bar.children)b.removeAttribute('data-fp224-visible');if(!active)return;
  const k=session.kind,selected=getSelectedIds(),furniture=selected.length>0;
  let ids=[];
  if(furniture){ids=['lPlus','lMinus','lRot180','lRot90','lRot45','lFlipH','lFlipV','lReset','lFront','lBack','lColor','lEye','lDims','lNames','fp226TextBtn','lSnap','lAuto','lShadow','lLock','lCopy','lDelete'];if(selected.length>1)ids.push('lGroup','lArrange');if(selectedItems().some(it=>it.groupId))ids.push('lUngroup');}
  else if(/^color/.test(k))ids=['colorAdd','colorSubtract','colorInvert','colorSelectionUndo','colorSelectionRedo','colorPreview','colorMaterials','colorLayerVisible','colorLayerDelete'];
  else if(k==='measure')ids=selectedMeasureId?['deleteMeasureBtn','fp206MeasureStyleBtn']:['v54MeasureLine','fp206MeasureStyleBtn'];
  else if(k==='label'||k==='labelPlace')ids=selectedMapLabelId?['deleteMapLabelBtn','fp197LabelStyleBtn']:['fp197LabelStyleBtn'];
  else if(k==='areaMeasure')ids=['fp224PointUndo'];
  else if(k==='calibrate')ids=['fp224PointUndo'];
  else if(k==='move')ids=items.length?['lMulti','lAll']:[];
  else if(k==='place')ids=['lSnap'];
  for(const id of ids){const original=document.getElementById(id);if(!original||original.disabled)continue;let b=original.parentElement===bar?original:proxy(id);if(!b)continue;
   if(b!==original){b.innerHTML=original.innerHTML;b.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));if(!b.querySelector('.iconLabel')){b.textContent='';const sp=document.createElement('span');sp.className='iconLabel';sp.textContent=original.textContent;b.append(sp);}b.title=original.title||original.textContent;}
   if(id==='fp224PointUndo'&&!(mode==='areaMeasure'?areaDraft.length:points.length))continue;
   if(id==='lLock'||id==='lCopy'||id==='lDelete'||id==='lColor'||/^l(Plus|Minus|Rot|Flip|Reset|Front|Back)/.test(id)){if(furniture&&!selectedItems().some(it=>canEditItem(it))&&id!=='lLock')continue;}
   b.setAttribute('data-fp224-visible','1');
  }
  const pair=names[k]||names.move;const text=pair[english()?1:0];title.replaceChildren();const svg=document.getElementById(icons[k]||'lMove')?.querySelector('svg');if(svg)title.append(svg.cloneNode(true));title.title=text;title.setAttribute('aria-label',text);const span=document.createElement('span');span.textContent=text;title.append(span);
  ok.title=english()?'Confirm step':'تثبيت الخطوة';no.title=english()?'Cancel step':'إلغاء الخطوة';ok.setAttribute('aria-label',ok.title);no.setAttribute('aria-label',no.title);
  ok.disabled=(mode==='areaMeasure'&&areaDraft.length<3)||(mode==='calibrate'&&getComputedStyle(scaleModal).display==='none')||(mode==='place'&&pendingFurnitureDef&&!furniture)||(mode==='labelPlace'&&!selectedMapLabelId)||(mode==='measure'&&points.length>0)||(/^color/.test(mode)&&!!document.getElementById('colorConfirm')?.disabled);
 }
 function clearTransient(){window.FP201ColorLayers?.cancel();window.FP198Boundary?.cancel();pendingFurnitureDef=null;pendingMapLabelText='';points=[];areaDraft=[];panDrag=null;drag=null;measureDrag=null;mapLabelDrag=null;pendingCalDistancePx=null;scaleModal.style.display='none';hideLiveMeasureBadge();hideAreaBadgeNow?.();activateWorkingTool('select');clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;syncSelectedPanel();draw();}
 async function finish(){
  if(!session||closing||ok.disabled)return;
  if(mode==='calibrate'){document.getElementById('applyCalBtn').click();schedule();return;}
  if(mode==='areaMeasure'){await finishAreaTool();if(mode==='areaMeasure'){schedule();return;}}
  if(/^color/.test(mode)){document.getElementById('colorConfirm').click();if(/^color/.test(mode)){schedule();return;}}
  const s=session;closing=true;try{clearTransient();undoStack=s.before.undo.slice();redoStack=s.before.redo.slice();commitHistory(s.before.edit);updateHistoryButtons();session=null;candidate=null;}finally{closing=false;}sync();setStatus(english()?'Step confirmed':'تم تثبيت الخطوة');
 }
 function cancel(){if(!session||closing)return;const s=session;closing=true;try{clearTransient();bgImage=s.before.bgImage;bgData=s.before.bgData;dxfModel=s.before.dxfModel;restoreEditState(s.before.edit);undoStack=s.before.undo.slice();redoStack=s.before.redo.slice();for(const [id,value] of s.before.checks){const e=document.getElementById(id);if(e&&e.checked!==value){e.checked=value;e.dispatchEvent(new Event('change',{bubbles:true}));}}clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;syncSelectedPanel();updateHistoryButtons();setZoomPercent(s.before.zoom*100);mainScroll.scrollLeft=s.before.scroll[0];mainScroll.scrollTop=s.before.scroll[1];draw();session=null;candidate=null;}finally{closing=false;}sync();setStatus(english()?'Step cancelled; previous state restored':'تم إلغاء الخطوة واستعادة الحالة السابقة');}
 function init(){
  bar=document.getElementById('furnitureIconToolbar');if(!bar)return;
  document.body.classList.add('fp224');
  const style=document.createElement('style');style.textContent=`
  body.fp224 #furnitureIconToolbar{display:none!important;left:6px!important;right:auto!important;top:8px!important;bottom:8px!important;width:max-content!important;max-width:38vw!important;z-index:70!important}
  body.fp224.fp224-editing:not(.fp223-hide-tools) #furnitureIconToolbar{display:flex!important}
  body.fp224 #furnitureIconToolbar>*{display:none!important}
  body.fp224.fp224-editing #furnitureIconToolbar>[data-fp224-visible="1"]{display:inline-flex!important}
  body.fp224.fp224-editing #furnitureIconToolbar:not(:has([data-fp224-visible="1"])){display:none!important}
  body.fp224 .mapPanel{position:relative!important}
  #fp224HUD{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:6px;direction:ltr;padding:3px;border-radius:10px;background:#102238e8;border:1px solid #67849c;box-shadow:0 3px 12px #0005}
  #fp224HUD[hidden]{display:none!important}
  body.fp224 #fp224HUD button{height:36px!important;min-height:36px!important;width:36px!important;min-width:36px!important;padding:0!important;border-radius:7px;border:1px solid #99b1c4;color:white;font:bold 24px Arial}
  #fp224Done{background:#138447!important}#fp224Cancel{background:#bd3035!important}
  #fp224HUD button:disabled{opacity:.4;cursor:not-allowed}
  #fp224Tool{display:flex;align-items:center;gap:6px;padding:0 7px;color:white;font:12px Tahoma;white-space:nowrap;direction:rtl}
  #fp224Tool svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8}
  @media(max-width:700px){#fp224Tool span{display:none}#fp224HUD{top:6px}}
  `;document.head.append(style);
  hud=document.createElement('div');hud.id='fp224HUD';hud.hidden=true;hud.dataset.fp222Label='1';title=document.createElement('div');title.id='fp224Tool';ok=document.createElement('button');ok.id='fp224Done';ok.textContent='✓';no=document.createElement('button');no.id='fp224Cancel';no.textContent='×';ok.onclick=finish;no.onclick=cancel;hud.append(title,ok,no);document.querySelector('.mapPanel').append(hud);
  const undoPoint=document.createElement('button');undoPoint.id='fp224PointUndo';undoPoint.className='modernIconBtn';undoPoint.innerHTML='<span>↶</span><span class="iconLabel">نقطة سابقة</span>';undoPoint.onclick=()=>{if(mode==='areaMeasure'){areaDraft.pop();syncAreaToolLabel();}else points.pop();draw();schedule();};bar.append(undoPoint);
  const activate=activateWorkingTool;activateWorkingTool=function(next){if(!closing&&next!=='select')begin(next);const result=activate.apply(this,arguments);schedule();return result;};window.activateWorkingTool=activateWorkingTool;
  const syncPanel=syncSelectedPanel;syncSelectedPanel=function(){const r=syncPanel.apply(this,arguments);schedule();return r;};
  const stateSync=window.syncModernToolStates;window.syncModernToolStates=function(){stateSync?.();schedule();};
  document.addEventListener('pointerdown',e=>{if(!session&&!closing&&e.target.closest('#canvas,#modernToolbarArea,.fcard,#fullLibChooseBtn'))candidate=snapshot();},true);
  document.getElementById('fp223Move')?.addEventListener('click',()=>begin('move'),true);
  document.addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(['colorCancel','cancelCalBtn'].includes(id)){queueMicrotask(cancel);}else if(['colorConfirm','applyCalBtn','v65Area'].includes(id)){queueMicrotask(()=>{if(session&&mode==='select')finish();});}});
  for(const id of ['fileInput','loadInput','dxfInput'])document.getElementById(id)?.addEventListener('change',()=>{session=null;candidate=null;hud.hidden=true;document.body.classList.remove('fp224-editing');},true);
  const newProject=startNewProject;startNewProject=async function(){const r=await newProject.apply(this,arguments);if(!hasPlan()&&!items.length){session=null;candidate=null;sync();}return r;};
  document.addEventListener('pointerup',schedule);document.addEventListener('click',schedule);document.addEventListener('input',schedule);document.addEventListener('change',schedule);
  document.addEventListener('keydown',e=>{if(!session||e.target.matches('input,textarea,select')||document.querySelector('[role=dialog]:not([hidden])')?.checkVisibility())return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();finish();}},true);
  window.addEventListener('furniplan-language-changed',schedule);
  window.FP224Context={begin,finish,cancel,sync};sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();

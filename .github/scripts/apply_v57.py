from pathlib import Path

p = Path('index.html')
c = p.read_text(encoding='utf-8')

def replace_one(old, new, label):
    global c
    n = c.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    c = c.replace(old, new, 1)

already = 'furniturePlannerLibraryV57_DOOR_WINDOW_ICONS' in c and "id:'doorTurkish110'" in c

if not already:
    if '<title>تأثيثي V47 V47 — iPad و iPhone</title>' in c:
        replace_one('<title>تأثيثي V47 V47 — iPad و iPhone</title>', '<title>تأثيثي V57 — أيقونات الأبواب والشبابيك</title>', 'title')

    old_css = ".archGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.archCard{background:#172033;border:1px solid #2b3a52;border-radius:10px;padding:9px;cursor:grab;text-align:center}.archCard:hover{border-color:#38bdf8}.archCard b{display:block;font-size:12px}.archCard span{font-size:10px;color:#94a3b8}.archIcon{font-size:24px;line-height:1.1;display:block;margin-bottom:4px}.printMeta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.printMeta .wide{grid-column:1/3}.printNote{font-size:11px;color:#94a3b8;line-height:1.6}.doorOnly{display:none}"
    new_css = ".archGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.archGroupTitle{grid-column:1/-1;font-size:13px;font-weight:800;color:#e2e8f0;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:7px 10px;text-align:center}.archCard{background:#172033;border:1px solid #2b3a52;border-radius:12px;padding:10px;cursor:grab;text-align:center;position:relative;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:flex-start}.archCard:hover{border-color:#38bdf8}.archCard b{display:block;font-size:12px;color:#f8fafc;line-height:1.4}.archCard span{font-size:11px;color:#cbd5e1}.archThumbWrap{width:100%;background:#fff;border-radius:12px;padding:6px;box-sizing:border-box;box-shadow:0 1px 6px rgba(0,0,0,.16)}.archThumb{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:10px;background:#fff}.archIcon{display:none}.printMeta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.printMeta .wide{grid-column:1/3}.printNote{font-size:11px;color:#94a3b8;line-height:1.6}.doorOnly{display:none}"
    replace_one(old_css, new_css, 'architecture css')

    start = c.index('const architecture=[')
    end = c.index('function uniqueIds', start)
    new_arch = r'''const architecture=[
  {id:'door80',name:'باب داخلي 80',label:'باب',w:80,h:10,type:'door',archType:'door',doorSwing:1,displayDims:'80×210',group:'doors',previewKind:'door'},
  {id:'door90',name:'باب داخلي 90',label:'باب',w:90,h:10,type:'door',archType:'door',doorSwing:1,displayDims:'90×210',group:'doors',previewKind:'door'},
  {id:'door100',name:'باب داخلي 100',label:'باب',w:100,h:10,type:'door',archType:'door',doorSwing:1,displayDims:'100×210',group:'doors',previewKind:'door'},
  {id:'doorTurkish110',name:'باب تركي 110',label:'باب تركي',w:110,h:10,type:'door',archType:'door',doorSwing:1,displayDims:'110×270',group:'doors',previewKind:'turkishDoor'},
  {id:'door160',name:'باب مزدوج 160',label:'باب مزدوج',w:160,h:10,type:'doubleDoor',archType:'doubleDoor',doorSwing:1,displayDims:'160×210',group:'doors',previewKind:'doubleDoor'},
  {id:'slidingDoor160',name:'باب سحاب 160',label:'باب سحاب',w:160,h:10,type:'slidingDoor',archType:'slidingDoor',displayDims:'160×210',group:'doors',previewKind:'slidingDoor'},
  {id:'window100',name:'شباك مفرد 100',label:'شباك',w:100,h:12,type:'window',archType:'window',displayDims:'100×120',group:'windows',previewKind:'windowSingle'},
  {id:'window120',name:'شباك مزدوج 120',label:'شباك مزدوج',w:120,h:12,type:'window',archType:'window',displayDims:'120×120',group:'windows',previewKind:'windowDouble'},
  {id:'slidingWindow180',name:'شباك سحاب 180',label:'شباك سحاب',w:180,h:12,type:'slidingWindow',archType:'slidingWindow',displayDims:'180×120',group:'windows',previewKind:'windowSliding'},
  {id:'fixedWindow120',name:'شباك ثابت 120',label:'شباك ثابت',w:120,h:12,type:'fixedWindow',archType:'fixedWindow',displayDims:'120×120',group:'windows',previewKind:'windowFixed'},
  {id:'opening120',name:'فتحة 120',label:'فتحة',w:120,h:10,type:'opening',archType:'opening',displayDims:'120×210',group:'openings',previewKind:'opening'}
];

function archPreviewData(def){
  const label=(def.label||def.name||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const dims=(def.displayDims||`${def.w}×${def.h}`).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const kind=def.previewKind||def.archType||'item';
  let graphic='';
  if(kind==='door'){
    graphic=`<rect x="72" y="28" width="86" height="118" rx="2" fill="#9a5f2f"/><rect x="82" y="38" width="66" height="100" fill="#d9a46b"/><rect x="92" y="48" width="46" height="80" fill="#e7b47a"/><rect x="126" y="82" width="12" height="8" rx="4" fill="#3c4654"/>`;
  }else if(kind==='turkishDoor'){
    graphic=`<rect x="70" y="26" width="90" height="122" rx="2" fill="#7a4a24"/><rect x="80" y="36" width="70" height="102" fill="#b8753f"/><rect x="90" y="46" width="50" height="82" fill="#d79a57"/><rect x="90" y="42" width="50" height="10" fill="#c98e50" opacity=".85"/><rect x="90" y="122" width="50" height="10" fill="#c98e50" opacity=".85"/><rect x="127" y="82" width="12" height="8" rx="4" fill="#2f3946"/>`;
  }else if(kind==='doubleDoor'){
    graphic=`<rect x="56" y="28" width="118" height="118" rx="2" fill="#9a5f2f"/><rect x="66" y="38" width="46" height="100" fill="#d9a46b"/><rect x="118" y="38" width="46" height="100" fill="#d9a46b"/><rect x="100" y="82" width="8" height="8" rx="4" fill="#3c4654"/><rect x="122" y="82" width="8" height="8" rx="4" fill="#3c4654"/>`;
  }else if(kind==='slidingDoor'){
    graphic=`<rect x="52" y="32" width="126" height="108" rx="4" fill="#8a5329"/><rect x="64" y="42" width="48" height="88" fill="#d79d62"/><rect x="118" y="42" width="48" height="88" fill="#d79d62"/><rect x="86" y="74" width="6" height="26" rx="3" fill="#314155"/><rect x="138" y="74" width="6" height="26" rx="3" fill="#314155"/><path d="M84 140 L104 140" stroke="#314155" stroke-width="4" stroke-linecap="round"/><path d="M124 140 L144 140" stroke="#314155" stroke-width="4" stroke-linecap="round"/>`;
  }else if(kind==='windowSingle'){
    graphic=`<rect x="62" y="34" width="106" height="92" rx="4" fill="#2168b2"/><rect x="74" y="46" width="82" height="68" fill="#bfe5ff"/><rect x="62" y="76" width="106" height="8" fill="#2168b2"/><rect x="54" y="126" width="122" height="14" rx="5" fill="#d4d9df"/>`;
  }else if(kind==='windowDouble'){
    graphic=`<rect x="56" y="32" width="118" height="94" rx="4" fill="#2168b2"/><rect x="66" y="42" width="45" height="74" fill="#bfe5ff"/><rect x="119" y="42" width="45" height="74" fill="#bfe5ff"/><rect x="112" y="42" width="8" height="74" fill="#2168b2"/><rect x="66" y="78" width="98" height="6" fill="#2168b2"/><rect x="48" y="126" width="134" height="14" rx="5" fill="#d4d9df"/>`;
  }else if(kind==='windowSliding'){
    graphic=`<rect x="48" y="34" width="134" height="90" rx="4" fill="#2168b2"/><rect x="60" y="44" width="54" height="70" fill="#bfe5ff"/><rect x="116" y="44" width="54" height="70" fill="#cdeaff"/><rect x="108" y="44" width="8" height="70" fill="#2168b2"/><path d="M84 126 L102 126" stroke="#2168b2" stroke-width="4" stroke-linecap="round"/><path d="M128 126 L146 126" stroke="#2168b2" stroke-width="4" stroke-linecap="round"/><rect x="44" y="126" width="142" height="14" rx="5" fill="#d4d9df"/>`;
  }else if(kind==='windowFixed'){
    graphic=`<rect x="60" y="34" width="110" height="92" rx="4" fill="#4b83c3"/><rect x="72" y="46" width="86" height="68" fill="#d8f0ff"/><path d="M86 54 L144 108" stroke="#ffffff" stroke-opacity=".65" stroke-width="6"/><rect x="52" y="126" width="126" height="14" rx="5" fill="#d4d9df"/>`;
  }else{
    graphic=`<rect x="58" y="46" width="114" height="74" rx="4" fill="#ffffff" stroke="#8a93a4" stroke-width="8"/><rect x="70" y="58" width="90" height="50" fill="#eaf2f7" stroke="#b0b8c5" stroke-width="2"/>`;
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 230"><rect width="230" height="230" rx="28" fill="#ffffff"/><g>${graphic}</g><text x="115" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">${dims}</text><text x="115" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1f2937">${label}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

function appendArchitectureGroup(title, defs){
  if(!defs.length)return;
  const head=document.createElement('div');head.className='archGroupTitle';head.textContent=title;archLibrary.appendChild(head);
  defs.forEach(def=>{
    const d=document.createElement('div');d.className='archCard';d.draggable=true;d.style.position='relative';
    d.innerHTML=`<div class="archThumbWrap"><img class="archThumb" src="${archPreviewData(def)}" alt="${def.name}"></div><b>${def.name}</b><span>اسحب إلى الخارطة</span><button class="touchDragHandle" type="button" aria-label="اسحب إلى الخارطة">⠿</button>`;
    d.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-arch-id',def.id);e.dataTransfer.effectAllowed='copy';});
    const h=d.querySelector('.touchDragHandle');h.addEventListener('pointerdown',e=>startTouchLibraryDrag(e,def,true));h.addEventListener('pointermove',moveTouchLibraryDrag);h.addEventListener('pointerup',endTouchLibraryDrag);h.addEventListener('pointercancel',endTouchLibraryDrag);
    d.onclick=e=>{if(e.target.closest('.touchDragHandle'))return;if(!pxPerCm){alert('عاير القياس أولاً.');return;}pendingFurnitureDef=def;mode='place';updateInteractionCursor();setStatus(`المس مكان وضع ${def.name} على الخارطة`);if(isIPadLayout())setSidebarOpen(false);};
    archLibrary.appendChild(d);
  });
}
function buildArchitectureLibrary(){
  archLibrary.innerHTML='';
  appendArchitectureGroup('الأبواب', architecture.filter(def=>def.group==='doors'));
  appendArchitectureGroup('الشبابيك', architecture.filter(def=>def.group==='windows'));
  appendArchitectureGroup('الفتحات', architecture.filter(def=>def.group==='openings'));
}
'''
    c = c[:start] + new_arch + c[end:]

    replace_one(
        "const LIBRARY_STORAGE_KEY='furniturePlannerLibraryV47_FINAL_TOPONLY';",
        "const LIBRARY_STORAGE_KEY='furniturePlannerLibraryV57_DOOR_WINDOW_ICONS';\nconst LEGACY_LIBRARY_STORAGE_KEYS=['furniturePlannerLibraryV55_IPAD_DINING_FIX','furniturePlannerLibraryV47_FINAL_TOPONLY'];",
        'library storage key')

    clone_anchor = """function cloneDefaultLibrary(){
  return defaultFurniture.map((x,i)=>({...x,id:`base_${i}`,isCustom:false}));
}
"""
    helpers = clone_anchor + r'''function canonicalLibraryCategory(value){
  const s=String(value||'').trim().replace(/\s+/g,' ');
  const aliases={
    'غرفة الطعام':'غرفة طعام','غرفه طعام':'غرفة طعام','غرفه الطعام':'غرفة طعام',
    'طعام':'غرفة طعام','الطعام':'غرفة طعام'
  };
  return aliases[s]||s||'أخرى';
}
function normalizeLibraryItems(parsed){
  return parsed.map((x,i)=>({
    id:x.id||`saved_${i}_${Date.now()}`,
    name:x.name||'قطعة',w:+x.w||100,h:+x.h||60,src:x.src||null,
    category:canonicalLibraryCategory(x.category),color:x.color||'#bfa781',
    isCustom:x.isCustom!==false
  }));
}
function repairDiningLibrary(list){
  const diningDefaults=defaultFurniture
    .map((x,i)=>({...x,_baseIndex:i}))
    .filter(x=>canonicalLibraryCategory(x.category)==='غرفة طعام');
  const dining=list.filter(x=>canonicalLibraryCategory(x.category)==='غرفة طعام');
  if(!dining.length){
    diningDefaults.forEach(x=>list.push({...x,id:`base_${x._baseIndex}`,isCustom:false,category:'غرفة طعام'}));
    return list;
  }
  list.forEach(x=>{x.category=canonicalLibraryCategory(x.category);});
  return list;
}
'''
    replace_one(clone_anchor, helpers, 'dining helpers')

    old_load = """function loadSavedLibrary(){
  try{
    const raw=localStorage.getItem(LIBRARY_STORAGE_KEY);
    if(!raw)return cloneDefaultLibrary();
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)||!parsed.length)return cloneDefaultLibrary();
    return parsed.map((x,i)=>({id:x.id||`saved_${i}_${Date.now()}`,name:x.name||'قطعة',w:+x.w||100,h:+x.h||60,src:x.src||null,category:x.category||'أخرى',color:x.color||'#bfa781',isCustom:x.isCustom!==false}));
  }catch(e){return cloneDefaultLibrary();}
}
"""
    new_load = """function loadSavedLibrary(){
  try{
    let parsed=null;
    for(const key of [LIBRARY_STORAGE_KEY,...LEGACY_LIBRARY_STORAGE_KEYS]){
      const raw=localStorage.getItem(key);
      if(!raw)continue;
      const candidate=JSON.parse(raw);
      if(Array.isArray(candidate)&&candidate.length){parsed=candidate;break;}
    }
    if(!parsed)return cloneDefaultLibrary();
    const repaired=repairDiningLibrary(normalizeLibraryItems(parsed));
    try{localStorage.setItem(LIBRARY_STORAGE_KEY,JSON.stringify(repaired));}catch(_e){}
    return repaired;
  }catch(e){return cloneDefaultLibrary();}
}
"""
    replace_one(old_load, new_load, 'loadSavedLibrary')

    replace_one(
        "const w=it.w*pxPerCm,h=(it.archType==='door'||it.archType==='doubleDoor'?Math.max(it.h,it.w):it.h)*pxPerCm,a=it.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);",
        "const w=it.w*pxPerCm,h=(['door','doubleDoor','slidingDoor'].includes(it.archType)?Math.max(it.h,it.w):it.h)*pxPerCm,a=it.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);",
        'door geometry')

    old_window = """function drawWindow(it,w,h){
  const u=1/zoom,th=Math.max(h,7*u);ctx.save();ctx.strokeStyle='#111827';ctx.lineWidth=1.4*u;ctx.fillStyle='rgba(186,230,253,.55)';ctx.fillRect(-w/2,-th/2,w,th);ctx.strokeRect(-w/2,-th/2,w,th);
  ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);ctx.stroke();ctx.beginPath();ctx.moveTo(-w*.32,-th/2);ctx.lineTo(-w*.32,th/2);ctx.moveTo(w*.32,-th/2);ctx.lineTo(w*.32,th/2);ctx.stroke();ctx.restore();
}
"""
    new_window = """function drawSlidingDoor(it,w,h){
  const u=1/zoom,th=Math.max(8*u,Math.min(14*u,h||10*u));ctx.save();ctx.strokeStyle='#111827';ctx.lineWidth=1.5*u;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);ctx.stroke();ctx.strokeRect(-w/2,-th/2,w*0.52,th);ctx.strokeRect(-w*0.02,-th/2,w*0.52,th);
  ctx.beginPath();ctx.moveTo(-w*0.18,0);ctx.lineTo(-w*0.03,0);ctx.moveTo(w*0.03,0);ctx.lineTo(w*0.18,0);ctx.stroke();ctx.restore();
}
function drawWindow(it,w,h){
  const u=1/zoom,th=Math.max(h,7*u);ctx.save();ctx.strokeStyle='#111827';ctx.lineWidth=1.4*u;ctx.fillStyle='rgba(186,230,253,.55)';ctx.fillRect(-w/2,-th/2,w,th);ctx.strokeRect(-w/2,-th/2,w,th);
  ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-th/2);ctx.lineTo(0,th/2);ctx.stroke();ctx.restore();
}
function drawSlidingWindow(it,w,h){
  const u=1/zoom,th=Math.max(h,7*u);ctx.save();ctx.strokeStyle='#111827';ctx.lineWidth=1.3*u;ctx.fillStyle='rgba(186,230,253,.55)';ctx.fillRect(-w/2,-th/2,w*0.56,th);ctx.strokeRect(-w/2,-th/2,w*0.56,th);ctx.fillRect(-w*0.06,-th/2,w*0.56,th);ctx.strokeRect(-w*0.06,-th/2,w*0.56,th);ctx.restore();
}
function drawFixedWindow(it,w,h){
  const u=1/zoom,th=Math.max(h,7*u);ctx.save();ctx.strokeStyle='#111827';ctx.lineWidth=1.3*u;ctx.fillStyle='rgba(191,229,255,.72)';ctx.fillRect(-w/2,-th/2,w,th);ctx.strokeRect(-w/2,-th/2,w,th);ctx.restore();
}
"""
    replace_one(old_window, new_window, 'window drawing')

    replace_one(
        "if(it.archType==='door')drawDoor(it,w,h); else if(it.archType==='doubleDoor')drawDoubleDoor(it,w,h); else if(it.archType==='window')drawWindow(it,w,h); else if(it.archType==='opening')drawOpening(it,w,h); else if(it.src){ drawSprite(it,w,h); } else switch(it.type){",
        "if(it.archType==='door')drawDoor(it,w,h); else if(it.archType==='doubleDoor')drawDoubleDoor(it,w,h); else if(it.archType==='slidingDoor')drawSlidingDoor(it,w,h); else if(it.archType==='window')drawWindow(it,w,h); else if(it.archType==='slidingWindow')drawSlidingWindow(it,w,h); else if(it.archType==='fixedWindow')drawFixedWindow(it,w,h); else if(it.archType==='opening')drawOpening(it,w,h); else if(it.src){ drawSprite(it,w,h); } else switch(it.type){",
        'draw dispatcher')

    c = c.replace("(it.archType==='door'||it.archType==='doubleDoor')?w:h", "(['door','doubleDoor','slidingDoor'].includes(it.archType))?w:h")
    replace_one(
        "(!multi&&it&&(it.archType==='door'||it.archType==='doubleDoor'))?'':'none'",
        "(!multi&&it&&(['door','doubleDoor'].includes(it.archType)))?'':'none'",
        'flip door visibility')
    replace_one(
        "if(it.archType==='door'||it.archType==='doubleDoor')it.doorSwing=(it.doorSwing||1)*-1;",
        "if(['door','doubleDoor'].includes(it.archType))it.doorSwing=(it.doorSwing||1)*-1;",
        'flip door action')

    required = [
        'furniturePlannerLibraryV57_DOOR_WINDOW_ICONS',
        "id:'doorTurkish110'", "id:'slidingDoor160'", "id:'slidingWindow180'", "id:'fixedWindow120'",
        "appendArchitectureGroup('الأبواب'", 'function repairDiningLibrary', 'function drawSlidingDoor', 'function drawSlidingWindow'
    ]
    missing = [x for x in required if x not in c]
    if missing:
        raise SystemExit('Verification failed: ' + ', '.join(missing))

    p.write_text(c, encoding='utf-8')

Path('service-worker.js').write_text('''const CACHE_NAME = "taatheethi-v57-door-window-icons";

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, {cache:'no-store'}));
});
''', encoding='utf-8')

Path('manifest.webmanifest').write_text('''{
  "name": "تأثيثي V57 - أيقونات الأبواب والشبابيك",
  "short_name": "مخطط الأثاث",
  "description": "مخطط أثاث تفاعلي مع إصلاح مكتبة الطعام وأيقونات ملوّنة واضحة للأبواب والشبابيك على iPad.",
  "lang": "ar",
  "dir": "rtl",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0f172a",
  "theme_color": "#020617",
  "icons": [
    {"src":"icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},
    {"src":"icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}
  ]
}
''', encoding='utf-8')
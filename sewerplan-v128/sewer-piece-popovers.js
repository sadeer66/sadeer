/* Independent original-colour bases, composited after body tinting. */
(()=>{
 const entries={},cache=new Map();
 for(const n of [4,5,10,11,13,14,15,16]){
  const part='part-'+String(n).padStart(2,'0'),e=entries['assets/sanitary/'+part+'.png']={original:new Image(),shade:new Image()};
  for(const im of [e.original,e.shade])im.onload=()=>{cache.clear();if(typeof draw==='function')draw();};
  e.original.src='assets/sanitary/base-regions/'+part+'.png';e.shade.src='assets/sanitary/base-regions/'+part+'-shade.png';
 }
 window.SewerBaseRegions={supports:it=>!!entries[it.src]||!!window.SewerDrainLayers?.supports(it),render(it,body){
  const e=entries[it.src];if(!e||!e.original.naturalWidth||!e.shade.naturalWidth)return body;
  const color=it.drainBaseColor,key=it.src+'|'+(color||'original');let base=cache.get(key);
  if(!base){base=e.original;if(/^#[0-9a-f]{6}$/i.test(color||'')){
   base=document.createElement('canvas');base.width=e.original.naturalWidth;base.height=e.original.naturalHeight;const c=base.getContext('2d');
   c.drawImage(e.shade,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,base.width,base.height);c.globalCompositeOperation='multiply';c.drawImage(e.shade,0,0);c.globalCompositeOperation='destination-in';c.drawImage(e.shade,0,0);
  }cache.set(key,base);}
  const k=key+'|body|'+(it.tintEnabled?it.color:'')+'|'+(window.SewerPlan?.itemColor(it)||'');if(cache.has(k))return cache.get(k);
  const result=document.createElement('canvas');result.width=body.naturalWidth||body.width;result.height=body.naturalHeight||body.height;const c=result.getContext('2d');c.drawImage(body,0,0,result.width,result.height);c.drawImage(base,0,0,result.width,result.height);cache.set(k,result);if(cache.size>100)cache.clear();return result;
 }};
})();
/* Keep piece controls in the visible rail; reuse the existing colour and history handlers. */
(()=>{
 function boot(){
  const rail=document.getElementById('furnitureIconToolbar'),base=document.getElementById('sewerBaseColorButton'),popup=document.getElementById('sewerItemTransparencyTool'),range=document.getElementById('sewerItemTransparency');
  if(!rail||!base||!popup||!range)return;
  base.classList.add('modernIconBtn');base.querySelector('b').innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="9" ry="7"/><ellipse cx="12" cy="13" rx="5" ry="4" fill="currentColor"/></svg>';base.querySelector('span').classList.add('iconLabel');
  document.getElementById('lColor').after(base);
  const button=document.createElement('button');button.type='button';button.id='sewerTransparencyButton';button.className='modernIconBtn';
  button.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/></svg><span class="iconLabel">شفافية</span>';
  button.setAttribute('aria-controls',popup.id);button.setAttribute('aria-expanded','false');const oldSlot=document.createElement('span');popup.before(oldSlot);oldSlot.replaceWith(button);
  document.body.append(popup);popup.setAttribute('role','dialog');popup.hidden=true;popup.style.removeProperty('display');
  const style=document.createElement('style');style.textContent=`
   #sewerItemTransparencyTool{position:fixed!important;z-index:200000!important;box-sizing:border-box!important;width:220px!important;max-width:calc(100vw - 16px)!important;padding:14px!important;border:1px solid #527494!important;border-radius:12px!important;background:#14283e!important;color:#fff!important;box-shadow:0 8px 26px #0006;direction:rtl}
   #sewerItemTransparencyTool[hidden]{display:none!important}
   #sewerItemTransparencyTool:not([hidden]){display:block!important}
   #sewerItemTransparencyTool label{display:flex!important;flex-wrap:wrap;gap:10px;align-items:center;font-size:13px!important}
   #sewerItemTransparencyTool output{margin-inline-start:auto}
   #sewerItemTransparencyTool input{width:100%!important;min-width:0!important;touch-action:none;accent-color:#66c5ff}
   #furnitureIconToolbar #lColor::after{display:none!important}#sewerBaseColorButton{position:relative}#sewerBaseColorButton b{color:var(--tool-color,#66c5ff)}
  `;document.head.append(style);
  let selection='';
  function close(){popup.style.removeProperty('display');popup.hidden=true;button.setAttribute('aria-expanded','false');}
  function position(){if(popup.hidden)return;const r=button.getBoundingClientRect(),w=popup.offsetWidth,h=popup.offsetHeight;popup.style.left=Math.max(8,Math.min(r.right+10,innerWidth-w-8))+'px';popup.style.top=Math.max(8,Math.min(r.top,innerHeight-h-8))+'px';}
  function sync(){
   const selected=selectedItems(),en=window.FurniPlanLanguage?.get?.()==='en',key=selected.map(it=>it.id).join('|');
   button.disabled=range.disabled;button.style.setProperty('display',!button.disabled&&selected.length===1?'inline-flex':'none','important');
   base.style.setProperty('display',!base.disabled&&selected.length?'inline-flex':'none','important');
   base.querySelector('.iconLabel').textContent=en?'Base colour':'لون القاع';base.title=en?'Inner / base colour':'لون الداخل / القاع';
   button.querySelector('.iconLabel').textContent=en?'Opacity':'شفافية';button.title=en?'Piece transparency':'شفافية القطعة';popup.setAttribute('aria-label',button.title);
   if(key!==selection||button.disabled||!button.getClientRects().length)close();selection=key;position();
  }
  button.onclick=()=>{if(button.disabled)return;popup.hidden=!popup.hidden;button.setAttribute('aria-expanded',String(!popup.hidden));position();};
  document.addEventListener('pointerdown',e=>{if(!popup.contains(e.target)&&!button.contains(e.target))close();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!popup.hidden){close();button.focus();}});
  rail.addEventListener('scroll',close,{passive:true});window.addEventListener('resize',close);
  window.addEventListener('furniplan-language-changed',sync);
  const original=syncSelectedPanel;syncSelectedPanel=function(){const result=original.apply(this,arguments);sync();return result;};
  window.SewerPiecePopovers={sync,close};sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

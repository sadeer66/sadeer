/* FurniPlan V199: independent floor finishes, stored with project areas. */
(() => {
'use strict';
const en=()=>window.FurniPlanLanguage?.get?.()==='en';
const t=(ar,eng)=>en()?eng:ar;
const presets=[
 ['solid','لون فقط','Solid color'],['cream','مرمر كريمي','Cream marble'],['white','مرمر أبيض','White marble'],['grey','مرمر رصاصي','Grey marble'],
 ['oak','باركيه بلوط','Oak planks'],['walnut','باركيه جوز','Walnut planks'],['basket','باركيه مربعات','Basket parquet'],
 ['sand','حجر رملي','Sandstone'],['slate','حجر داكن','Slate'],['blocks','حجر متنوع','Stone blocks']
];
const defaults={material:'cream',color:'#e8d8b9',opacity:0.85,repeat:1,shadow:0.25};
let settings={...defaults},selected=null,draft=[],tap=null,editBefore=null;
const tiles=new Map();
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function tile(key){
 if(tiles.has(key))return tiles.get(key);
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 const rnd=seeded([...key].reduce((a,b)=>a+b.charCodeAt(0),19));
 const marble=['cream','white','grey'].includes(key),wood=['oak','walnut','basket'].includes(key);
 const base={cream:[230,216,191],white:[242,240,234],grey:[166,170,171],oak:[185,141,89],walnut:[119,79,49],basket:[167,121,72],sand:[204,187,153],slate:[89,99,107],blocks:[181,173,156]}[key]||[230,216,191];
 const data=g.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  // Periodic waves keep the stone texture continuous across tile boundaries.
  const wave=Math.sin(x*Math.PI/64+Math.sin(y*Math.PI/128)*2)+Math.cos(y*Math.PI/32+x*Math.PI/128);
  const u=x*Math.PI/128,v=y*Math.PI/128;
  const turbulence=.65*Math.sin(u+2*v)+.28*Math.sin(3*u-2*v)+.14*Math.sin(7*u+4*v)+.055*Math.sin(19*u-9*v);
  const field=u+v+turbulence;
  const vein=marble?(Math.exp(-Math.abs(Math.sin(field))*65)*30+Math.exp(-Math.abs(Math.sin(field*3+.4*Math.sin(4*v)))*110)*12):0;
  const n=(rnd()-.5)*(marble?5:14)+wave*(marble?3:2)-vein;
  const i=(y*256+x)*4;for(let j=0;j<3;j++)data.data[i+j]=Math.max(0,Math.min(255,base[j]+n));data.data[i+3]=255;
 }g.putImageData(data,0,0);
 if(wood){
  const plank=(x,y,w,h,vertical)=>{
   g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
   g.fillStyle=`rgba(${rnd()>.5?'255,230,190':'45,22,5'},${.05+rnd()*.15})`;g.fillRect(x,y,w,h);
   for(let i=0;i<42;i++){
    g.strokeStyle=`rgba(55,25,5,${.04+rnd()*.14})`;g.lineWidth=.3+rnd();g.beginPath();
    const a=rnd()*(vertical?w:h);for(let z=0;z<=256;z+=8){const d=a+Math.sin(z/34+i)*1.6;const px=vertical?x+d:x+z,py=vertical?y+z:y+d;z?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();
   }
   g.strokeStyle='rgba(50,29,12,.38)';g.lineWidth=1.5;g.strokeRect(x+.6,y+.6,w-1.2,h-1.2);g.restore();
  };
  if(key==='basket'){for(let y=0;y<2;y++)for(let x=0;x<2;x++)for(let k=0;k<4;k++){
   const v=(x+y)%2===0;plank(x*128+(v?k*32:0),y*128+(v?0:k*32),v?32:128,v?128:32,v);
  }}else{for(let row=0;row<4;row++)for(let col=-1;col<2;col++)plank(col*256+(row%2)*128,row*64,256,64,false);}
 }else if(!marble){
  const rows=key==='blocks'?4:2,h=256/rows;
  for(let row=0;row<rows;row++)for(let col=-1;col<3;col++){
   const w=key==='blocks'?(row%2?128:256):128,x=col*w+(row%2)*w/2,y=row*h;
   g.fillStyle=`rgba(${rnd()>.5?'255,255,240':'20,20,20'},${rnd()*.12})`;g.fillRect(x,y,w,h);
   g.strokeStyle='rgba(245,238,220,.7)';g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3);
  }
 }
 tiles.set(key,c);return c;
}
function path(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
function styleOf(a){return {...defaults,...a.surface};}
function bounds(pts){return {x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),right:Math.max(...pts.map(p=>p.x)),bottom:Math.max(...pts.map(p=>p.y))};}
function paint(c,a){
 if(!a.points||a.points.length<3)return;const s=styleOf(a),b=bounds(a.points);
 c.save();path(c,a.points);c.clip();c.globalAlpha=Math.min(1,Math.max(0,+s.opacity));
 if(s.material==='solid')c.fillStyle=s.color;
 else{
  const pattern=c.createPattern(tile(s.material),'repeat');
  const scale=Math.max(.02,((pxPerCm||1)*120/256)/Math.max(.25,+s.repeat||1));
  pattern.setTransform(new DOMMatrix().translate(b.x,b.y).scale(scale));c.fillStyle=pattern;
 }
 c.fillRect(b.x,b.y,b.right-b.x,b.bottom-b.y);
 if(s.shadow>0){
  c.globalAlpha=Math.min(1,+s.shadow)*Math.min(1,+s.opacity);c.strokeStyle='#26303b';
  c.lineJoin='round';c.lineWidth=Math.max(2,(pxPerCm||1)*7);c.shadowColor='#101820';c.shadowBlur=Math.max(3,(pxPerCm||1)*9);c.shadowOffsetX=2;c.shadowOffsetY=3;
  path(c,a.points);c.stroke();
 }
 c.restore();
}
function draw(c){for(const a of areaPolygons)if(a.kind==='surface')paint(c,a);}
function drawDraft(c){
 if(mode!=='surfaceDraw'||window.FP199Exporting)return;
 if(draft.length>=3)paint(c,{points:draft,surface:settings});
 c.save();c.strokeStyle='#fbbf24';c.fillStyle='#fbbf24';c.lineWidth=2/zoom;c.setLineDash([5/zoom,4/zoom]);
 if(draft.length){c.beginPath();draft.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 c.setLineDash([]);for(const p of draft){c.beginPath();c.arc(p.x,p.y,4/zoom,0,Math.PI*2);c.fill();}c.restore();
}
function current(){return areaPolygons.find(a=>a.kind==='surface'&&a.id===selected);}
function change(){
 const a=current();if(a){if(!editBefore)editBefore=cloneEditState();a.surface={...settings};}
 window.draw();
}
function commit(){if(editBefore){commitHistory(editBefore);editBefore=null;}}
const panel=document.createElement('section');panel.id='fp199Panel';panel.hidden=true;
const css=document.createElement('style');css.textContent=`
#fp199Panel[hidden]{display:none!important}#fp199Panel{position:fixed;z-index:5800;left:10px;bottom:48px;width:290px;max-width:calc(100vw - 20px);max-height:65dvh;overflow:auto;background:#0d223b;color:#fff;border:1px solid #53708e;border-radius:14px;padding:12px;box-shadow:0 12px 35px #0006;font:12px Tahoma;box-sizing:border-box;touch-action:pan-y}
#fp199Panel header{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;font-size:15px;font-weight:bold}#fp199Panel button{min-height:34px;padding:5px 8px;background:#193653;color:white;border:1px solid #46617c;border-radius:7px;cursor:pointer;font:inherit}#fp199Panel .row{display:flex;align-items:center;gap:7px;margin:9px 0}#fp199Panel .row label{min-width:73px}#fp199Panel input[type=range]{min-width:50px;width:100%;accent-color:#f7be55}#fp199Panel select{width:100%;background:#193653;color:white;padding:7px;border:1px solid #46617c;border-radius:6px}#fp199Panel .swatches{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}#fp199Panel .swatches button{font-size:10px;padding:3px;min-width:0}#fp199Panel .swatches button.active{border:2px solid #fbbf24}#fp199Panel canvas{display:block;width:100%;height:39px;object-fit:cover;margin-bottom:4px;border-radius:3px}#fp199Panel .actions{display:flex;gap:6px;flex-wrap:wrap}#fp199Panel .actions .primary{background:#c68a28;color:#091829;font-weight:bold}#fp199Panel .hint{font-size:11px;color:#c5d7e9;line-height:1.6}#modernTopToolbar #fp199Tool{position:sticky!important;inset-inline-start:0;z-index:5;color:#fff4c4!important;background:linear-gradient(180deg,#8b601b,#5a3b0e)!important;border:2px solid #f5c45e!important;flex-shrink:0!important}body.fp199-dragging #mainScroll{overflow:hidden!important;touch-action:none!important}body.fp199-dragging .card,body.fp199-dragging aside{touch-action:none!important}
@media(max-width:600px){#fp199Panel{width:250px;bottom:42px;max-height:48dvh;padding:9px}#fp199Panel canvas{height:30px}}
`;document.head.appendChild(css);document.body.appendChild(panel);
function renderPanel(){
 panel.dir=en()?'ltr':'rtl';panel.replaceChildren();
 const header=document.createElement('header');const title=document.createElement('span');title.textContent=t('تلوين وخامات الأرضيات','Floor colors & materials');header.append(title);
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label',t('إغلاق','Close'));close.onclick=()=>{commit();cancel();panel.hidden=true;};header.append(close);panel.append(header);
 const list=document.createElement('select');list.setAttribute('aria-label',t('المساحة','Surface'));const blank=new Option(t('اختر مساحة لتعديلها','Choose a surface to edit'),'');list.add(blank);
 areaPolygons.filter(a=>a.kind==='surface').forEach(a=>list.add(new Option(a.name,a.id)));list.value=current()?selected:'';list.onchange=()=>{commit();selected=list.value||null;if(current())settings=styleOf(current());renderPanel();window.draw();};panel.append(list);
 const actions=document.createElement('div');actions.className='actions row';
 const button=(ar,eng,fn,primary=false)=>{const b=document.createElement('button');b.textContent=t(ar,eng);b.onclick=fn;if(primary)b.className='primary';actions.append(b);return b;};
 button('مساحة جديدة','New surface',begin,true);button('إنهاء ✓','Finish ✓',finish,true).disabled=mode!=='surfaceDraw';button('تراجع نقطة','Undo point',()=>{draft.pop();window.draw();}).disabled=mode!=='surfaceDraw';
 button('إلغاء','Cancel',()=>{cancel();renderPanel();}).disabled=mode!=='surfaceDraw';
 button('حذف المساحة','Delete surface',()=>{const a=current();if(!a)return;commit();const before=cloneEditState();areaPolygons=areaPolygons.filter(x=>x.id!==a.id);selected=null;commitHistory(before);renderPanel();window.draw();}).disabled=!current();panel.append(actions);
 const hint=document.createElement('div');hint.className='hint';hint.textContent=mode==='surfaceDraw'?t('حدد الزوايا بالضغط على الخارطة ثم اضغط إنهاء. اللون والخامة داخل الحدود فقط.','Tap the corners on the plan, then Finish. The finish stays inside the boundary.'):t('اختر مساحة محفوظة أو ارسم مساحة جديدة. الخامات أسفل الأثاث.','Choose a saved surface or draw a new one. Finishes sit below furniture.');panel.append(hint);
 const grid=document.createElement('div');grid.className='swatches';for(const [key,ar,eng] of presets){const b=document.createElement('button');b.classList.toggle('active',settings.material===key);b.title=t(ar,eng);const thumb=document.createElement('canvas');thumb.width=128;thumb.height=64;const tc=thumb.getContext('2d');if(key==='solid'){tc.fillStyle=settings.color;tc.fillRect(0,0,128,64);}else tc.drawImage(tile(key),0,0,128,128);b.append(thumb,document.createTextNode(t(ar,eng)));b.onclick=()=>{commit();settings.material=key;change();commit();renderPanel();};grid.append(b);}panel.append(grid);
 const colorRow=document.createElement('div');colorRow.className='row';const colorLabel=document.createElement('label');colorLabel.textContent=t('اللون','Color');colorLabel.htmlFor='fp199Color';const color=document.createElement('input');color.id='fp199Color';color.type='color';color.value=settings.color;color.oninput=()=>{settings.color=color.value;settings.material='solid';change();};color.onchange=()=>{commit();renderPanel();};colorRow.append(colorLabel,color);panel.append(colorRow);
 for(const [key,ar,eng,min,max,step] of [['opacity','وضوح اللون','Opacity',0,1,.05],['repeat','تكرار الخامة','Repetition',.25,5,.05],['shadow','الظل','Shadow',0,1,.05]]){
  const row=document.createElement('div');row.className='row';const label=document.createElement('label');label.textContent=t(ar,eng);label.htmlFor='fp199-'+key;const input=document.createElement('input');input.id='fp199-'+key;input.type='range';input.min=min;input.max=max;input.step=step;input.value=settings[key];const output=document.createElement('output');const update=()=>output.textContent=key==='repeat'?Number(settings[key]).toFixed(2)+'×':Math.round(settings[key]*100)+'%';update();input.oninput=()=>{settings[key]=+input.value;update();change();};input.onchange=commit;input.onpointercancel=commit;row.append(label,input,output);panel.append(row);
 }
}
function begin(){
 if(!hasPlan()){alert(t('ارفع الخارطة أولاً.','Load a plan first.'));return;}commit();selected=null;draft=[];tap=null;
 activateWorkingTool('surfaceDraw');points=[];areaDraft=[];pendingFurnitureDef=null;clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;panDrag=null;
 targetCursor.style.display='none';hideLiveMeasureBadge();areaResultBadge.style.display='none';syncSelectedPanel();renderPanel();window.draw();
 setStatus(t('حدد زوايا المساحة ثم اضغط إنهاء في لوحة الخامات','Tap the surface corners, then Finish in the materials panel'));
}
function cancel(){draft=[];tap=null;if(mode==='surfaceDraw')activateWorkingTool('select');window.draw();}
function finish(){
 if(mode!=='surfaceDraw')return;
 const area=Math.abs(draft.reduce((s,p,i)=>{const q=draft[(i+1)%draft.length];return s+p.x*q.y-q.x*p.y;},0))/2;
 if(draft.length<3||area<4){setStatus(t('حدد ثلاث زوايا غير واقعة على خط واحد على الأقل','Choose at least three non-collinear corners'));return;}
 const before=cloneEditState(),id=randId();areaPolygons.push({id,kind:'surface',name:t('أرضية ','Floor ')+(areaPolygons.filter(a=>a.kind==='surface').length+1),points:draft.map(p=>({...p})),surface:{...settings},areaM2:0,perimeterM:0});
 selected=id;draft=[];activateWorkingTool('select');commitHistory(before);renderPanel();window.draw();setStatus(t('تم حفظ المساحة؛ عدّل خامتها أو شفافية اللون والظل من اللوحة','Surface saved; adjust its material, opacity and shadow in the panel'));
}
// Capture before legacy viewport panners; surface mode uses only deliberate taps.
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','click','dblclick'])window.addEventListener(type,e=>{
 if(mode!=='surfaceDraw'||e.target!==canvas)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(type==='pointerdown'&&!tap){tap={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId);}catch{}}
 else if(type==='pointermove'&&tap?.id===e.pointerId){if(Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>9)tap.moved=true;}
 else if(type==='pointerup'&&tap?.id===e.pointerId){const good=!tap.moved;tap=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}if(good){const p=clampPointToCanvas(toCanvasPos(e));if(draft.length>=3&&Math.hypot(p.x-draft[0].x,p.y-draft[0].y)<10/zoom)finish();else{draft.push(p);window.draw();}}}
 else if(type==='pointercancel')tap=null;
},{capture:true,passive:false});
window.addEventListener('keydown',e=>{if(mode!=='surfaceDraw'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'){e.preventDefault();cancel();renderPanel();}if(e.key==='Enter'){e.preventDefault();finish();}},true);
// Keep viewport, browser edge auto-scroll and legacy panners still during a drag.
let lock=null;
function freeze(){if(lock)return;lock={left:mainScroll.scrollLeft,top:mainScroll.scrollTop};window.FP199DragLocked=true;panDrag=null;document.body.classList.add('fp199-dragging');}
function unfreeze(){if(!lock)return;mainScroll.scrollLeft=lock.left;mainScroll.scrollTop=lock.top;lock=null;window.FP199DragLocked=false;document.body.classList.remove('fp199-dragging');}
mainScroll.addEventListener('scroll',()=>{if(lock){mainScroll.scrollLeft=lock.left;mainScroll.scrollTop=lock.top;}},{passive:true});
document.addEventListener('dragstart',e=>{if(e.target.closest('aside,.card,.libCard,.fullLibraryShell'))freeze();},true);
document.addEventListener('pointermove',()=>{if(libraryDragActive||touchLibraryDrag||v99LibraryPointerDrag?.dragging||drag)freeze();},true);
for(const type of ['pointerup','pointercancel','dragend','drop'])window.addEventListener(type,()=>setTimeout(unfreeze,0),true);
window.addEventListener('blur',unfreeze);
for(const type of ['wheel','touchmove'])document.addEventListener(type,e=>{if(lock)e.preventDefault();},{capture:true,passive:false});
function install(){}
window.FP199Surfaces={draw,drawDraft,tile,begin:()=>{panel.hidden=false;begin();},cancel};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
[250,1000].forEach(delay=>setTimeout(install,delay));
window.addEventListener('furniplan-language-changed',()=>{install();if(!panel.hidden)renderPanel();});
})();

/* Tiled material catalogue and locally persistent imported patterns. */
(() => {
 'use strict';
 const palette=[['white','أبيض','#eeeae2'],['ivory','عاجي','#e4dfcf'],['cream','كريمي','#deceb0'],['beige','بيج','#cbb798'],['sand','رملي','#c5a576'],['grey','رصاصي','#a2a5a5'],['charcoal','فحمي','#555c61'],['black','أسود','#262d33'],['brown','بني','#876346'],['red','أحمر','#a8554b'],['terra','طوبي','#b17754'],['pink','وردي','#c896a0'],['green','أخضر','#64836e'],['emerald','زمردي','#315e55'],['blue','أزرق','#7295ad'],['navy','كحلي','#3b516f'],['gold','ذهبي','#baa16a'],['violet','بنفسجي','#8e7c98'],['turquoise','فيروزي','#619e9d']];
 const kinds=[['marble','مرمر'],['granite','كرانيت'],['mosaic','موزاييك مربعات'],['terrazzo','موزاييك كسر']];
 const catalogue=kinds.flatMap(([type,label])=>palette.map(([color,name,hex])=>({id:type+'_'+color,name:label+' '+name,type,color:hex})));
 const custom=new Map(),cache=new Map(),pending=new Map();let database=null;
 function make(w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
 function clamp(v){return Math.max(0,Math.min(255,Math.round(v)));}
 function get(key){return custom.get(key)||catalogue.find(x=>x.id===key);}
 function remember(key,value){cache.set(key,value);while(cache.size>16)cache.delete(cache.keys().next().value);return value;}
 const stoneImages=new Map(),stoneLoading=new Set();let stoneRefresh=0;
 function mineral(item,tone){
  const n=512,c=make(n,n),g=c.getContext('2d'),source=stoneImages.get(item.id);
  if(source){
   g.drawImage(source,0,0,n,n);
   if(tone!==item.color){const from=rgb(item.color),to=rgb(tone),image=g.getImageData(0,0,n,n);for(let i=0;i<image.data.length;i+=4)for(let j=0;j<3;j++)image.data[i+j]=clamp(image.data[i+j]+to[j]-from[j]);g.putImageData(image,0,0);}
  }else{
   g.fillStyle=tone;g.fillRect(0,0,n,n);
   if(!stoneLoading.has(item.id)){stoneLoading.add(item.id);const image=new Image();image.onload=()=>{stoneImages.set(item.id,image);if(!stoneRefresh)stoneRefresh=setTimeout(()=>{stoneRefresh=0;changed();},40);};image.onerror=()=>{stoneLoading.delete(item.id);};image.src='assets/materials212/'+item.id+'.png';}
  }
  c.fpTileResolution=n;return c;
 }
 function tile(id,options={}){
  const item=get(id),tone=options.materialTone||item?.color;
  const grout=/^#[0-9a-f]{6}$/i.test(options.groutColor||'')?options.groutColor:'#c9c4ba',width=Math.max(0,Math.min(10,Number(options.groutWidth??2)));
  const key=[id,tone,grout,width,options.layout||'square'].join(':');if(cache.has(key))return cache.get(key);
  let c=make(),g=c.getContext('2d');
  if(item?.type==='custom'){
   if(!item.canvas){register(item);return window.FP199Surfaces.tile('cream');}
   // Preserve the image's aspect ratio in a repeatable tile.
   c=make(item.canvas.width,item.canvas.height);g=c.getContext('2d');g.drawImage(item.canvas,0,0);
  }else if(item&&(item.type==='marble'||item.type==='granite')){
   c=mineral(item,/^#[0-9a-f]{6}$/i.test(tone||'')?tone:item.color);g=c.getContext('2d');
  }else if(item){
   const base=rgb(/^#[0-9a-f]{6}$/i.test(tone||'')?tone:item.color),r=rng([...id].reduce((a,b)=>a+b.charCodeAt(0),83));
   const image=g.createImageData(256,256),dark=(base[0]+base[1]+base[2])/3<110;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=x*Math.PI/128,v=y*Math.PI/128,noise=(r()-.5)*(item.type==='granite'?30:8);
    const flow=u+v+.7*Math.sin(u+2*v)+.27*Math.sin(3*u-2*v)+.13*Math.sin(7*u+4*v)+.05*Math.sin(19*u-9*v);
    const veins=(Math.exp(-Math.abs(Math.sin(flow))*60)*40+Math.exp(-Math.abs(Math.sin(flow*3+.4*Math.sin(4*v)))*120)*16)*(dark?1:-1);
    const shade=noise+(item.type==='marble'?veins+5*Math.sin(u+Math.cos(v)*2):0),i=(y*256+x)*4;
    for(let j=0;j<3;j++)image.data[i+j]=clamp(base[j]+shade);image.data[i+3]=255;
   }g.putImageData(image,0,0);
   if(item.type==='granite'){
    for(let i=0;i<5800;i++){
     const x=r()*256,y=r()*256,size=.3+r()*2.3,d=(r()-.5)*135;g.fillStyle='rgba('+base.map(v=>clamp(v+d)).join(',')+','+(.25+r()*.65)+')';
     g.beginPath();g.moveTo(x,y);g.lineTo(x+size,y+size*.2);g.lineTo(x+size*.7,y+size*1.4);g.lineTo(x-size*.3,y+size*.8);g.closePath();g.fill();
    }
   }
   if(item.type==='terrazzo'){
    const chips=['#f2ece0','#383d40','#b88666','#c0b59b','#91a4a0'];
    for(let i=0;i<720;i++){const x=r()*256,y=r()*256,size=1.5+r()*6;g.fillStyle=chips[Math.floor(r()*chips.length)];g.globalAlpha=.45+r()*.5;g.beginPath();g.moveTo(x-size*.4,y-size*.3);g.lineTo(x+size*.6,y-size*.4);g.lineTo(x+size*.8,y+size*.35);g.lineTo(x,y+size*.65);g.lineTo(x-size*.6,y+size*.1);g.closePath();g.fill();}g.globalAlpha=1;
   }
   if(item.type==='mosaic'){
    const cell=32;g.fillStyle=grout;g.fillRect(0,0,256,256);
    for(let y=0;y<256;y+=cell)for(let x=0;x<256;x+=cell){const d=(r()-.5)*54;g.fillStyle='rgb('+base.map(v=>clamp(v+d)).join(',')+')';g.fillRect(x+1,y+1,cell-2,cell-2);g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=.7;g.strokeRect(x+1.5,y+1.5,cell-3,cell-3);}
   }
  }else g.drawImage(window.FP199Surfaces.tile(id),0,0);
  const resolution=c.fpTileResolution||256;
  if(options.layout==='brick'){
   const arranged=make(c.width*2,c.height*2),a=arranged.getContext('2d');
   a.drawImage(c,0,0);a.drawImage(c,c.width,0);a.drawImage(c,-c.width/2,c.height);a.drawImage(c,c.width/2,c.height);a.drawImage(c,c.width*1.5,c.height);c=arranged;
  }
  c.fpTileResolution=resolution;return remember(key,c);
 }
 function changed(){cache.clear();window.FP201ColorLayers?.invalidate();if(typeof draw==='function')draw();window.dispatchEvent(new Event('furniplan-materials-changed'));}
 function register(item){
  if(!item||!/^data:image\/(png|jpeg|webp);base64,/.test(item.src||''))return Promise.resolve();
  const existing=custom.get(item.id);if(existing?.src===item.src&&existing.canvas)return Promise.resolve(existing);if(pending.has(item.id))return pending.get(item.id);
  const data={id:item.id,name:String(item.name||'باترن خاص').slice(0,90),src:item.src,type:'custom'};custom.set(data.id,data);
  const promise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const scale=Math.min(1,512/Math.max(im.naturalWidth,im.naturalHeight)),c=make(Math.max(1,Math.round(im.naturalWidth*scale)),Math.max(1,Math.round(im.naturalHeight*scale)));c.getContext('2d').drawImage(im,0,0,c.width,c.height);data.canvas=c;pending.delete(data.id);changed();resolve(data);};im.onerror=()=>{pending.delete(data.id);reject(new Error('تعذر فتح صورة الباترن'));};im.src=data.src;});pending.set(data.id,promise);return promise;
 }
 function db(){
  if(database)return database;
  database=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('حفظ الخامات غير متاح في هذا المتصفح'));return;}const request=indexedDB.open('FurniPlanCustomPatternsV203',1);request.onupgradeneeded=()=>request.result.createObjectStore('patterns',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return database;
 }
 async function save(item){const database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction('patterns','readwrite');tx.objectStore('patterns').put({id:item.id,name:item.name,src:item.src,type:'custom'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
 async function importFile(file){
  if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('اختر صورة PNG أو JPG أو WEBP.');if(file.size>20*1024*1024)throw Error('اختر صورة أصغر من 20 ميغابايت.');
  const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('تعذر قراءة الصورة'));reader.readAsDataURL(file);});
  const im=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('تعذر فتح الصورة'));image.src=src;});
  const scale=Math.min(1,512/Math.max(im.naturalWidth,im.naturalHeight)),c=make(Math.max(1,Math.round(im.naturalWidth*scale)),Math.max(1,Math.round(im.naturalHeight*scale)));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const item={id:'custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),name:file.name.replace(/\.[^.]+$/,'').slice(0,90),src:c.toDataURL('image/png'),type:'custom',canvas:c};
  await save(item);custom.set(item.id,item);changed();return item;
 }
 async function restore(){try{const database=await db();const values=await new Promise((resolve,reject)=>{const req=database.transaction('patterns','readonly').objectStore('patterns').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});await Promise.allSettled(values.map(register));}catch(e){/* Import reports storage errors; built-in materials remain usable. */}}
 window.FP203Materials={tile,get,list:()=>[...catalogue,...custom.values()],importFile,register,ready:()=>Promise.allSettled([...pending.values()]),embedded:id=>{const v=custom.get(id);return v?{id:v.id,name:v.name,src:v.src}:null;}};
 restore();
})();

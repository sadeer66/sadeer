'use strict';
(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('تعذرت قراءة خارطة الأثاث'));im.src=src});
 let inherited=null;
 const identity=()=>JSON.stringify([bgData,dxfModel,canvas.width,canvas.height]);
 function guard(){if(points.length||areaDraft.length||window.FP198Boundary?.isActive()||drag||measureDrag||mapLabelDrag)throw Error('ثبّت القياس أو العملية الحالية في الأثاث أولًا');}
 function baseRaster(){
  if(bgData&&!dxfModel)return bgData;
  const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;
  const q=out.getContext('2d');q.fillStyle='#fff';q.fillRect(0,0,out.width,out.height);
  if(bgImage)q.drawImage(bgImage,0,0,out.width,out.height);
  else if(dxfModel){const toggles=['furnitureLayerToggle','measureLayerToggle','mapLabelLayerToggle','gridToggle','autoDimsToggle'],values=toggles.map(id=>document.getElementById(id).checked);const layers=window.FP201ColorLayers?.serialize()||[];try{toggles.forEach(id=>document.getElementById(id).checked=false);window.FP201ColorLayers?.load([]);draw();q.drawImage(canvas,0,0)}finally{toggles.forEach((id,i)=>document.getElementById(id).checked=values[i]);window.FP201ColorLayers?.load(layers);draw()}}
  return out.toDataURL('image/png');
 }
 window.SESStage={
  id:'furni',
  async capture(preview=true){
   guard();let project;const old=download,library=furniture;
   try{furniture=[];download=(name,data)=>{project=JSON.parse(data)};document.getElementById('saveBtn').onclick()}finally{download=old;furniture=library}
   if(!project)throw Error('تعذّر تجميع بيانات مرحلة الأثاث');
   // Placed objects carry their own source and properties; bundled library stays in this copied app.
   delete project.library;
   const signature=identity();return {native:project,map:hasPlan()?{key:inherited?.signature===signature?inherited.key:await parent.SESCore.digest(signature),width:canvas.width,height:canvas.height,pxPerCm:ppcm(),image:preview?baseRaster():null}:null};
  },
  async restore(p){
   if(!p?.canvas||!Array.isArray(p.items))throw Error('بيانات مرحلة الأثاث غير صالحة');
   const loaded=p.bgData?await image(p.bgData):null;
   bgImage=loaded;bgData=p.bgData||null;dxfModel=copy(p.dxfModel||null);canvas.width=p.canvas.width;canvas.height=p.canvas.height;pxPerCm=p.pxPerCm||null;
   if(dxfModel)rebuildDxfSnapGeometry();else{dxfSnapSegments=[];dxfSnapKeyPoints=[];dxfActiveSnap=null}
   items=copy(p.items||[]);items.forEach(ensureSpriteForDef);measurements=copy(p.measurements||[]);mapLabels=copy(p.mapLabels||[]);areaPolygons=copy(p.areaPolygons||[]);projectMeta=copy(p.projectMeta||{});
   window.FP201ColorLayers?.load(p.colorLayers||[]);FP197Shadow.set(p.shadowSettings||{});FP197Labels.set(FP206LegacyLabels(p.labelStyle));FP206Measures.set(p.measureStyle||{});window.FP226Text?.set(p.furnitureTextStyle||{});window.FP209Labels?.restore(p.customLabelNames||[]);
   const vm={grid:'gridToggle',dims:'dimsToggle',labels:'labelsToggle',shadow:'shadowToggle',snap:'snapToggle',autoDims:'autoDimsToggle',bg:'bgLayerToggle',furniture:'furnitureLayerToggle',measures:'measureLayerToggle',mapLabels:'mapLabelLayerToggle',measureArrows:'measureArrowsToggle',furnitureSummary:'furnitureSummaryToggle',measureLock:'measureLockToggle',mapLabelLock:'mapLabelLockToggle'};
   for(const [k,id]of Object.entries(vm))if(k in(p.view||{}))document.getElementById(id).checked=!!p.view[k];
   zoom=p.zoom||1;measureDisplayScale=p.measureDisplayScale||1;mapLabelDisplayScale=p.mapLabelDisplayScale||1;selectedId=null;selectedIds=[];selectedMeasureId=null;selectedMapLabelId=null;points=[];areaDraft=[];mode='select';undoStack=[];redoStack=[];
   inherited=p.sharedKey?{key:p.sharedKey,signature:identity()}:null;updateScaleUI();updateStageSize();updateHistoryButtons();syncQuickDisplayButtons();syncSelectedPanel();draw();fitToViewportSoon();
  },
  async applyShared(map,replace=false){
   if(!map?.image)throw Error('لا توجد صورة خارطة للنقل');const loaded=await image(map.image);
   if(replace){items=[];measurements=[];mapLabels=[];areaPolygons=[];window.FP201ColorLayers?.clear()}
   bgImage=loaded;bgData=map.image;dxfModel=null;dxfSnapSegments=[];dxfSnapKeyPoints=[];dxfActiveSnap=null;canvas.width=map.width;canvas.height=map.height;pxPerCm=map.pxPerCm||null;points=[];selectedId=null;selectedIds=[];mode='select';
   inherited={key:map.key,signature:identity()};undoStack=[];redoStack=[];updateHistoryButtons();updateScaleUI();updateStageSize();syncSelectedPanel();draw();fitToViewportSoon();setStatus('خارطة SES التجريبية — تم نقل الصورة والمعايرة');
  },
  setCalibration(value){pxPerCm=value>0?value:null;updateScaleUI();draw()},
  refresh(){fitToViewportSoon()},
  bindKey(key){inherited={key,signature:identity()}}
 };
 function ppcm(){return Number.isFinite(pxPerCm)&&pxPerCm>0?pxPerCm:null}
})();

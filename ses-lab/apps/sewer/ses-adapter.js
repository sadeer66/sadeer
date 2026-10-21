'use strict';
(()=>{
 const id=document.documentElement.dataset.sesStage,copy=x=>JSON.parse(JSON.stringify(x));
 const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('تعذرت قراءة خارطة المرحلة'));im.src=src});
 const initialNetwork=copy(window.SewerPlan.snapshot(false));let inherited=null;
 const identity=()=>JSON.stringify([bgData,dxfModel,canvas.width,canvas.height]);
 const views={grid:'gridToggle',dims:'dimsToggle',labels:'labelsToggle',shadow:'shadowToggle',snap:'snapToggle',autoDims:'autoDimsToggle',bg:'bgLayerToggle',furniture:'furnitureLayerToggle',measures:'measureLayerToggle',mapLabels:'mapLabelLayerToggle',measureArrows:'measureArrowsToggle',furnitureSummary:'furnitureSummaryToggle',measureLock:'measureLockToggle',mapLabelLock:'mapLabelLockToggle'};
 function guard(){const session=window.SewerToolSession;if(window.ElectricalLayout?.active||points.length||areaDraft.length||drag||measureDrag||mapLabelDrag||window.SewerPlan.isDrawing()||session?.active&&!session.moveArmed)throw Error('ثبّت العملية الحالية بعلامة ✓ داخل البرنامج أولًا');}
 function baseRaster(){if(bgData&&!dxfModel)return bgData;const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const previous=ctx;try{ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);if(dxfModel)drawDxfVector();else if(bgImage)ctx.drawImage(bgImage,0,0,out.width,out.height)}finally{ctx=previous}return out.toDataURL('image/png')}
 function network(raw){const s={...copy(initialNetwork),...copy(raw||{}),items:copy(items),drawing:false,draft:null};window.SewerPlan.restoreSnapshot(s);window.SewerEngineering.importData(raw?.engineering||{activeView:'realistic',symbols:[]},true)}
 function loadExtras(p){window.SewerColorGuide?.load(p.colorGuide);window.SewerOpacity?.load(p.opacityLayers);window.SewerColorLayers?.load(p.colorLayers||[]);window.ElectricalEffects?.load(p.electricalEffects);window.ElectricalMapAppearance?.load(p.mapAppearance);window.ElectricalLayout?.load(p.electricalLayout);}
 window.SESStage={
  id,
  async capture(preview=true){guard();const project={version:74,projectMeta:copy(projectMeta),brandInfo:copy(brandInfo),bgData,dxfModel:copy(dxfModel),pxPerCm,items:copy(items),measurements:copy(measurements),mapLabels:copy(mapLabels),areaPolygons:copy(areaPolygons),zoom,measureDisplayScale,mapLabelDisplayScale,canvas:{width:canvas.width,height:canvas.height},view:Object.fromEntries(Object.entries(views).map(([key,dom])=>[key,!!document.getElementById(dom)?.checked])),sewerPlan:{...window.SewerPlan.snapshot(false),engineering:window.SewerEngineering.exportData()},colorGuide:window.SewerColorGuide?.serialize(),opacityLayers:window.SewerOpacity?.serialize(),colorLayers:window.SewerColorLayers?.serialize(),electricalEffects:window.ElectricalEffects?.serialize(),mapAppearance:window.ElectricalMapAppearance?.serialize(),electricalLayout:window.ElectricalLayout?.serialize()};
   const signature=identity();return {native:copy(project),map:hasPlan()?{key:inherited?.signature===signature?inherited.key:await parent.SESCore.digest(signature),width:canvas.width,height:canvas.height,pxPerCm:pxPerCm>0?pxPerCm:null,image:preview?baseRaster():null}:null};
  },
  async restore(p){if(!p?.canvas||!Array.isArray(p.items))throw Error('بيانات المرحلة غير صالحة');const loaded=p.bgData?await image(p.bgData):null;
   window.SewerToolSession?.end(false);bgImage=loaded;bgData=p.bgData||null;dxfModel=copy(p.dxfModel||null);canvas.width=p.canvas.width;canvas.height=p.canvas.height;pxPerCm=p.pxPerCm>0?p.pxPerCm:null;
   if(dxfModel)rebuildDxfSnapGeometry();else{dxfSnapSegments=[];dxfSnapKeyPoints=[];dxfActiveSnap=null}
   items=copy(p.items);items.forEach(ensureSpriteForDef);measurements=copy(p.measurements||[]);mapLabels=copy(p.mapLabels||[]);areaPolygons=copy(p.areaPolygons||[]);projectMeta=copy(p.projectMeta||{});if(p.brandInfo){brandInfo=copy(p.brandInfo);refreshCompanyLogo()}
   network(p.sewerPlan);loadExtras(p);for(const[key,dom]of Object.entries(views)){const el=document.getElementById(dom);if(el&&key in(p.view||{}))el.checked=!!p.view[key]}
   zoom=p.zoom||1;measureDisplayScale=p.measureDisplayScale||1;mapLabelDisplayScale=p.mapLabelDisplayScale||1;points=[];areaDraft=[];selectedId=null;selectedIds=[];selectedMeasureId=null;selectedMapLabelId=null;mode='select';undoStack=[];redoStack=[];
   inherited=p.sharedKey?{key:p.sharedKey,signature:identity()}:null;updateScaleUI();updateStageSize();updateHistoryButtons();syncQuickDisplayButtons();syncSelectedPanel();draw();fitToViewportSoon();
  },
  async applyShared(map,replace=false){if(!map?.image)throw Error('لا توجد صورة خارطة للنقل');const loaded=await image(map.image);if(replace){window.SewerToolSession?.end(false);items=[];measurements=[];mapLabels=[];areaPolygons=[];network(null);loadExtras({})}
   bgImage=loaded;bgData=map.image;dxfModel=null;dxfSnapSegments=[];dxfSnapKeyPoints=[];dxfActiveSnap=null;canvas.width=map.width;canvas.height=map.height;pxPerCm=map.pxPerCm>0?map.pxPerCm:null;points=[];areaDraft=[];mode='select';selectedId=null;selectedIds=[];undoStack=[];redoStack=[];inherited={key:map.key,signature:identity()};updateScaleUI();updateStageSize();updateHistoryButtons();syncSelectedPanel();draw();fitToViewportSoon();
  },
  setCalibration(value){pxPerCm=value>0?value:null;updateScaleUI();draw()},refresh(){fitToViewportSoon()},bindKey(key){inherited={key,signature:identity()}}
 };
})();

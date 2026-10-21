'use strict';
(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('تعذرت قراءة خارطة التلوين'));im.src=src});
 let inherited=null;const cleanSettings=copy(settings);
 const identity=()=>JSON.stringify([imgUrl,dxfLines,imgW,imgH]);
 function guard(){if(pendingMagic||drawing.length||calibrationActive||wallPick||rayStart||rayDrafts.length||widthPick||typeof openSession68!=='undefined'&&openSession68||typeof decorSession71!=='undefined'&&decorSession71||typeof brushSession72!=='undefined'&&brushSession72)throw Error('ثبّت التحديد أو المعايرة الحالية في التلوين أولًا');}
 window.SESStage={
  id:'color',
  async capture(preview=true){
   guard();const project=copy(projectSaveData());const signature=identity();
   return {native:{project,camera:{scale,offsetX,offsetY,view}},map:img||dxfLines.length?{key:inherited?.signature===signature?inherited.key:await parent.SESCore.digest(signature),width:imgW,height:imgH,pxPerCm:settings.tileCalibration?1/settings.tileCmPerUnit:null,image:preview?renderExport():null}:null};
  },
  async restore(state){
   const p=state.project;if(!p||!['Smart Render','ColorPlan'].includes(p.app)||!Number.isFinite(p.width)||!Number.isFinite(p.height))throw Error('بيانات مرحلة التلوين غير صالحة');
   const loaded=p.image?await image(p.image):null;
   img=loaded;imgUrl=p.image||null;imgW=p.width;imgH=p.height;dxfLines=copy(p.dxfLines||[]);polys=copy(p.polys||[]);settings=copy(p.settings);layerDefinitions=copy(p.layers||[]);selected=-1;drawing=[];undoStack=[];redoStack=[];
   if(p.gapTolerance!==undefined)gapSlider.value=p.gapTolerance;
   normalizeLayerColors();layerOptions();renderLayers();syncAdvancedRealismUI();syncTilesUI();refreshList();showEffectControls();$('empty').style.display=img||dxfLines.length?'none':'';fit();
   if(state.camera){scale=state.camera.scale;offsetX=state.camera.offsetX;offsetY=state.camera.offsetY;view=state.camera.view||'real';draw()}
   $('fileinfo').textContent='مشروع SES — '+imgW+' × '+imgH+' · '+(settings.tileCalibration?'المعايرة محفوظة':'يحتاج معايرة');
   inherited=state.sharedKey?{key:state.sharedKey,signature:identity()}:null;
  },
  async applyShared(map){
   if(!map?.image)throw Error('لا توجد صورة خارطة للنقل');
   const loaded=await image(map.image);img=loaded;imgUrl=map.image;imgW=map.width;imgH=map.height;dxfLines=[];polys=[];selected=-1;drawing=[];undoStack=[];redoStack=[];
   settings=copy(cleanSettings);this.setCalibration(map.pxPerCm);inherited={key:map.key,signature:identity()};
   $('fileinfo').textContent='خارطة SES — '+imgW+' × '+imgH;refreshList();syncAdvancedRealismUI();syncTilesUI();$('empty').style.display='none';fit();show('تم نقل الخارطة والمعايرة من مشروع SES التجريبي');
  },
  setCalibration(ppcm){if(ppcm>0){settings.tileCmPerUnit=1/ppcm;settings.tileCalibration={a:{x:0,y:0},b:{x:100,y:0},cm:100/ppcm}}else settings.tileCalibration=null;syncTilesUI();draw()},
  refresh(){fit()},
  bindKey(key){inherited={key,signature:identity()}}
 };
})();

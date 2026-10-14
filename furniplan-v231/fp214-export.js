/* V214: one-sheet, orientation-aware layouts with print-size typography. */
(() => {
 'use strict';
 const en=()=>window.FurniPlanLanguage?.get?.()==='en';
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);return c;};
 function scheduleLayout(w,h,n,font){
  let best=null;
  for(let cols=1;cols<=Math.max(1,n);cols++){
   const rows=Math.ceil(n/cols),cw=(w-24-(cols-1)*8)/cols,ch=(h-60-(rows-1)*8)/rows;
   const score=Math.min(cw/(font*6.6),ch/(font*3.6));
   if(!best||score>best.score)best={cols,rows,cw,ch,score};
  }
  return best;
 }
 function layout(w,h,pw,ph,n,font){
  const gap=16,vertical=ph>pw;
  if(!n)return {plan:{x:0,y:0,w,h},guide:null};
  let best;
  for(let fraction=.22;fraction<=.481;fraction+=.02){
   const guide=vertical?{x:w*(1-fraction)+gap,y:0,w:w*fraction-gap,h}:{x:0,y:h*(1-fraction)+gap,w,h:h*fraction-gap};
   const plan=vertical?{x:0,y:0,w:w*(1-fraction),h}:{x:0,y:0,w,h:h*(1-fraction)};
   const grid=scheduleLayout(guide.w,guide.h,n,font),fit=Math.min((plan.w-20)/pw,(plan.h-20)/ph);
   const score=Math.min(1,grid.score)*4+fit/Math.min(w/pw,h/ph);
   if(!best||score>best.score)best={plan,guide,grid,score};
  }
  // Give half the previous guide allocation back to the map.
  if(vertical){best.guide.w/=2;best.guide.x=w-best.guide.w;best.plan.w=best.guide.x-gap;}
  else{best.guide.h/=2;best.guide.y=h-best.guide.h;best.plan.h=best.guide.y-gap;}
  best.grid=scheduleLayout(best.guide.w,best.guide.h,n,font);
  return best;
 }
 async function schedule(w,h,groups,font){
  const out=make(w,h),c=out.getContext('2d'),grid=scheduleLayout(w,h,groups.length,font);
  c.fillStyle='#f1f5f9';c.fillRect(0,0,w,h);c.fillStyle='#0f172a';c.fillRect(0,0,w,46);c.fillStyle='#fff';c.font=`bold ${font}px Tahoma`;c.textAlign='center';c.textBaseline='middle';c.fillText(en()?'Furniture · dimensions in cm':'الأثاث · القياسات بالسم',w/2,23,w-16);
  const images=await Promise.all(groups.map(g=>g.src?makeFurnitureGuideVisual(g):null));
  const actualFont=Math.min(font,grid.cw/6.6,grid.ch/3.6);
  for(let i=0;i<groups.length;i++){
   const g=groups[i],x=12+(grid.cols-1-i%grid.cols)*(grid.cw+8),y=54+Math.floor(i/grid.cols)*(grid.ch+8),cw=grid.cw,ch=grid.ch;
   c.fillStyle='#fff';c.fillRect(x,y,cw,ch);c.strokeStyle='#cbd5e1';c.strokeRect(x,y,cw,ch);
   const im=images[i],iy=y+6,ih=Math.max(4,ch-actualFont*2.5-14);
   if(im){const sc=Math.min((cw-12)/im.width,ih/im.height);c.drawImage(im,x+(cw-im.width*sc)/2,iy+(ih-im.height*sc)/2,im.width*sc,im.height*sc);}
   c.fillStyle='#0f172a';c.font=FP197Labels.font(actualFont*.78);c.textAlign='center';c.fillText(String(g.name||''),x+cw/2,y+ch-actualFont*1.6,cw-12);
   c.font=FP206Measures.font(actualFont);c.fillText(`${formatCardCm(g.w)} × ${formatCardCm(g.h)}`,x+cw/2,y+ch-actualFont*.55,cw-10);
   if(g.count>1){c.fillStyle='#0f766e';c.fillRect(x+3,y+3,actualFont*2,actualFont*1.1);c.fillStyle='#fff';c.font=`bold ${actualFont*.75}px Tahoma`;c.fillText('×'+g.count,x+3+actualFont,y+3+actualFont*.55);}
  }
  out.fpSmallText=actualFont<font*.9;return out;
 }
 const oldCapture=captureCleanPlanCanvas;
 function capture(){
  const old=window.FP199Exporting;window.FP199Exporting=true;
  try{return oldCapture({includeScaleBar:false});}finally{window.FP199Exporting=old;draw();}
 }
 window.buildBrandedSheet=async function({paper='A4',orient='landscape',title='',mapTitle='',client='',location='',planCanvas=null,showProjectMeta=true}={}){
  await window.FP203Materials?.ready();
  await Promise.all([FP197Labels.ready(),FP206Measures.ready()]);
  let plan=planCanvas||capture();
  // Preserve complete map edges and dimensions rather than cropping pale content.
  const size=paperPixels(paper,orient),sheet=make(size.w,size.h),c=sheet.getContext('2d'),dpi=size.w/(orient==='portrait'?(paper==='A3'?297:210):(paper==='A3'?420:297))*25.4,font=8*dpi/72;
  const margin=40,header=150,footer=50,gap=18,body={x:margin,y:margin+header+gap,w:size.w-margin*2,h:size.h-margin*2-header-footer-gap*2};
  const groups=usedFurnitureGroups(),boxes=layout(body.w,body.h,plan.width,plan.height,groups.length,font);
  const pb=boxes.plan,fit=Math.min((pb.w-20)/plan.width,(pb.h-20)/plan.height);
  c.fillStyle='#fff';c.fillRect(0,0,size.w,size.h);c.fillStyle='#0f172a';c.fillRect(margin,margin,body.w,header);
  const logo=await loadDataImage(brandInfo.logoData||PRINT_LOGO_DATA),ls=Math.min(140/logo.width,110/logo.height);c.drawImage(logo,margin+18,margin+(header-logo.height*ls)/2,logo.width*ls,logo.height*ls);
  c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.font=`bold ${font*1.45}px Tahoma`;c.fillText(title||(en()?'New Project':'مشروع جديد'),size.w/2,margin+55,body.w*.46);c.font=`${font}px Tahoma`;c.fillText(mapTitle,size.w/2,margin+105,body.w*.46);
  if(showProjectMeta){c.textAlign='right';c.font=`${font*.8}px Tahoma`;const lines=[client,location,new Date().toLocaleDateString(en()?'en-GB':'ar-IQ')].filter(Boolean);lines.forEach((s,i)=>c.fillText(s,size.w-margin-18,margin+35+i*32,body.w*.24));}
  c.strokeStyle='#94a3b8';c.lineWidth=1;c.strokeRect(body.x,body.y,body.w,body.h);
  const dw=plan.width*fit,dh=plan.height*fit,dx=body.x+pb.x+(pb.w-dw)/2,dy=body.y+pb.y+(pb.h-dh)/2;c.drawImage(plan,dx,dy,dw,dh);
  if(pxPerCm){const bar=100*pxPerCm*fit;if(bar>=35&&bar<pb.w*.7)drawExportScaleBar(c,body.x+pb.x+16,body.y+pb.y+pb.h-18,bar,font*.85);}
  if(boxes.guide){const b=boxes.guide,guide=await schedule(b.w,b.h,groups,font);c.drawImage(guide,body.x+b.x,body.y+b.y,b.w,b.h);sheet.fpSmallText=guide.fpSmallText;}
  c.fillStyle='#475569';c.textAlign='left';c.font=`${font*.85}px Tahoma`;c.fillText([brandInfo.companyName,brandInfo.address,brandInfo.email].filter(Boolean).join(' • '),margin,size.h-margin-10,body.w*.70);c.textAlign='right';c.fillText(`${paper} · FurniPlan V221`,size.w-margin,size.h-margin-10);
  if(sheet.fpSmallText){c.textAlign='center';c.font=`bold ${font*.8}px Tahoma`;c.fillText(en()?'For this many items, use A3 for clearer dimensions.':'لهذا العدد من القطع، اختر A3 لقراءة أوضح للأرقام.',size.w/2,size.h-margin-40);}
  return sheet;
 };
 function autoOrientation(){return canvas.height>canvas.width?'portrait':'landscape';}
 const oldPrint=openPrintDialog;openPrintDialog=function(){oldPrint.apply(this,arguments);printOrientation.value=autoOrientation();};
 const oldExport=openExportDialog;openExportDialog=function(){oldExport.apply(this,arguments);pngOrientation.value=autoOrientation();};
 document.getElementById('exportBtn').onclick=()=>openExportDialog();
 window.FP214Export={layout,scheduleLayout};
})();

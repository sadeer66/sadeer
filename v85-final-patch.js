
// ===== FurniPlan V85 Final Runtime Patch =====
(function(){
  const style=document.createElement('style');
  style.textContent=`
  .usedFurniturePanel{height:132px!important;max-height:none!important;width:calc(100% - 96px)!important;max-width:calc(100% - 96px)!important;margin-right:88px!important;margin-left:8px!important;overflow:visible!important;box-sizing:border-box!important;position:relative!important;z-index:4!important;padding-bottom:7px!important}
  .usedFurnitureGrid{display:flex!important;flex-wrap:nowrap!important;height:100px!important;max-height:100px!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;padding:2px 4px 12px!important;box-sizing:border-box!important;scrollbar-width:auto!important;scrollbar-color:#64748b #dbe3ec!important;scrollbar-gutter:stable both-edges!important;cursor:grab!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important}
  .usedFurnitureGrid:active{cursor:grabbing!important}.usedFurnitureGrid::-webkit-scrollbar{height:14px!important;display:block!important}.usedFurnitureGrid::-webkit-scrollbar-track{background:#dbe3ec!important;border-radius:8px!important;border:1px solid #cbd5e1!important}.usedFurnitureGrid::-webkit-scrollbar-thumb{background:#64748b!important;border-radius:8px!important;border:2px solid #dbe3ec!important}.usedFurnitureGrid::-webkit-scrollbar-thumb:hover{background:#475569!important}.usedFurnitureCard{flex:0 0 112px!important}
  @media(max-width:900px){.usedFurniturePanel{width:calc(100% - 82px)!important;max-width:calc(100% - 82px)!important;margin-right:74px!important;margin-left:8px!important}}`;
  document.head.appendChild(style);

  function upsert(selector,make){let el=document.querySelector(selector);if(!el){el=make();document.head.appendChild(el)}return el}
  let a=upsert('link[rel="apple-touch-icon"]',()=>document.createElement('link'));a.rel='apple-touch-icon';a.sizes='180x180';a.href='apple-touch-icon.png?v=85';
  let f=upsert('link[rel="icon"][sizes="32x32"]',()=>document.createElement('link'));f.rel='icon';f.type='image/png';f.sizes='32x32';f.href='favicon-32.png?v=85';
  let m=upsert('link[rel="manifest"]',()=>document.createElement('link'));m.rel='manifest';m.href='manifest.webmanifest?v=85';
  const metas=[['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-title','FurniPlan'],['theme-color','#0f172a']];
  for(const [name,content] of metas){let x=document.querySelector(`meta[name="${name}"]`);if(!x){x=document.createElement('meta');x.name=name;document.head.appendChild(x)}x.content=content}

  window.captureCleanPlanCanvas=function(opts={}){
    const oldIds=selectedIds.slice(),oldId=selectedId,oldMeasure=selectedMeasureId,oldMapLabel=selectedMapLabelId,oldGuides=snapGuides.slice();
    const auto=document.getElementById('autoDimsToggle'),oldAuto=auto.checked;
    clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;snapGuides=[];auto.checked=false;draw();
    const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const oc=out.getContext('2d');oc.drawImage(canvas,0,0);
    if(opts.includeScaleBar!==false&&pxPerCm){const len=100*pxPerCm,x=28,y=out.height-34;oc.strokeStyle='#111';oc.fillStyle='#111';oc.lineWidth=Math.max(2,out.width/900);oc.beginPath();oc.moveTo(x,y);oc.lineTo(x+len,y);oc.stroke();oc.beginPath();oc.moveTo(x,y-7);oc.lineTo(x,y+7);oc.moveTo(x+len,y-7);oc.lineTo(x+len,y+7);oc.stroke();oc.font=`bold ${Math.max(12,out.width/95)}px Tahoma`;oc.textAlign='center';oc.fillText('1 متر',x+len/2,y-10)}
    selectedIds=oldIds;selectedId=oldId;selectedMeasureId=oldMeasure;selectedMapLabelId=oldMapLabel;snapGuides=oldGuides;auto.checked=oldAuto;draw();return out;
  };

  window.cropPlanCanvasForPrint=function(src){try{const w=src.width,h=src.height;if(w<80||h<80)return src;const c=src.getContext('2d',{willReadFrequently:true}),d=c.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=-1,maxY=-1;const step=Math.max(1,Math.floor(Math.min(w,h)/900));for(let y=0;y<h;y+=step){for(let x=0;x<w;x+=step){const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a<30)continue;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),lum=(r*299+g*587+b*114)/1000;if(lum<150||(mx-mn>38&&lum<225)){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}}if(maxX<minX||maxY<minY)return src;const bw=maxX-minX,bh=maxY-minY;if(bw<w*.18||bh<h*.18)return src;const padX=Math.max(18,Math.round(bw*.045)),padY=Math.max(18,Math.round(bh*.045));minX=Math.max(0,minX-padX);maxX=Math.min(w-1,maxX+padX);minY=Math.max(0,minY-padY);maxY=Math.min(h-1,maxY+padY);const cw=maxX-minX+1,ch=maxY-minY+1,out=document.createElement('canvas');out.width=cw;out.height=ch;out.getContext('2d').drawImage(src,minX,minY,cw,ch,0,0,cw,ch);return out}catch(e){return src}};

  window.renderFurnitureScheduleCanvas=async function(targetWidth,opts={}){
    const groups=usedFurnitureGroups();if(!groups.length)return null;if(!opts.force&&!furnitureSummaryVisible())return null;
    const vertical=(opts.layout||'horizontal')==='vertical',width=Math.max(vertical?212:760,Math.round(targetWidth||1100)),pad=Math.max(12,Math.round(width*.014)),gap=Math.max(10,Math.round(width*.010)),titleH=Math.max(32,Math.min(48,Math.round(width*(vertical?.090:.034)))),manyVertical=vertical&&groups.length>=8;
    const desiredCardW=vertical?(manyVertical?Math.max(166,Math.min(220,Math.round(width*.46))):Math.max(178,Math.min(226,Math.round(width*.84)))):Math.max(190,Math.min(285,Math.round(width*.19))),cols=vertical?(manyVertical?2:1):Math.max(1,Math.min(groups.length,Math.floor((width-pad*2+gap)/(desiredCardW+gap)))),cardW=Math.min(desiredCardW,Math.floor((width-pad*2-gap*(cols-1))/cols)),cardH=Math.max(vertical?152:148,Math.min(vertical?196:194,Math.round(cardW*(vertical?.88:.75)))),rows=Math.ceil(groups.length/cols),height=pad+titleH+gap+rows*cardH+(rows-1)*gap+pad;
    const out=document.createElement('canvas');out.width=width;out.height=height;const c=out.getContext('2d');c.fillStyle='#f8fafc';c.fillRect(0,0,width,height);c.strokeStyle='#cbd5e1';c.strokeRect(.5,.5,width-1,height-1);c.fillStyle='#0f172a';c.beginPath();c.roundRect(pad,pad,width-pad*2,titleH,12);c.fill();c.fillStyle='#f8fafc';c.textAlign='right';c.textBaseline='middle';c.font=`700 ${Math.max(13,Math.min(20,Math.round(width*(vertical?.055:.017))))}px Tahoma`;c.fillText('الأثاث المستخدم',width-pad-12,pad+titleH/2);
    const imgs=await Promise.all(groups.map(async g=>g.src?await makeFurnitureGuideVisual(g):null));
    for(let i=0;i<groups.length;i++){const g=groups[i],row=Math.floor(i/cols),col=i%cols,x=width-pad-cardW-col*(cardW+gap),y=pad+titleH+gap+row*(cardH+gap);c.fillStyle='#fff';c.strokeStyle='#cdd7e1';c.lineWidth=1.35;c.beginPath();c.roundRect(x,y,cardW,cardH,12);c.fill();c.stroke();if(g.count>1){c.fillStyle='#0f766e';c.beginPath();c.roundRect(x+8,y+8,38,22,10);c.fill();c.fillStyle='#fff';c.textAlign='center';c.font='700 11px Tahoma';c.fillText('×'+g.count,x+27,y+19)}const dimH=Math.max(vertical?54:48,Math.round(cardH*(vertical?.34:.30))),imgArea={x:x+12,y:y+10,w:cardW-24,h:cardH-dimH-24};c.fillStyle='#f8fafc';c.beginPath();c.roundRect(imgArea.x,imgArea.y,imgArea.w,imgArea.h,10);c.fill();c.strokeStyle='#e2e8f0';c.stroke();const im=imgs[i];if(im){const sc=Math.min(imgArea.w/im.width,imgArea.h/im.height)*.9,iw=im.width*sc,ih=im.height*sc;c.drawImage(im,imgArea.x+(imgArea.w-iw)/2,imgArea.y+(imgArea.h-ih)/2,iw,ih)}else{c.fillStyle=g.color||'#d7dee7';c.strokeStyle='#64748b';c.beginPath();c.roundRect(imgArea.x+imgArea.w*.2,imgArea.y+imgArea.h*.18,imgArea.w*.6,imgArea.h*.62,7);c.fill();c.stroke()}const dimText=`${formatCardCm(g.w)}×${formatCardCm(g.h)}`;c.fillStyle='#eef2f7';c.beginPath();c.roundRect(x+8,y+cardH-dimH-8,cardW-16,dimH,12);c.fill();c.strokeStyle='#c7d2df';c.stroke();c.fillStyle='#0b1220';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.max(vertical?30:28,Math.min(vertical?42:38,Math.round(cardW*(vertical?.175:.145))))}px Tahoma`;c.fillText(dimText,x+cardW/2,y+cardH-dimH/2-8)}return out;
  };

  window.buildBrandedSheet=async function({paper='A4',orient='landscape',title='',mapTitle='',client='',location='',planCanvas=null}){
    const rawPlan=planCanvas||captureCleanPlanCanvas({includeScaleBar:false}),plan=cropPlanCanvasForPrint(rawPlan),size=paperPixels(paper,orient),sheet=document.createElement('canvas');sheet.width=size.w;sheet.height=size.h;const c=sheet.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,sheet.width,sheet.height);
    const margin=Math.round(Math.min(sheet.width,sheet.height)*.022),headerH=Math.round(sheet.height*.09),footerH=Math.round(sheet.height*.032),gap=Math.round(Math.min(sheet.width,sheet.height)*.014),bodyTop=margin+headerH+gap,bodyBottom=sheet.height-margin-footerH-gap,bodyH=Math.max(120,bodyBottom-bodyTop),bodyW=sheet.width-margin*2;c.fillStyle='#0f172a';c.beginPath();c.roundRect(margin,margin,bodyW,headerH,16);c.fill();
    const logo=await loadDataImage(brandInfo.logoData||PRINT_LOGO_DATA),logoPad=Math.round(headerH*.16),logoMaxW=Math.round(sheet.width*.10),logoMaxH=Math.round(headerH*.68),logoScale=Math.min(logoMaxW/logo.width,logoMaxH/logo.height),logoW=logo.width*logoScale,logoH=logo.height*logoScale,logoX=margin+logoPad,logoY=margin+Math.round((headerH-logoH)/2);c.drawImage(logo,logoX,logoY,logoW,logoH);c.fillStyle='#f8fafc';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.round(headerH*.26)}px Tahoma`;c.fillText(title||'مشروع جديد',sheet.width/2,margin+Math.round(headerH*.34));c.font=`${Math.round(headerH*.15)}px Tahoma`;if(mapTitle)c.fillText(mapTitle,sheet.width/2,margin+Math.round(headerH*.68));
    c.textAlign='right';c.font=`${Math.round(headerH*.14)}px Tahoma`;let y=margin+Math.round(headerH*.28);const metaX=sheet.width-margin-logoPad,lines=[];if(client)lines.push(`العميل: ${client}`);if(location)lines.push(`الموقع: ${location}`);lines.push(`الحالة: ${pxPerCm?'المقياس معاير':'غير معاير'}`);lines.push(`التاريخ: ${new Date().toLocaleDateString('ar-IQ')}`);for(const line of lines.slice(0,4)){c.fillText(line,metaX,y);y+=Math.round(headerH*.16)}if(brandInfo.companyName){c.textAlign='left';c.font=`600 ${Math.round(headerH*.13)}px Tahoma`;c.fillText(brandInfo.companyName,logoX+logoW+10,margin+Math.round(headerH*.76))}
    let schedule=null,scheduleW=0,scheduleH=0,planBox={x:margin,y:bodyTop,w:bodyW,h:bodyH},scheduleBox=null;if(usedFurnitureGroups().length){const landscape=plan.width>=plan.height;if(landscape){const many=usedFurnitureGroups().length>=8,sidebarW=Math.round(bodyW*(many?.245:.155)),usable=Math.max(many?300:175,sidebarW);schedule=await renderFurnitureScheduleCanvas(usable,{layout:'vertical',force:true});if(schedule){const sc=Math.min(1,usable/schedule.width,bodyH/schedule.height);scheduleW=Math.round(schedule.width*sc);scheduleH=Math.round(schedule.height*sc);scheduleBox={x:sheet.width-margin-scheduleW,y:bodyTop+Math.round((bodyH-scheduleH)/2),w:scheduleW,h:scheduleH};planBox={x:margin,y:bodyTop,w:bodyW-scheduleW-gap,h:bodyH}}}else{schedule=await renderFurnitureScheduleCanvas(bodyW,{layout:'horizontal',force:true});if(schedule){const maxH=Math.round(bodyH*.22),sc=Math.min(1,bodyW/schedule.width,maxH/schedule.height);scheduleW=Math.round(schedule.width*sc);scheduleH=Math.round(schedule.height*sc);scheduleBox={x:margin+Math.round((bodyW-scheduleW)/2),y:bodyBottom-scheduleH,w:scheduleW,h:scheduleH};planBox={x:margin,y:bodyTop,w:bodyW,h:bodyH-scheduleH-gap}}}}
    c.fillStyle='#fff';c.strokeStyle='#0f172a';c.lineWidth=Math.max(2,Math.round(sheet.width/1000));c.beginPath();c.roundRect(planBox.x,planBox.y,planBox.w,planBox.h,10);c.fill();c.stroke();const innerPad=Math.max(10,Math.round(Math.min(planBox.w,planBox.h)*.018)),fitW=planBox.w-innerPad*2,fitH=planBox.h-innerPad*2,sc=Math.min(fitW/plan.width,fitH/plan.height),drawW=plan.width*sc,drawH=plan.height*sc,drawX=Math.round(planBox.x+(planBox.w-drawW)/2),drawY=Math.round(planBox.y+(planBox.h-drawH)/2);c.drawImage(plan,drawX,drawY,drawW,drawH);
    if(pxPerCm){const len=Math.min(planBox.w*.28,100*pxPerCm*sc);if(len>18){const sx=planBox.x+Math.max(20,Math.round(planBox.w*.025)),sy=planBox.y+planBox.h-Math.max(20,Math.round(planBox.h*.035));c.save();c.strokeStyle='#111827';c.fillStyle='#111827';c.lineWidth=Math.max(2,Math.round(sheet.width/1100));c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+len,sy);c.moveTo(sx,sy-7);c.lineTo(sx,sy+7);c.moveTo(sx+len,sy-7);c.lineTo(sx+len,sy+7);c.stroke();c.font=`700 ${Math.max(11,Math.round(sheet.width/105))}px Tahoma`;c.textAlign='center';c.textBaseline='bottom';c.fillText('1 متر',sx+len/2,sy-9);c.restore()}}
    if(schedule&&scheduleBox){c.fillStyle='#fff';c.strokeStyle='#334155';c.lineWidth=1.3;c.beginPath();c.roundRect(scheduleBox.x,scheduleBox.y,scheduleBox.w,scheduleBox.h,10);c.fill();c.stroke();c.drawImage(schedule,scheduleBox.x,scheduleBox.y,scheduleBox.w,scheduleBox.h)}c.fillStyle='#475569';const companyLine=[brandInfo.companyName,brandInfo.address,brandInfo.email].filter(Boolean).join('  •  '),footerY=sheet.height-margin+Math.round(footerH*.10);c.font=`${Math.round(footerH*.42)}px Tahoma`;if(companyLine){c.textAlign='center';c.fillText(companyLine,sheet.width/2,footerY)}c.textAlign='right';c.font=`${Math.round(footerH*.36)}px Tahoma`;c.fillText(`${paper} — ${orient==='landscape'?'أفقي':'عمودي'}`,sheet.width-margin,footerY);return sheet;
  };

  function install(){
    const t=document.getElementById('furnitureSummaryToggle');if(t)t.onchange=()=>{try{syncQuickDisplayButtons();syncUsedFurniturePanel(true)}catch{}};
    const grid=document.getElementById('usedFurnitureGrid');if(grid&&!grid.dataset.v85scroll){grid.dataset.v85scroll='1';let dragging=false,startX=0,startScroll=0,moved=false;grid.addEventListener('mousedown',e=>{if(e.button!==0)return;dragging=true;moved=false;startX=e.clientX;startScroll=grid.scrollLeft;e.preventDefault()});window.addEventListener('mousemove',e=>{if(!dragging)return;const dx=e.clientX-startX;if(Math.abs(dx)>3)moved=true;grid.scrollLeft=startScroll-dx});window.addEventListener('mouseup',()=>dragging=false);grid.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);grid.addEventListener('wheel',e=>{grid.scrollLeft+=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;e.preventDefault()},{passive:false})}
    if(window.mainScroll&&!mainScroll.dataset.v85zoom){mainScroll.dataset.v85zoom='1';mainScroll.addEventListener('wheel',e=>{if(e.target?.closest?.('#usedFurniturePanel'))return;e.preventDefault();const rect=canvas.getBoundingClientRect(),ax=(e.clientX-rect.left)*(canvas.width/Math.max(1,rect.width)),ay=(e.clientY-rect.top)*(canvas.height/Math.max(1,rect.height)),factor=e.deltaY<0?1.10:.90,next=Math.min(3,Math.max(.4,zoom*factor));if(Math.abs(next-zoom)<.0001)return;setZoomPercent(next*100);requestAnimationFrame(()=>{const nr=canvas.getBoundingClientRect(),sx=nr.left+ax*(nr.width/canvas.width),sy=nr.top+ay*(nr.height/canvas.height);mainScroll.scrollLeft+=sx-e.clientX;mainScroll.scrollTop+=sy-e.clientY})},{passive:false})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
// ===== End FurniPlan V85 Final Runtime Patch =====


// ===== FurniPlan V95 Layout + Toolbar Scroll Fix =====
(function(){
  const style=document.createElement('style');
  style.id='furniplan-v95-layout-scroll-fix';
  style.textContent=`
    /* The viewport itself is the scroller. This keeps the map and its own
       scrollbars inside the map area, behind the bottom controls. */
    .mapPanel{
      height:100%!important;
      min-height:0!important;
      overflow:hidden!important;
      display:flex!important;
      flex-direction:column!important;
      gap:10px!important;
    }
    #mainScroll.mapViewport{
      position:relative!important;
      flex:1 1 0!important;
      min-height:0!important;
      min-width:0!important;
      overflow:auto!important;
      scrollbar-gutter:stable both-edges!important;
      z-index:1!important;
      -webkit-overflow-scrolling:touch!important;
      overscroll-behavior:contain!important;
      touch-action:pan-x pan-y!important;
    }
    #mainScroll .canvasWrap{
      position:relative!important;
      z-index:1!important;
      width:100%!important;
      height:100%!important;
      min-width:100%!important;
      min-height:100%!important;
      overflow:visible!important;
      box-sizing:border-box!important;
    }
    .mapTopbar{
      position:relative!important;
      z-index:8!important;
      flex:0 0 auto!important;
    }
    .usedFurniturePanel,
    .bottomInspector{
      position:relative!important;
      z-index:12!important;
      flex:0 0 auto!important;
    }

    /* Horizontal toolbar scrolling: desktop wheel/mouse + native touch on iPad/iPhone */
    .toolbarStack{
      min-width:0!important;
      overflow:hidden!important;
    }
    .mainToolbar,
    .workToolbar{
      display:flex!important;
      flex-wrap:nowrap!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      white-space:nowrap!important;
      -webkit-overflow-scrolling:touch!important;
      overscroll-behavior-x:contain!important;
      touch-action:pan-x!important;
      scrollbar-gutter:stable!important;
      cursor:grab;
    }
    .mainToolbar:active,
    .workToolbar:active{cursor:grabbing}
    .mainToolbar>button,.mainToolbar>.btn,
    .workToolbar>button,.workToolbar>.btn{
      flex:0 0 auto!important;
    }
  `;
  document.head.appendChild(style);

  function installToolbarScroll(){
    document.querySelectorAll('.mainToolbar,.workToolbar').forEach(el=>{
      if(el.dataset.fpV95Scroll==='1') return;
      el.dataset.fpV95Scroll='1';

      /* Mouse/pen drag without breaking button clicks. Touch uses native momentum scrolling. */
      let dragging=false, moved=false, startX=0, startScroll=0, pointerId=null;
      el.addEventListener('pointerdown',ev=>{
        if(ev.pointerType==='touch' || ev.button!==0) return;
        if(el.scrollWidth<=el.clientWidth+2) return;
        dragging=true; moved=false; startX=ev.clientX; startScroll=el.scrollLeft; pointerId=ev.pointerId;
      });
      el.addEventListener('pointermove',ev=>{
        if(!dragging || ev.pointerId!==pointerId) return;
        const dx=ev.clientX-startX;
        if(Math.abs(dx)>5){
          moved=true;
          try{el.setPointerCapture(pointerId)}catch{}
          el.scrollLeft=startScroll-dx;
          ev.preventDefault();
        }
      },{passive:false});
      const stop=ev=>{
        if(!dragging) return;
        dragging=false;
        try{if(pointerId!=null)el.releasePointerCapture(pointerId)}catch{}
        pointerId=null;
      };
      el.addEventListener('pointerup',stop);
      el.addEventListener('pointercancel',stop);
      el.addEventListener('click',ev=>{
        if(moved){
          ev.preventDefault();
          ev.stopPropagation();
          moved=false;
        }
      },true);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installToolbarScroll,{once:true});
  else installToolbarScroll();
})();
// ===== End FurniPlan V95 Layout + Toolbar Scroll Fix =====


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
  let a=upsert('link[rel="apple-touch-icon"]',()=>document.createElement('link'));a.rel='apple-touch-icon';a.sizes='180x180';a.href='apple-touch-icon.png?v=100';
  let f=upsert('link[rel="icon"][sizes="32x32"]',()=>document.createElement('link'));f.rel='icon';f.type='image/png';f.sizes='32x32';f.href='favicon-32.png?v=100';
  let m=upsert('link[rel="manifest"]',()=>document.createElement('link'));m.rel='manifest';m.href='manifest.webmanifest?v=100';
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


// ===== FurniPlan V96 Modern Toolbar Scroll Fix =====
(function(){
  const style=document.createElement('style');
  style.id='furniplan-v96-modern-toolbar-scroll';
  style.textContent=`
    #modernToolbarArea{
      min-width:0!important;
      overflow:hidden!important;
    }
    #modernTopToolbar,
    #modernSliderRow{
      min-width:0!important;
      width:100%!important;
      max-width:100%!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      -webkit-overflow-scrolling:touch!important;
      overscroll-behavior-x:contain!important;
      touch-action:pan-x!important;
      scrollbar-width:auto!important;
      scrollbar-color:#91accb #425a74!important;
      cursor:grab!important;
    }
    #modernTopToolbar:active,
    #modernSliderRow:active{cursor:grabbing!important}

    /* Keep all top icons on one row and make the row truly wider than its viewport */
    #modernTopToolbar{
      display:flex!important;
      flex-wrap:nowrap!important;
      justify-content:flex-start!important;
      direction:rtl!important;
      padding-bottom:13px!important;
    }
    #modernTopToolbar .topToolGroup{
      flex:0 0 auto!important;
      flex-wrap:nowrap!important;
    }
    #modernTopToolbar .modernIconBtn{
      flex:0 0 var(--tool-btn-w)!important;
      touch-action:pan-x!important;
      -webkit-user-select:none!important;
      user-select:none!important;
    }

    #modernTopToolbar::-webkit-scrollbar,
    #modernSliderRow::-webkit-scrollbar{
      display:block!important;
      height:13px!important;
    }
    #modernTopToolbar::-webkit-scrollbar-track,
    #modernSliderRow::-webkit-scrollbar-track{
      background:#425a74!important;
      border:1px solid #5f7895!important;
      border-radius:999px!important;
    }
    #modernTopToolbar::-webkit-scrollbar-thumb,
    #modernSliderRow::-webkit-scrollbar-thumb{
      background:linear-gradient(90deg,#91accb,#7292b6)!important;
      border:2px solid #425a74!important;
      border-radius:999px!important;
      min-width:42px!important;
    }
  `;
  document.head.appendChild(style);

  function makeHorizontalScroller(el){
    if(!el || el.dataset.fpV96Scroll==='1')return;
    el.dataset.fpV96Scroll='1';

    // Mouse wheel / trackpad vertical motion -> horizontal toolbar motion
    el.addEventListener('wheel',ev=>{
      if(el.scrollWidth<=el.clientWidth+2)return;
      if(ev.target.closest('input[type="range"],input[type="number"],select,textarea'))return;
      const d=Math.abs(ev.deltaY)>=Math.abs(ev.deltaX)?ev.deltaY:ev.deltaX;
      if(!d)return;
      ev.preventDefault();
      el.scrollLeft+=d;
    },{passive:false});

    // Desktop mouse / pen drag
    let drag=false,moved=false,startX=0,startLeft=0,pid=null;
    el.addEventListener('pointerdown',ev=>{
      if(ev.pointerType==='touch' || ev.button!==0)return;
      if(el.scrollWidth<=el.clientWidth+2)return;
      drag=true;moved=false;startX=ev.clientX;startLeft=el.scrollLeft;pid=ev.pointerId;
    });
    el.addEventListener('pointermove',ev=>{
      if(!drag||ev.pointerId!==pid)return;
      const dx=ev.clientX-startX;
      if(Math.abs(dx)>4){
        moved=true;
        try{el.setPointerCapture(pid)}catch{}
        el.scrollLeft=startLeft-dx;
        ev.preventDefault();
      }
    },{passive:false});
    const end=()=>{
      drag=false;
      try{if(pid!=null)el.releasePointerCapture(pid)}catch{}
      pid=null;
    };
    el.addEventListener('pointerup',end);
    el.addEventListener('pointercancel',end);

    // iPhone/iPad: explicit horizontal finger drag, including when starting on an icon.
    let tActive=false,tMoved=false,tStartX=0,tStartY=0,tLeft=0;
    el.addEventListener('touchstart',ev=>{
      if(ev.touches.length!==1 || el.scrollWidth<=el.clientWidth+2)return;
      const t=ev.touches[0];
      tActive=true;tMoved=false;tStartX=t.clientX;tStartY=t.clientY;tLeft=el.scrollLeft;
    },{passive:true});
    el.addEventListener('touchmove',ev=>{
      if(!tActive||ev.touches.length!==1)return;
      const t=ev.touches[0],dx=t.clientX-tStartX,dy=t.clientY-tStartY;
      if(!tMoved && Math.abs(dx)<6)return;
      if(Math.abs(dx)>=Math.abs(dy)){
        tMoved=true;
        el.scrollLeft=tLeft-dx;
        ev.preventDefault();
      }
    },{passive:false});
    el.addEventListener('touchend',()=>{tActive=false;setTimeout(()=>{tMoved=false},0)},{passive:true});
    el.addEventListener('touchcancel',()=>{tActive=false;tMoved=false},{passive:true});

    // Prevent accidental icon activation only after a real drag.
    el.addEventListener('click',ev=>{
      if(moved||tMoved){
        ev.preventDefault();
        ev.stopPropagation();
        moved=false;tMoved=false;
      }
    },true);
  }

  function install(){
    makeHorizontalScroller(document.getElementById('modernTopToolbar'));
    makeHorizontalScroller(document.getElementById('modernSliderRow'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
// ===== End FurniPlan V96 Modern Toolbar Scroll Fix =====


// ===== FurniPlan V97 Map Pan + Dual Furniture Placement =====
(function(){
  const style=document.createElement('style');
  style.id='furniplan-v97-map-pan-dnd';
  style.textContent=`
    /* Let the outer map viewport measure the real zoomed stage in BOTH directions. */
    #mainScroll .canvasWrap{
      width:max-content!important;
      height:max-content!important;
      min-width:100%!important;
      min-height:100%!important;
      overflow:visible!important;
      display:block!important;
      padding:18px!important;
      box-sizing:border-box!important;
    }
    #mainScroll #stage{
      position:relative!important;
      display:block!important;
      flex:0 0 auto!important;
    }
    #mainScroll{
      overflow:auto!important;
      touch-action:pan-x pan-y!important;
      cursor:grab;
    }
    #mainScroll.panning{cursor:grabbing!important}
    #mainScroll.touchDropReady{
      outline:3px solid rgba(56,189,248,.95)!important;
      outline-offset:-3px!important;
    }
    .fcard[draggable="true"],.archCard[draggable="true"]{cursor:grab!important}
    .fcard[draggable="true"]:active,.archCard[draggable="true"]:active{cursor:grabbing!important}
  `;
  document.head.appendChild(style);

  function canvasClientPointToMap(x,y){
    const r=canvas.getBoundingClientRect();
    return clampPointToCanvas({
      x:(x-r.left)*(canvas.width/Math.max(1,r.width)),
      y:(y-r.top)*(canvas.height/Math.max(1,r.height))
    });
  }

  /* Accept desktop HTML5 drag anywhere over the visible map viewport,
     but only place when the pointer is actually over the canvas. */
  mainScroll.addEventListener('dragover',ev=>{
    if(!pxPerCm)return;
    const hasFurniture=ev.dataTransfer?.types?.includes?.('application/x-furniture-id');
    const hasArch=ev.dataTransfer?.types?.includes?.('application/x-arch-id');
    const hasText=ev.dataTransfer?.types?.includes?.('text/plain');
    if(!(hasFurniture||hasArch||hasText))return;
    ev.preventDefault();
    if(ev.dataTransfer)ev.dataTransfer.dropEffect='copy';
    const r=canvas.getBoundingClientRect();
    mainScroll.classList.toggle('touchDropReady',ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom);
  },{passive:false});
  mainScroll.addEventListener('dragleave',ev=>{
    if(!mainScroll.contains(ev.relatedTarget))mainScroll.classList.remove('touchDropReady');
  });
  mainScroll.addEventListener('drop',ev=>{
    mainScroll.classList.remove('touchDropReady');
    if(!pxPerCm)return;
    const r=canvas.getBoundingClientRect();
    if(!(ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom))return;
    const aid=ev.dataTransfer?.getData('application/x-arch-id');
    const fid=ev.dataTransfer?.getData('application/x-furniture-id')||ev.dataTransfer?.getData('text/plain');
    const def=aid?architecture.find(x=>x.id===aid):furniture.find(x=>x.id===fid);
    if(!def)return;
    ev.preventDefault();
    ev.stopPropagation();
    const p=canvasClientPointToMap(ev.clientX,ev.clientY);
    addItem(def,p.x,p.y);
    pendingFurnitureDef=null;
    mode='select';
    updateInteractionCursor();
    setStatus(`تم سحب وإفلات ${def.name} في المكان المحدد`);
  },true);

  /* Desktop mouse panning fallback on the viewport itself.
     Starts only from empty map background/canvas area and never steals furniture editing. */
  let vpPan=null;
  mainScroll.addEventListener('pointerdown',ev=>{
    if(ev.pointerType==='touch'||ev.button!==0)return;
    if(ev.target.closest('.usedFurniturePanel,.bottomInspector'))return;
    if(document.getElementById('mapLockToggle')?.checked)return;
    const canX=mainScroll.scrollWidth>mainScroll.clientWidth+2;
    const canY=mainScroll.scrollHeight>mainScroll.clientHeight+2;
    if(!(canX||canY))return;

    /* Canvas has its own item/measure handlers. Start viewport pan only when
       the pointer is not on an editable object. */
    if(ev.target===canvas){
      try{
        const p=toCanvasPos(ev);
        if(hitTest(p)||hitTestMeasurement(p)||hitTestMapLabel(p))return;
      }catch(_){}
    }
    vpPan={id:ev.pointerId,x:ev.clientX,y:ev.clientY,left:mainScroll.scrollLeft,top:mainScroll.scrollTop,moved:false};
  },true);
  mainScroll.addEventListener('pointermove',ev=>{
    if(!vpPan||vpPan.id!==ev.pointerId)return;
    const dx=ev.clientX-vpPan.x,dy=ev.clientY-vpPan.y;
    if(Math.hypot(dx,dy)>4){
      vpPan.moved=true;
      try{mainScroll.setPointerCapture(ev.pointerId)}catch{}
      mainScroll.scrollLeft=vpPan.left-dx;
      mainScroll.scrollTop=vpPan.top-dy;
      mainScroll.classList.add('panning');
      ev.preventDefault();
    }
  },{passive:false,capture:true});
  const endVpPan=ev=>{
    if(!vpPan||vpPan.id!==ev.pointerId)return;
    if(vpPan.moved)suppressCanvasClickUntil=Date.now()+250;
    vpPan=null;
    mainScroll.classList.remove('panning');
    try{mainScroll.releasePointerCapture(ev.pointerId)}catch{}
  };
  mainScroll.addEventListener('pointerup',endVpPan,true);
  mainScroll.addEventListener('pointercancel',endVpPan,true);

  /* Recompute pan availability after zoom/resize. */
  const ro=new ResizeObserver(()=>{try{updatePanState()}catch{}});
  try{ro.observe(stage);ro.observe(mainScroll)}catch{}
  requestAnimationFrame(()=>{try{updateStageSize();updatePanState()}catch{}});
})();
// ===== End FurniPlan V97 Map Pan + Dual Furniture Placement =====


// ===== FurniPlan V101 Offline/PWA Registration =====
(()=>{
  if(!('serviceWorker' in navigator)) return;
  const register=()=>navigator.serviceWorker.register('./service-worker.js?v=112',{scope:'./'})
    .then(reg=>{ try{reg.update();}catch(_){} })
    .catch(()=>{});
  if(document.readyState==='complete') register();
  else window.addEventListener('load',register,{once:true});
})();
// ===== End FurniPlan V101 Offline/PWA Registration =====


// ===== FurniPlan V112 Splash Offline Status =====
(()=>{
  const CACHE_NAME='furniplan-v112-offline-20261002';
  const READY_KEY='furniplan-offline-ready-v112';

  function ensureStyles(){
    if(document.getElementById('fpSplashOfflineStyleV112')) return;
    const s=document.createElement('style');
    s.id='fpSplashOfflineStyleV112';
    s.textContent=`
      .fpSplashOfflineV112{
        margin-top:12px;
        display:inline-flex;align-items:center;justify-content:center;gap:8px;
        padding:6px 11px;border-radius:999px;
        background:rgba(255,255,255,.58);
        border:1px solid rgba(100,78,45,.18);
        color:#2d2923;
        font:700 12px/1.2 Tahoma,Arial,sans-serif;
        direction:rtl;
        box-shadow:0 2px 8px rgba(0,0,0,.06);
        white-space:nowrap;
      }
      .fpSplashOfflineDotV112{
        width:9px;height:9px;border-radius:50%;flex:0 0 auto;
        background:#f59e0b;
        box-shadow:0 0 0 2px rgba(245,158,11,.16);
      }
      .fpSplashOfflineV112.ready .fpSplashOfflineDotV112{
        background:#22c55e;
        box-shadow:0 0 0 2px rgba(34,197,94,.16);
      }
      @media(max-width:600px){
        .fpSplashOfflineV112{font-size:10.5px;padding:5px 9px;margin-top:9px;max-width:92vw}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureStatus(){
    const splash=document.getElementById('fpSplash');
    if(!splash) return null;
    let el=document.getElementById('fpSplashOfflineV112');
    if(el) return el;
    ensureStyles();
    el=document.createElement('div');
    el.id='fpSplashOfflineV112';
    el.className='fpSplashOfflineV112';
    el.innerHTML='<span class="fpSplashOfflineDotV112"></span><span class="fpSplashOfflineTextV112">جاري تجهيز البرنامج ليعمل بدون نت…</span>';
    const host=splash.querySelector('.fpSplashContent')||splash;
    const loading=host.querySelector('.fpLoadingText');
    if(loading) loading.insertAdjacentElement('afterend',el);
    else host.appendChild(el);
    return el;
  }

  function setReady(){
    const el=ensureStatus(); if(!el) return;
    el.classList.add('ready');
    const t=el.querySelector('.fpSplashOfflineTextV112');
    if(t)t.textContent='البرنامج لا يحتاج الإنترنت ليعمل';
    try{localStorage.setItem(READY_KEY,'1')}catch(_){}
  }

  function setPreparing(){
    const el=ensureStatus(); if(!el) return;
    el.classList.remove('ready');
    const t=el.querySelector('.fpSplashOfflineTextV112');
    if(t)t.textContent='جاري تجهيز البرنامج ليعمل بدون نت…';
  }

  async function verify(){
    const el=ensureStatus(); if(!el) return;
    try{
      if(!('serviceWorker' in navigator)||!('caches' in window)){setPreparing();return;}
      await navigator.serviceWorker.ready;
      const keys=await caches.keys();
      const ok=keys.includes(CACHE_NAME);
      if(ok)setReady(); else setPreparing();
    }catch(_){setPreparing();}
  }

  function init(){
    if(!ensureStatus()) return;
    let saved=false;
    try{saved=localStorage.getItem(READY_KEY)==='1'}catch(_){}
    if(saved)setReady(); else setPreparing();
    verify();
    navigator.serviceWorker?.addEventListener?.('controllerchange',()=>setTimeout(verify,80));
    window.addEventListener('online',verify);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
// ===== End FurniPlan V112 Splash Offline Status =====

// FurniPlan V102 desktop build trigger 2026-10-01


// ===== FurniPlan V111 Safe Responsive Touch CSS Only =====
(()=>{
  if(document.getElementById('fpSafeResponsiveV111')) return;
  const s=document.createElement('style');
  s.id='fpSafeResponsiveV111';
  s.textContent=`
/* iPhone portrait */
@media (hover:none) and (pointer:coarse) and (max-width:600px) and (orientation:portrait){
  :root{
    --tool-btn-w:44px!important;
    --tool-btn-h:46px!important;
    --tool-icon-size:18px!important;
    --tool-label-size:7px!important;
    --tool-label-short-size:6.6px!important;
    --tool-side-width:50px!important;
    --tool-header-h:78px!important;
  }
  header{
    height:78px!important;min-height:78px!important;max-height:78px!important;
    padding:3px 4px!important;overflow:hidden!important;
  }
  .headerBrand{display:none!important}
  #modernToolbarArea{width:100%!important;min-width:0!important;gap:3px!important}
  #modernTopToolbar{
    height:47px!important;min-height:47px!important;max-height:47px!important;
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;
    flex-wrap:nowrap!important;justify-content:flex-start!important;
    padding:2px 3px!important;gap:3px!important;scrollbar-width:none!important;
  }
  #modernTopToolbar::-webkit-scrollbar{display:none!important}
  #modernTopToolbar .modernIconBtn{
    width:44px!important;height:43px!important;min-width:44px!important;min-height:43px!important;
    flex:0 0 44px!important;padding:3px 2px!important;
  }
  #modernTopToolbar .modernIconBtn svg{width:18px!important;height:18px!important}
  #modernTopToolbar .modernIconBtn .iconLabel{font-size:7px!important;line-height:1!important}
  #modernSliderRow{
    display:flex!important;height:27px!important;min-height:27px!important;max-height:27px!important;
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;
    gap:3px!important;padding:0 1px!important;scrollbar-width:none!important;
  }
  #modernSliderRow::-webkit-scrollbar{display:none!important}
  .modernSliderBox,.modernSliderBox.uiScaleBox{
    flex:0 0 118px!important;width:118px!important;min-width:118px!important;
    height:26px!important;min-height:26px!important;padding:1px 3px!important;
  }
  .modernSliderBox:first-child{flex-basis:145px!important;width:145px!important;min-width:145px!important}
  main{padding:3px!important;min-width:0!important;min-height:0!important;overflow:hidden!important}
  .mapPanel{height:100%!important;min-height:0!important;gap:3px!important}
  .mapViewport{
    flex:1 1 auto!important;min-height:0!important;overflow:auto!important;
    -webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important;padding:3px!important;
  }
  #furnitureIconToolbar{
    position:absolute!important;z-index:90!important;
    left:3px!important;right:3px!important;top:auto!important;bottom:3px!important;
    width:auto!important;height:52px!important;min-height:52px!important;max-height:52px!important;
    display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;
    padding:4px!important;gap:4px!important;scrollbar-width:none!important;
  }
  #furnitureIconToolbar::-webkit-scrollbar{display:none!important}
  #furnitureIconToolbar .modernIconBtn{
    width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;
    flex:0 0 46px!important;padding:3px!important;
  }
  #furnitureIconToolbar .modernIconBtn svg{width:18px!important;height:18px!important}
  #furnitureIconToolbar .modernIconBtn .iconLabel{font-size:7.2px!important;line-height:1!important}
  #furnitureIconToolbar .toolSep{
    width:1px!important;height:28px!important;min-width:1px!important;min-height:28px!important;margin:0 2px!important;
  }
  .bottomInspector{margin-bottom:56px!important;overflow-x:auto!important;flex-wrap:nowrap!important}
  .fpOfflineStatusV102{bottom:calc(88px + env(safe-area-inset-bottom))!important}
}

/* iPhone landscape */
@media (hover:none) and (pointer:coarse) and (max-height:600px) and (orientation:landscape){
  :root{
    --tool-btn-w:42px!important;
    --tool-btn-h:44px!important;
    --tool-icon-size:16px!important;
    --tool-label-size:6.7px!important;
    --tool-label-short-size:6.3px!important;
    --tool-side-width:48px!important;
    --tool-header-h:76px!important;
  }
  header{
    height:76px!important;min-height:76px!important;max-height:76px!important;
    padding:3px 5px!important;overflow:hidden!important;
  }
  .headerBrand{display:none!important}
  #modernTopToolbar{
    height:45px!important;min-height:45px!important;max-height:45px!important;
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;
    flex-wrap:nowrap!important;justify-content:flex-start!important;padding:2px!important;gap:3px!important;
  }
  #modernTopToolbar .modernIconBtn{
    width:42px!important;height:41px!important;min-width:42px!important;min-height:41px!important;
    flex:0 0 42px!important;padding:2px!important;
  }
  #modernTopToolbar .modernIconBtn svg{width:16px!important;height:16px!important}
  #modernTopToolbar .modernIconBtn .iconLabel{font-size:6.7px!important;line-height:1!important}
  #modernSliderRow{
    display:flex!important;height:27px!important;min-height:27px!important;max-height:27px!important;
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;gap:3px!important;
  }
  main{padding:3px!important;min-height:0!important;overflow:hidden!important}
  #furnitureIconToolbar{
    position:absolute!important;z-index:90!important;
    left:3px!important;right:auto!important;top:3px!important;bottom:3px!important;
    width:48px!important;height:auto!important;min-width:48px!important;max-width:48px!important;
    display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
    overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;
    padding:3px!important;gap:3px!important;scrollbar-width:none!important;
  }
  #furnitureIconToolbar::-webkit-scrollbar{display:none!important}
  #furnitureIconToolbar .modernIconBtn{
    width:42px!important;height:44px!important;min-width:42px!important;min-height:44px!important;
    flex:0 0 44px!important;padding:2px!important;
  }
  #furnitureIconToolbar .modernIconBtn svg{width:16px!important;height:16px!important}
  #furnitureIconToolbar .modernIconBtn .iconLabel{font-size:6.7px!important;line-height:1!important}
  #furnitureIconToolbar .toolSep{
    width:26px!important;height:1px!important;min-width:26px!important;min-height:1px!important;margin:1px 0!important;
  }
  .bottomInspector{margin-bottom:0!important}
  .fpOfflineStatusV102{bottom:34px!important}
}

/* iPad portrait */
@media (hover:none) and (pointer:coarse) and (min-width:601px) and (max-width:1100px) and (orientation:portrait){
  :root{
    --tool-btn-w:54px!important;
    --tool-btn-h:56px!important;
    --tool-icon-size:22px!important;
    --tool-label-size:8.3px!important;
    --tool-label-short-size:7.8px!important;
    --tool-side-width:60px!important;
    --tool-header-h:96px!important;
  }
  header{
    height:96px!important;min-height:96px!important;max-height:96px!important;
    padding:5px 7px!important;overflow:hidden!important;
  }
  .headerBrand{display:none!important}
  #modernToolbarArea{width:100%!important;min-width:0!important;gap:4px!important}
  #modernTopToolbar{
    overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;
    flex-wrap:nowrap!important;justify-content:flex-start!important;
    padding:3px 4px!important;gap:4px!important;scrollbar-width:none!important;
  }
  #modernTopToolbar::-webkit-scrollbar{display:none!important}
  #modernTopToolbar .modernIconBtn{
    width:54px!important;height:56px!important;min-width:54px!important;min-height:56px!important;
    flex:0 0 54px!important;padding:3px!important;
  }
  #modernTopToolbar .modernIconBtn svg{width:22px!important;height:22px!important}
  #modernTopToolbar .modernIconBtn .iconLabel{font-size:8.3px!important;line-height:1!important}
  #modernSliderRow{
    display:flex!important;overflow-x:auto!important;overflow-y:hidden!important;
    touch-action:pan-x!important;gap:4px!important;scrollbar-width:none!important;
  }
  #modernSliderRow::-webkit-scrollbar{display:none!important}
  .modernSliderBox,.modernSliderBox.uiScaleBox{
    flex:0 0 135px!important;width:135px!important;min-width:135px!important;height:31px!important;
  }
  .modernSliderBox:first-child{flex-basis:175px!important;width:175px!important;min-width:175px!important}
  main{padding:6px!important;min-width:0!important;min-height:0!important;overflow:hidden!important}
  .mapPanel{height:100%!important;min-height:0!important}
  .mapViewport{
    min-height:0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;
    touch-action:pan-x pan-y!important;
  }
  #furnitureIconToolbar{
    left:5px!important;right:auto!important;top:5px!important;bottom:5px!important;
    width:60px!important;min-width:60px!important;padding:3px!important;gap:3px!important;
    overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;
  }
  #furnitureIconToolbar .modernIconBtn{
    width:54px!important;height:56px!important;min-width:54px!important;min-height:56px!important;
    flex:0 0 56px!important;padding:3px!important;
  }
  #furnitureIconToolbar .modernIconBtn svg{width:22px!important;height:22px!important}
  #furnitureIconToolbar .modernIconBtn .iconLabel{font-size:8.3px!important}
  aside{top:calc(env(safe-area-inset-top) + 96px)!important}
  .sidebarScrim{inset:calc(env(safe-area-inset-top) + 96px) 0 env(safe-area-inset-bottom) 0!important}
  .fpOfflineStatusV102{bottom:36px!important}
}
  `;
  document.head.appendChild(s);
})();
// ===== End FurniPlan V111 Safe Responsive Touch CSS Only =====


// ===== FurniPlan V115 Bilingual UI (English default) =====
(function(){
  'use strict';
  if (window.__FurniPlanV115LanguageLoaded) return;
  window.__FurniPlanV115LanguageLoaded = true;

  const STORAGE_KEY = 'furniplan_language_v115';
  const AR = /[\u0600-\u06FF]/;
  let currentLang = 'en';
  let applying = false;

  const exact = {
    'تخطيط أذكى .. لحياة أفضل':'Smarter planning .. Better living',
    'مخططات':'Plans','أثاث':'Furniture','تصميمات':'Designs','احفظ':'Save','اطبع':'Print','مشاركة سهلة':'Easy sharing',
    '© 2026 FurniPlan — جميع الحقوق محفوظة — سدير ياسين محمد':'© 2026 FurniPlan — All rights reserved — Sadeer Yaseen Mohammed',
    '© 2026 FurniPlan - جميع الحقوق محفوظة - سدير ياسين محمد':'© 2026 FurniPlan — All rights reserved — Sadeer Yaseen Mohammed',
    'ارفع مخططًا للبدء':'Upload a plan to begin','ارفع مخططا للبدء':'Upload a plan to begin',
    'معلوماتك':'Your Info','المساعد':'Assistant','مشروع جديد':'New Project','فتح مشروع':'Open Project','حفظ المشروع':'Save Project',
    'تصدير PNG':'Export PNG','طباعة A3/A4':'Print A3/A4','حفظ PDF':'Save PDF',
    '☰ المكتبة':'☰ Library','المكتبة':'Library','رفع الخارطة':'Upload Plan','معايرة القياس':'Calibrate Scale','قياس مسافة':'Measure Distance','إضافة مسمى':'Add Label',
    'المقياس':'Scale','الحالة:':'Status:','الحالة':'Status','غير معاير':'Not calibrated','إعادة ضبط المقياس':'Reset Scale',
    'مكتبة الأثاث':'Furniture Library','+ إضافة للمكتبة':'+ Add to Library','استعادة الأصلية':'Restore Defaults',
    'قطعة سريعة':'Quick Item','الاسم':'Name','قطعة مخصصة':'Custom Item','العرض (سم)':'Width (cm)','العمق (سم)':'Depth (cm)',
    'لون القطعة':'Item Color','وضع على الخارطة':'Place on Plan','حفظ في المكتبة':'Save to Library',
    'أبواب وشبابيك':'Doors & Windows','أدوات الأثاث':'Furniture Tools','شبكة 50 سم':'50 cm Grid','القياسات':'Measurements','أسماء القطع':'Item Names',
    'تظليل':'Shadow','مسافات تلقائية':'Auto Spacing','تحديد متعدد':'Multi-select','قفل الأثاث':'Lock Furniture',
    'قفل القياسات':'Lock Measurements','قفل المسميات':'Lock Labels','قفل سحب الخارطة':'Lock Plan Panning',
    'إظهار الخارطة':'Show Plan','إظهار الأثاث':'Show Furniture','إظهار القياسات':'Show Measurements','إظهار المسميات':'Show Labels',
    'إظهار أسهم القياس':'Show Measurement Arrows','إظهار دليل الأثاث':'Show Furniture Guide',
    '↶ تراجع':'↶ Undo','↷ إعادة':'↷ Redo','تحديد كل الأثاث':'Select All Furniture','مسح كل القياسات':'Clear All Measurements',
    'ملاءمة للشاشة':'Fit to Screen','تصغير':'Zoom Out','تكبير':'Zoom In','حجم القياسات':'Measurement Size','حجم المسميات':'Label Size',
    'الأثاث المستخدم في الخارطة':'Furniture Used in Plan','القياسات بالسنتيمتر':'Dimensions in centimeters',
    'القطعة:':'Item:','العرض سم':'Width cm','العمق سم':'Depth cm','الدوران °':'Rotation °','استبدال اللون الأساسي':'Replace Base Color',
    'عكس فتح الباب':'Flip Door Swing','🔓 قفل':'🔓 Lock','🔒 فتح القفل':'🔒 Unlock','نسخ':'Duplicate','إلغاء التحديد':'Deselect','حذف':'Delete',
    'القياس المحدد:':'Selected Measurement:','تثبيت القياس':'Pin Measurement','حذف القياس':'Delete Measurement',
    'المسمى المحدد:':'Selected Label:','النص':'Text','حذف المسمى':'Delete Label',
    'تأكيد مقياس الخارطة':'Confirm Plan Scale','المسافة الحقيقية':'Real Distance','الوحدة':'Unit','متر':'Meter','سنتيمتر':'Centimeter',
    'إلغاء':'Cancel','اعتماد المقياس':'Apply Scale','إضافة قطعة إلى المكتبة':'Add Item to Library','اسم القطعة':'Item Name','قطعة جديدة':'New Item',
    'العرض الحقيقي (سم)':'Real Width (cm)','العمق الحقيقي (سم)':'Real Depth (cm)','التصنيف':'Category','تصنيف جديد (اختياري)':'New Category (optional)',
    'مثال: مكتب':'Example: Office','لون افتراضي للقطع بدون صورة':'Default color for items without an image',
    'اسم المشروع':'Project Name','اسم العميل':'Client Name','الموقع':'Location','عنوان الخارطة':'Plan Title',
    'اسم الشركة أو المكتب':'Company / Office Name','عنوان الشركة':'Company Address','الإيميل':'Email','حفظ معلوماتك':'Save Your Info',
    'إزالة الشعار المخصص':'Remove Custom Logo','إظهار بيانات المشروع والعميل التفصيلية':'Show detailed project and client information',
    'غرفة نوم':'Bedroom','غرفة طعام':'Dining Room','صالة':'Living Room','مطبخ':'Kitchen','حمام':'Bathroom','مكتب':'Office',
    'الغسيل والخدمات':'Laundry & Utility','مدخل وتخزين':'Entry & Storage','الكراج والسيارات':'Garage & Cars','الحدائق والمسابح':'Gardens & Pools','أخرى':'Other',
    'باب':'Door','شباك':'Window','باب سحاب':'Sliding Door','باب تركي':'Turkish Door','باب مزدوج':'Double Door',
    'شباك ثابت':'Fixed Window','شباك سحاب':'Sliding Window','شباك مزدوج':'Double Window',
    'سرير مفرد':'Single Bed','سرير مزدوج':'Double Bed','سرير كينغ':'King Bed','كومودينو':'Nightstand',
    'دولاب ملابس 1 متر':'Wardrobe 1 m','دولاب ملابس 1.5 متر':'Wardrobe 1.5 m','دولاب ملابس 2 متر':'Wardrobe 2 m',
    'دولاب ملابس 2.6 متر':'Wardrobe 2.6 m','دولاب ملابس 3 متر':'Wardrobe 3 m',
    'كنبة مقعدين':'2-Seat Sofa','كنبة 3 مقاعد':'3-Seat Sofa','كنبة زاوية L':'L-Shaped Sofa','شيزلونج':'Chaise Lounge',
    'كرسي مكتب':'Office Chair','مكتب وكرسي كامل':'Desk & Chair Set','كرسي مفرد أخضر':'Green Armchair','كرسي مفرد فاتح':'Light Armchair',
    'طاولة قهوة دائرية':'Round Coffee Table','طاولة قهوة مستطيلة':'Rectangular Coffee Table',
    'طاولة طعام مستطيلة حديثة':'Modern Rectangular Dining Table','طاولة طعام دائرية 4 كراسي':'Round Dining Table – 4 Chairs',
    'طاولة طعام بيضاوية 6 كراسي':'Oval Dining Table – 6 Chairs','طاولة طعام مستطيلة 6 كراسي':'Rectangular Dining Table – 6 Chairs',
    'وحدة تلفزيون':'TV Unit','كونسول صالة':'Living Room Console','كونسول مدخل':'Entry Console','كونسول جانبي':'Side Console',
    'بوفيه جانبي':'Sideboard','خزانة أدراج':'Drawer Cabinet','خزانة ملفات':'File Cabinet','خزانة خدمات':'Utility Cabinet',
    'خزانة جانبية':'Side Cabinet','مقعد تخزين':'Storage Bench','مقعد أحذية':'Shoe Bench',
    'حوض غسيل':'Wash Basin','حوض مطبخ':'Kitchen Sink','حوض استحمام':'Bathtub','مرحاض أرضي':'Floor Toilet',
    'مرحاض معلق':'Wall-Hung Toilet','خزانة حمام':'Bathroom Vanity','كابينة دش مربعة':'Square Shower Cabin',
    'دش مستطيل':'Rectangular Shower','مغسلة مفردة':'Single Vanity','مغسلة مزدوجة':'Double Vanity',
    'ثلاجة باب واحد 85×75':'Single-Door Fridge 85×75','ثلاجة بابين 120×75':'Double-Door Fridge 120×75',
    'موقد غاز':'Gas Cooker','خزانة مطبخ سفلية':'Base Kitchen Cabinet','خزانة مطبخ سفلية عريضة':'Wide Base Kitchen Cabinet',
    'خزانة مطبخ زاوية L':'L-Corner Kitchen Cabinet','خزانة مطبخ زاوية بديلة':'Alternative Corner Cabinet',
    'غسالة ملابس - علوي':'Top-Load Washer','نشافة ملابس - علوي':'Top-Load Dryer','خزان ماء':'Water Tank','سخان ماء':'Water Heater',
    'سبلت داخلي':'Indoor AC Unit','سبلت خارجي':'Outdoor AC Unit',
    'سيارة سيدان':'Sedan','سيارة دفع رباعي':'SUV','مرآب سيارة واحدة':'Single-Car Garage','مسبح مستطيل':'Rectangular Pool',
    'نافورة دائرية':'Round Fountain','نافورة مستطيلة':'Rectangular Fountain','حديقة دائرية':'Round Garden',
    'حديقة مستطيلة':'Rectangular Garden','حديقة على شكل L':'L-Shaped Garden','حديقة عضوية':'Organic-Shaped Garden',
    'نبتة ديكور':'Decorative Plant','سجادة دائرية':'Round Rug','سجادة مستطيلة':'Rectangular Rug','مرآة دائرية':'Round Mirror',
    'فتح':'Open','حفظ':'Save','إغلاق':'Close','إخفاء':'Hide','إظهار':'Show','قفل':'Lock','ترتيب':'Arrange','تحريك':'Move',
    'معاينة':'Preview','معلومات':'Information','أيقونات':'Icons','مساحة':'Area','اتجاه':'Direction','العنوان':'Title',
    'الشعار':'Logo','العميل':'Client','مسميات':'Labels','قياس':'Measure','شبكة':'Grid',
    'جاري تجهيز صفحة الطباعة...':'Preparing print page...','جاري تجهيز الطباعة':'Preparing print'
  };

  const phrases = [
    ['جميع الحقوق محفوظة','All rights reserved'],['سدير ياسين محمد','Sadeer Yaseen Mohammed'],
    ['تم حذف','Deleted'],['تم إظهار','Shown'],['تم إخفاء','Hidden'],['تم فتح','Opened'],['تم قفل','Locked'],['تم حفظ','Saved'],
    ['تم تحديد','Selected'],['تم تشغيل','Enabled'],['تم إيقاف','Disabled'],['تم اعتماد','Applied'],['تم إلغاء','Cancelled'],
    ['تمت إعادة','Reset'],['تعذر','Unable to'],['جاري','Processing'],['اختر','Choose'],['حدد','Select'],['أدخل','Enter'],
    ['اضغط','Press'],['اسحب','Drag'],['ارفع','Upload'],['معايرة','Calibrate'],['المسافة','distance'],['المساحة','area'],
    ['المحيط','perimeter'],['الخارطة','plan'],['المخطط','plan'],['القطعة','item'],['الأثاث','furniture'],['القياسات','measurements'],
    ['المسميات','labels'],['المقياس','scale'],['المكتبة','library'],['الشركة','company'],['المشروع','project'],
    ['الدوران','rotation'],['السحب','dragging'],['التحريك','movement'],['التحديد','selection'],['الوحدة','unit'],['الرسم','drawing']
  ];

  const words = {
    'على':'on','في':'in','من':'from','إلى':'to','الى':'to','أو':'or','ثم':'then','مع':'with','بدون':'without','بعد':'after','قبل':'before',
    'عند':'when','إذا':'if','ان':'that','أن':'that','لا':'no','لم':'not','يمكن':'can','يجب':'must','فقط':'only','نفس':'same','كل':'all',
    'هذا':'this','هذه':'this','الآن':'now','مرة':'time','أخرى':'other','واحدة':'one','واحد':'one','أكثر':'more','أقل':'less',
    'أعلى':'top','أسفل':'bottom','يمين':'right','يسار':'left','أفقي':'horizontal','عمودي':'vertical','وسط':'center',
    'عرض':'width','عمق':'depth','حجم':'size','اسم':'name','عنوان':'title','لون':'color','صورة':'image','صور':'images','ملف':'file',
    'رقم':'number','قيمة':'value','إعداد':'setting','إعدادات':'settings','أداة':'tool','أدوات':'tools','بيانات':'data','معلومات':'information',
    'خريطة':'plan','خارطة':'plan','مخطط':'plan','أثاث':'furniture','قياس':'measurement','مسمى':'label','باب':'door','شباك':'window',
    'غرفة':'room','مكتب':'office','مطبخ':'kitchen','حمام':'bathroom','سرير':'bed','كرسي':'chair','طاولة':'table','خزانة':'cabinet',
    'سيارة':'car','حديقة':'garden','مسبح':'pool','نافورة':'fountain','سجادة':'rug','مرآة':'mirror','متر':'meter','سنتيمتر':'centimeter',
    'ملم':'mm','إنش':'inch','قدم':'foot','ياردة':'yard','حفظ':'save','فتح':'open','حذف':'delete','إخفاء':'hide','إظهار':'show',
    'إضافة':'add','إزالة':'remove','إعادة':'reset','تراجع':'undo','نسخ':'duplicate','طباعة':'print','تثبيت':'pin','قفل':'lock',
    'ترتيب':'arrange','تحريك':'move','تكبير':'zoom in','تصغير':'zoom out','تظليل':'shadow','تصدير':'export','اعتماد':'apply',
    'إلغاء':'cancel','تحديث':'update','استعادة':'restore','اختيار':'select','الافتراضي':'default','افتراضي':'default',
    'مخصصة':'custom','مخصص':'custom','سريع':'quick','سريعة':'quick','غير':'not','معاير':'calibrated','دائري':'round',
    'دائرية':'round','مستطيل':'rectangular','مستطيلة':'rectangular','مزدوج':'double','مزدوجة':'double','مفرد':'single',
    'مفردة':'single','داخلي':'interior','خارجي':'exterior','جانبي':'side','زاوية':'corner','حديثة':'modern'
  };

  function translateArText(input){
    let src = String(input ?? '');
    if (!AR.test(src)) return src;
    const lead = (src.match(/^\s*/)||[''])[0];
    const trail = (src.match(/\s*$/)||[''])[0];
    const core = src.trim();
    if (exact[core]) return lead + exact[core] + trail;
    let out = core;
    const sorted = phrases.slice().sort((a,b)=>b[0].length-a[0].length);
    sorted.forEach(([a,b]) => { out = out.split(a).join(b); });
    out = out.replace(/[\u0600-\u06FF]+/g, w => words[w] || '');
    out = out.replace(/\s{2,}/g,' ').replace(/\s+([،,.!?؛:])/g,'$1').trim();
    out = out.replace(/،/g,',').replace(/؛/g,';');
    return lead + (out || 'Message') + trail;
  }

  function rememberNode(n){
    if (n.nodeType === Node.TEXT_NODE) {
      if (AR.test(n.nodeValue || '') && n.__fpArabicText === undefined) n.__fpArabicText = n.nodeValue;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    for (const a of ['title','placeholder','aria-label','alt']) {
      const v = n.getAttribute(a);
      if (v && AR.test(v) && n['__fpArabicAttr_'+a] === undefined) n['__fpArabicAttr_'+a] = v;
    }
    if (n.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(n.type || '')) {
      const v = n.value;
      if (v && AR.test(v) && n.__fpArabicInputValue === undefined) n.__fpArabicInputValue = v;
    }
  }

  function applyNode(n, lang){
    if (n.nodeType === Node.TEXT_NODE) {
      rememberNode(n);
      if (n.__fpArabicText !== undefined) n.nodeValue = lang === 'en' ? translateArText(n.__fpArabicText) : n.__fpArabicText;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    if (n.id === 'fpLanguageToggle') return;
    rememberNode(n);
    for (const a of ['title','placeholder','aria-label','alt']) {
      const k='__fpArabicAttr_'+a;
      if (n[k] !== undefined) n.setAttribute(a, lang === 'en' ? translateArText(n[k]) : n[k]);
    }
    if (n.__fpArabicInputValue !== undefined) n.value = lang === 'en' ? translateArText(n.__fpArabicInputValue) : n.__fpArabicInputValue;
    for (const child of Array.from(n.childNodes)) applyNode(child,lang);
  }

  function ensureToggle(){
    if (document.getElementById('fpLanguageToggle')) return;
    const style = document.createElement('style');
    style.id = 'furniplan-v115-language-style';
    style.textContent = [
      'header{position:relative!important}',
      '.fpLanguageToggle{position:absolute;top:8px;right:10px;z-index:12000;min-width:104px;height:38px;padding:0 15px;border-radius:11px;border:1px solid rgba(255,255,255,.62);background:#0b5d93;color:#fff;font:800 14px/1 Arial,Tahoma,sans-serif;box-shadow:0 5px 15px rgba(0,0,0,.25);cursor:pointer;white-space:nowrap}',
      '.fpLanguageToggle:hover{filter:brightness(1.12)}',
      '@media(max-width:1100px){.fpLanguageToggle{top:5px;right:6px;min-width:88px;height:32px;padding:0 10px;font-size:12px}}'
    ].join('');
    document.head.appendChild(style);
    const btn = document.createElement('button');
    btn.id = 'fpLanguageToggle';
    btn.className = 'fpLanguageToggle';
    btn.type = 'button';
    btn.addEventListener('click', () => applyLanguage(currentLang === 'en' ? 'ar' : 'en', true));
    const header = document.querySelector('header') || document.body;
    header.appendChild(btn);
  }

  function updateToggle(){
    const b = document.getElementById('fpLanguageToggle');
    if (!b) return;
    if (currentLang === 'en') {
      b.textContent = 'العربية';
      b.setAttribute('aria-label','Switch to Arabic');
      b.setAttribute('title','Switch to Arabic');
    } else {
      b.textContent = 'English';
      b.setAttribute('aria-label','التبديل إلى الإنجليزية');
      b.setAttribute('title','التبديل إلى الإنجليزية');
    }
  }

  function applyLanguage(lang, save){
    currentLang = lang === 'ar' ? 'ar' : 'en';
    applying = true;
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    if (document.body) {
      document.body.dir = document.documentElement.dir;
      applyNode(document.body,currentLang);
    }
    applying = false;
    updateToggle();
    if (save) { try { localStorage.setItem(STORAGE_KEY,currentLang); } catch(_){} }
    window.dispatchEvent(new CustomEvent('furniplan-language-changed',{detail:{language:currentLang}}));
  }

  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  const nativePrompt = window.prompt.bind(window);
  window.alert = msg => nativeAlert(currentLang === 'en' ? translateArText(msg) : msg);
  window.confirm = msg => nativeConfirm(currentLang === 'en' ? translateArText(msg) : msg);
  window.prompt = (msg,def) => nativePrompt(currentLang === 'en' ? translateArText(msg) : msg,def);

  const NativeDOMParser = window.DOMParser;
  if (NativeDOMParser) {
    window.DOMParser = class extends NativeDOMParser {
      parseFromString(str,type){
        const doc = super.parseFromString(str,type);
        if (currentLang === 'en' && doc && doc.body) applyNode(doc.body,'en');
        return doc;
      }
    };
  }

  const observer = new MutationObserver(records => {
    if (applying) return;
    applying = true;
    for (const m of records) {
      if (m.type === 'characterData') applyNode(m.target,currentLang);
      for (const n of Array.from(m.addedNodes || [])) applyNode(n,currentLang);
    }
    applying = false;
    updateToggle();
  });

  function init(){
    ensureToggle();
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch(_){}
    currentLang = saved === 'ar' ? 'ar' : 'en';
    applyLanguage(currentLang,false);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.FurniPlanLanguage = {
    set: lang => applyLanguage(lang,true),
    get: () => currentLang,
    translate: translateArText
  };
})();
// ===== End FurniPlan V115 Bilingual UI =====

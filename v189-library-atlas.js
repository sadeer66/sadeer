/* FurniPlan V189 — iPad/iPhone atlas library.
   The desktop keeps the familiar grid; Apple touch devices get one crisp,
   paged image board so opening "All" never creates hundreds of image nodes. */
(()=>{try{
  const appleTouch=/iP(?:ad|hone|od)/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&(navigator.maxTouchPoints||0)>1);
  if(!appleTouch){window.__FURNIPLAN_V189_ATLAS_LIBRARY__='desktop-grid';return;}

  const style=document.createElement('style');
  style.textContent=`
    .fullLibGrid.fpAtlasGrid{display:block!important;min-height:0!important;padding:0!important}
    .fpAtlasWrap{display:grid;gap:8px;min-height:0}
    .fpAtlasCanvas{display:block;width:100%;max-width:100%;border:1px solid #385878;border-radius:13px;background:#132238;touch-action:manipulation;box-shadow:0 8px 20px rgba(0,0,0,.22)}
    .fpAtlasNav{display:flex;align-items:center;justify-content:space-between;gap:7px;color:#d9ebff;font-weight:800;font-size:12px}
    .fpAtlasNav button{appearance:none;border:1px solid #466989;border-radius:9px;background:#203a57;color:#fff;padding:7px 11px;font:inherit;font-weight:800;min-width:78px}
    .fpAtlasNav button:disabled{opacity:.42}
    @media (max-width:640px){.fpAtlasNav button{padding:6px 9px;min-width:64px}.fpAtlasNav{font-size:11px}}
  `;
  document.head.appendChild(style);

  let atlasPage=0,atlasKey='',atlasToken=0,atlasCanvas=null,atlasHits=[],atlasItems=[];
  const isPortrait=()=>matchMedia('(orientation:portrait)').matches;
  const isOpen=()=>fullLibraryModal&&fullLibraryModal.classList.contains('open');
  const atlasWords=()=>fullLibUiLang()==='en'
    ?{previous:'Previous',next:'Next',page:'Board',of:'of',empty:'No matching items'}
    :{previous:'السابق',next:'التالي',page:'لوحة',of:'من',empty:'لا توجد قطع مطابقة'};
  const pageSize=()=>isPortrait()?12:16;
  const fitText=(ctx,text,max)=>{
    text=String(text||'');if(ctx.measureText(text).width<=max)return text;
    while(text.length>1&&ctx.measureText(text+'…').width>max)text=text.slice(0,-1);
    return text+'…';
  };
  const roundRect=(ctx,x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2));};
  function drawAtlasBase(canvas,part){
    const rect=canvas.getBoundingClientRect();
    const cssW=Math.max(300,Math.round(rect.width||canvas.parentElement?.clientWidth||640));
    const rows=Math.max(1,Math.ceil(part.length/(isPortrait()?3:4)));
    const cssH=isPortrait()?Math.max(485,Math.min(680,rows*151+28)):Math.max(405,Math.min(610,rows*142+28));
    const dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);canvas.style.height=cssH+'px';
    const ctx=canvas.getContext('2d',{alpha:false});ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#132238';ctx.fillRect(0,0,cssW,cssH);
    const cols=isPortrait()?3:4,gap=9,margin=10;
    const cw=(cssW-margin*2-gap*(cols-1))/cols,ch=(cssH-margin*2-gap*(rows-1))/rows;
    atlasHits=[];
    part.forEach((obj,i)=>{
      const col=i%cols,row=Math.floor(i/cols),x=margin+col*(cw+gap),y=margin+row*(ch+gap);
      atlasHits.push({x,y,w:cw,h:ch,obj});
      roundRect(ctx,x,y,cw,ch,11);ctx.fillStyle='#edf3f9';ctx.fill();
      ctx.strokeStyle=String(obj.id)===String(fullLibSelectedId)?'#f6a623':'#b7c8d9';ctx.lineWidth=String(obj.id)===String(fullLibSelectedId)?3:1;ctx.stroke();
      ctx.fillStyle='#d9e6f1';roundRect(ctx,x+5,y+5,cw-10,ch*.68,8);ctx.fill();
      ctx.fillStyle='#102840';ctx.font='700 '+Math.max(10,Math.min(13,cw/12))+'px Tahoma,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=fullLibUiLang()==='ar'?'rtl':'ltr';
      const label=fitText(ctx,fullLibDisplayName(obj),cw-12);ctx.fillText(label,x+cw/2,y+ch*.78);
      ctx.fillStyle='#526b83';ctx.font='700 '+Math.max(9,Math.min(11,cw/14))+'px Tahoma,Arial';
      ctx.fillText(obj.w+' × '+obj.h+' '+fullLibUnit(),x+cw/2,y+ch*.91);
    });
    return {ctx,cssW,cssH,dpr};
  }
  function drawImageContain(ctx,img,hit){
    const pad=10,top=hit.y+7,w=hit.w-pad*2,h=hit.h*.68-14;
    if(!img||!img.naturalWidth||!img.naturalHeight){
      ctx.fillStyle=hit.obj.color||'#bfa781';roundRect(ctx,hit.x+pad,top,w,h,8);ctx.fill();return;
    }
    const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);
    const dw=Math.max(1,img.naturalWidth*scale),dh=Math.max(1,img.naturalHeight*scale),dx=hit.x+(hit.w-dw)/2,dy=top+(h-dh)/2;
    ctx.save();ctx.shadowColor='rgba(15,31,48,.22)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
  }
  function paintSelection(){
    if(!atlasCanvas)return;
    /* Full redraw keeps the highlight exact and avoids a second retained bitmap. */
    if(atlasItems.length){
      const token=++atlasToken;
      drawAtlasBase(atlasCanvas,atlasItems);
      loadBoardImages(atlasItems,token);
    }
  }
  function loadBoardImages(part,token){
    let cursor=0;const workers=Math.min(4,part.length);
    const worker=()=>new Promise(resolve=>{
      const next=()=>{
        const obj=part[cursor++];if(!obj){resolve();return;}
        if(!obj.src){next();return;}
        const image=new Image();image.decoding='async';
        image.onload=()=>{if(token===atlasToken&&atlasCanvas){const hit=atlasHits.find(h=>h.obj===obj);if(hit)drawImageContain(atlasCanvas.getContext('2d'),image,hit);}image.src='';next();};
        image.onerror=()=>{image.src='';next();};
        try{image.src=resolveAssetSrc(obj.src);}catch(_){next();}
      };next();
    });
    return Promise.all(Array.from({length:workers},worker));
  }
  function renderAtlas(){
    if(!isOpen())return;
    const all=sortedLibraryItems(fullLibFiltered()),size=pageSize(),key=fullLibCategory+'|'+(fullLibSearch.value||'')+'|'+fullLibUiLang()+'|'+size;
    if(key!==atlasKey){atlasKey=key;atlasPage=0;}
    const pages=Math.max(1,Math.ceil(all.length/size));atlasPage=Math.max(0,Math.min(atlasPage,pages-1));
    const part=all.slice(atlasPage*size,atlasPage*size+size);atlasItems=part;atlasToken++;
    fullLibGrid.replaceChildren();fullLibGrid.classList.add('fpAtlasGrid');
    fullLibCount.textContent=all.length;
    fullLibGridTitle.textContent=fullLibCategory==='الكل'?(fullLibUiLang()==='en'?'All Library Items':'كل قطع المكتبة'):fullLibDisplayCategory(fullLibCategory);
    const words=atlasWords(),wrap=document.createElement('div'),nav=document.createElement('div'),prev=document.createElement('button'),next=document.createElement('button'),caption=document.createElement('span'),canvas=document.createElement('canvas');
    wrap.className='fpAtlasWrap';nav.className='fpAtlasNav';canvas.className='fpAtlasCanvas';canvas.setAttribute('aria-label',fullLibGridTitle.textContent);
    prev.type=next.type='button';prev.textContent='‹ '+words.previous;next.textContent=words.next+' ›';caption.textContent=words.page+' '+(atlasPage+1)+' '+words.of+' '+pages;
    prev.disabled=atlasPage===0;next.disabled=atlasPage>=pages-1;
    prev.onclick=()=>{atlasPage--;renderAtlas();};next.onclick=()=>{atlasPage++;renderAtlas();};
    nav.append(prev,caption,next);wrap.append(nav,canvas);fullLibGrid.append(wrap);atlasCanvas=canvas;
    if(!part.length){caption.textContent=words.empty;return;}
    const myToken=atlasToken;
    requestAnimationFrame(()=>{if(myToken!==atlasToken)return;drawAtlasBase(canvas,part);loadBoardImages(part,myToken);});
    canvas.addEventListener('pointerup',event=>{
      const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*(canvas.width/Math.max(1,r.width))/(canvas.width/Math.max(1,r.width)),y=(event.clientY-r.top)*(canvas.height/Math.max(1,r.height))/(canvas.height/Math.max(1,r.height));
      const hit=atlasHits.find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);if(hit)selectFullLibItem(hit.obj);
    });
  }
  renderFullLibGrid=renderAtlas;
  fpUpdateFullLibSelection=id=>{fullLibSelectedId=id;paintSelection();};
  fullLibSearch.oninput=renderAtlas;
  const priorClose=closeFullLibrary;
  closeFullLibrary=function(){atlasToken++;atlasCanvas=null;atlasHits=[];atlasItems=[];priorClose();};
  const languageObserver=new MutationObserver(()=>{if(isOpen()){renderFullLibCategories();renderAtlas();drawFullLibPreview();}});
  languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  window.__FURNIPLAN_V189_ATLAS_LIBRARY__=true;
}catch(error){console.error('FurniPlan V189 atlas library',error);}})();

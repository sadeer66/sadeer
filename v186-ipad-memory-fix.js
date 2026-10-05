/* FurniPlan V188 — progressive iPad library */
(()=>{try{
  const B=(navigator.maxTouchPoints||0)>1?18:32;
  let list=[],shown=0,observer=null,bound=false;
  const stop=()=>{try{observer&&observer.disconnect();}catch(_){}observer=null;};
  const load=img=>{if(!img.getAttribute('src')&&img.dataset.fpSrc)img.src=img.dataset.fpSrc;};
  function watch(){
    stop();const panel=fullLibGrid.closest('.fullLibGridPanel');
    const imgs=[...fullLibGrid.querySelectorAll('img[data-fp-src]')];
    if(!('IntersectionObserver' in window)){imgs.slice(0,B).forEach(load);return;}
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const img=entry.target;
      if(entry.isIntersecting)load(img);
      else if(!img.closest('.selected'))img.removeAttribute('src');
    }),{root:panel,rootMargin:'220px 0px',threshold:.01});
    imgs.forEach(img=>observer.observe(img));
  }
  function makeCard(obj){
    const card=document.createElement('button');card.type='button';
    card.className='fullLibCard'+(obj.id===fullLibSelectedId?' selected':'');
    card.dataset.fpid=String(obj.id);card.dataset.fpItemId=String(obj.id);
    if(obj.src){const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.dataset.fpSrc=resolveAssetSrc(obj.src);card.appendChild(img);}
    else {const box=document.createElement('div');box.className='fullLibGeneric';box.style.background=obj.color||'#bfa781';card.appendChild(box);}
    const name=document.createElement('b'),size=document.createElement('span');
    name.textContent=fullLibDisplayName(obj);size.textContent=obj.w+' × '+obj.h+' '+fullLibUnit();
    card.append(name,size);card.onclick=()=>selectFullLibItem(obj);return card;
  }
  function addBatch(){
    if(shown>=list.length)return;
    const frag=document.createDocumentFragment();
    list.slice(shown,shown+B).forEach(obj=>frag.appendChild(makeCard(obj)));
    shown=Math.min(list.length,shown+B);fullLibGrid.appendChild(frag);watch();
  }
  renderFullLibGrid=function(){
    if(!fullLibraryModal.classList.contains('open'))return;
    stop();list=sortedLibraryItems(fullLibFiltered());shown=0;fullLibGrid.replaceChildren();
    fullLibCount.textContent=list.length;
    fullLibGridTitle.textContent=fullLibCategory==='الكل'?(fullLibUiLang()==='en'?'All Library Items':'كل قطع المكتبة'):fullLibDisplayCategory(fullLibCategory);
    const panel=fullLibGrid.closest('.fullLibGridPanel');if(panel)panel.scrollTop=0;
    addBatch();
    requestAnimationFrame(()=>{if(panel&&panel.scrollHeight<=panel.clientHeight+1)addBatch();});
    if(panel&&!bound){bound=true;panel.addEventListener('scroll',()=>{
      if(panel.scrollTop+panel.clientHeight>=panel.scrollHeight-360)addBatch();
    },{passive:true});}
  };
  fullLibSearch.oninput=renderFullLibGrid;
  const oldClose=closeFullLibrary;
  closeFullLibrary=function(){stop();list=[];shown=0;oldClose();};
  window.__FURNIPLAN_V188_PROGRESSIVE_LIBRARY__=true;
}catch(error){console.error('FurniPlan V188 library',error);}})();

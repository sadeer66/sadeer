/* FurniPlan V186 — iPad/WebKit memory-safe fullscreen library */
(()=>{
  try{
    let fp186Observer=null;

    function fp186StopObserver(){
      try{if(fp186Observer)fp186Observer.disconnect();}catch(_){}
      fp186Observer=null;
    }

    function fp186ObserveImages(){
      fp186StopObserver();
      if(!('IntersectionObserver' in window)){
        fullLibGrid.querySelectorAll('img[data-fp-src]').forEach(img=>{
          img.src=img.dataset.fpSrc||'';
          img.removeAttribute('data-fp-src');
        });
        return;
      }
      fp186Observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          const img=entry.target;
          const src=img.dataset.fpSrc;
          if(src&&!img.src){
            img.src=src;
            img.removeAttribute('data-fp-src');
          }
          fp186Observer.unobserve(img);
        }
      },{root:fullLibGrid.closest('.fullLibGridPanel'),rootMargin:'180px 0px',threshold:0.01});
      fullLibGrid.querySelectorAll('img[data-fp-src]').forEach(img=>fp186Observer.observe(img));
    }

    renderFullLibGrid=function(){
      if(!fullLibraryModal.classList.contains('open'))return;
      fp186StopObserver();
      const list=sortedLibraryItems(fullLibFiltered());
      fullLibGrid.innerHTML='';
      fullLibCount.textContent=list.length;
      fullLibGridTitle.textContent=fullLibCategory==='الكل'
        ?(fullLibUiLang()==='en'?'All Library Items':'كل قطع المكتبة')
        :fullLibDisplayCategory(fullLibCategory);

      const frag=document.createDocumentFragment();
      list.forEach(obj=>{
        const c=document.createElement('button');
        c.type='button';
        c.className='fullLibCard'+(obj.id===fullLibSelectedId?' selected':'');
        c.dataset.fpItemId=String(obj.id);

        if(obj.src){
          const img=document.createElement('img');
          img.loading='lazy';
          img.decoding='async';
          img.alt='';
          img.dataset.fpSrc=resolveAssetSrc(obj.src);
          c.appendChild(img);
        }else{
          const g=document.createElement('div');
          g.className='fullLibGeneric';
          g.style.background=obj.color||'#bfa781';
          c.appendChild(g);
        }

        const b=document.createElement('b');
        b.textContent=fullLibDisplayName(obj);
        const s=document.createElement('span');
        s.textContent=obj.w+' × '+obj.h+' '+fullLibUnit();
        c.appendChild(b);c.appendChild(s);
        c.onclick=()=>selectFullLibItem(obj);
        frag.appendChild(c);
      });
      fullLibGrid.appendChild(frag);
      requestAnimationFrame(fp186ObserveImages);
    };

    selectFullLibItem=function(item){
      const base=typeof item==='object'?item:furniture.find(x=>x.id===item);
      if(!base||!furniture.includes(base))return;
      fullLibSelectedItem=base;
      const id=base.id;
      window.fullLibPreviewZoom=1;
      fullLibSelectedId=id;
      fullLibName.value=fullLibDisplayName(base);
      fullLibW.value=base.w||100;
      fullLibH.value=base.h||60;
      fullLibRot.value=0;
      fullLibColor.value=base.color||'#bfa781';
      fullLibTint.checked=false;
      fullLibLayer='front';
      syncFullLibLayerButtons();

      /* Critical V186 fix: never rebuild the image grid just to change selection. */
      for(const card of fullLibGrid.children){
        card.classList.toggle('selected',card.dataset.fpItemId===String(id));
      }
      drawFullLibPreview();
    };

    const fp186OldClose=closeFullLibrary;
    closeFullLibrary=function(){
      fp186StopObserver();
      fp186OldClose();
      /* Remove decoded catalogue images after closing so iPad can reclaim memory. */
      requestAnimationFrame(()=>{
        if(fullLibraryModal.classList.contains('open'))return;
        fullLibGrid.querySelectorAll('img').forEach(img=>{
          try{img.removeAttribute('src');img.src='';}catch(_){}
        });
        fullLibGrid.innerHTML='';
      });
    };

    window.__FURNIPLAN_V186_IPAD_MEMORY_FIX__=true;
  }catch(err){
    console.error('FurniPlan V186 iPad memory fix',err);
  }
})();
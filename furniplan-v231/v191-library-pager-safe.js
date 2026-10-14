/* FurniPlan V191 — pagination wrapper only.
   It never rebuilds a library card, preview, or editing control. */
(()=>{try{
  const originalFiltered=fullLibFiltered;
  const originalRender=renderFullLibGrid;
  const touchDevice=(navigator.maxTouchPoints||0)>1;
  const pageSize=()=>touchDevice?(matchMedia('(orientation:portrait)').matches?12:16):24;
  let page=0,key='';

  const allItems=()=>originalFiltered();
  const pageInfo=()=>{
    const list=allItems();
    const currentKey=fullLibCategory+'|'+(fullLibSearch.value||'')+'|'+fullLibUiLang();
    if(currentKey!==key){key=currentKey;page=0;}
    if(fullLibCategory!=='الكل')return {list,page:0,pages:1,size:list.length||1,isAll:false};
    const size=pageSize(),pages=Math.max(1,Math.ceil(list.length/size));
    page=Math.max(0,Math.min(page,pages-1));
    return {list,page,pages,size,isAll:true};
  };
  fullLibFiltered=function(){
    const info=pageInfo();
    return info.isAll?info.list.slice(info.page*info.size,info.page*info.size+info.size):info.list;
  };
  const words=()=>fullLibUiLang()==='en'
    ?{previous:'Previous',next:'Next',page:'Page',of:'of'}
    :{previous:'السابق',next:'التالي',page:'صفحة',of:'من'};
  function addPager(){
    const existing=fullLibGrid.querySelector('.fpLibPager');if(existing)existing.remove();
    const info=pageInfo();if(!info.isAll||info.pages<2)return;
    const w=words(),nav=document.createElement('nav'),prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('span');
    nav.className='fpLibPager';nav.setAttribute('aria-label',fullLibUiLang()==='en'?'Library pages':'صفحات المكتبة');
    prev.type=next.type='button';prev.textContent='‹ '+w.previous;next.textContent=w.next+' ›';
    label.textContent=w.page+' '+(info.page+1)+' '+w.of+' '+info.pages;
    prev.disabled=info.page===0;next.disabled=info.page>=info.pages-1;
    prev.onclick=()=>{page--;renderFullLibGrid();};
    next.onclick=()=>{page++;renderFullLibGrid();};
    nav.append(prev,label,next);fullLibGrid.prepend(nav);
  }
  const style=document.createElement('style');
  style.textContent=`
    .fullLibGrid .fpLibPager{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 4px;color:#d9ebff;font:800 13px Tahoma,Arial}
    .fullLibGrid .fpLibPager button{appearance:none;border:1px solid #557a9b;border-radius:9px;background:#234561;color:#fff;padding:8px 13px;font:inherit;min-width:88px}
    .fullLibGrid .fpLibPager button:disabled{opacity:.42}
    @media (max-width:640px){.fullLibGrid .fpLibPager{font-size:12px}.fullLibGrid .fpLibPager button{padding:7px 10px;min-width:72px}}
  `;
  document.head.appendChild(style);
  renderFullLibGrid=function(){originalRender();addPager();};
  fullLibSearch.oninput=renderFullLibGrid;
  window.addEventListener('orientationchange',()=>{if(fullLibraryModal.classList.contains('open'))renderFullLibGrid();},{passive:true});
  window.__FURNIPLAN_V191_PAGER_SAFE__=true;
}catch(error){console.error('FurniPlan V191 pager',error);}})();

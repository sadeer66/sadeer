/* FurniPlan V195 — portrait dock categories + swipe navigation for All pages. */
(()=>{
  'use strict';

  const style=document.createElement('style');
  style.id='furniplan-v195-library-layout-swipe';
  style.textContent=`
    /* Portrait library drawer: categories stay inside the same drawer on the physical left. */
    @media (max-width:900px) and (orientation:portrait){
      aside .mobileLibrarySection .libraryBrowser{
        display:grid!important;
        grid-template-columns:clamp(82px,18vw,146px) minmax(0,1fr)!important;
        grid-template-rows:minmax(0,1fr)!important;
        grid-template-areas:"categories items"!important;
        direction:ltr!important;
        align-items:stretch!important;
        gap:6px!important;
        min-height:0!important;
        height:100%!important;
      }
      aside .mobileLibrarySection .categoryList{
        grid-area:categories!important;
        display:flex!important;
        flex-direction:column!important;
        flex-wrap:nowrap!important;
        align-items:stretch!important;
        align-content:flex-start!important;
        direction:rtl!important;
        width:100%!important;
        min-width:0!important;
        min-height:0!important;
        height:100%!important;
        max-height:none!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
        touch-action:pan-y!important;
        padding:1px 1px 5px!important;
        background:#0b1220!important;
        scrollbar-width:thin!important;
      }
      aside .mobileLibrarySection .categoryList .catBtn{
        flex:0 0 auto!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        min-height:31px!important;
        height:auto!important;
        margin:0!important;
        padding:5px 4px!important;
        font-size:8.5px!important;
        line-height:1.12!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
      }
      aside .mobileLibrarySection #library{
        grid-area:items!important;
        display:grid!important;
        direction:rtl!important;
        min-width:0!important;
        min-height:0!important;
        height:100%!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
        touch-action:pan-y!important;
      }
    }

    /* The grid still scrolls vertically; a deliberate horizontal finger swipe turns a page. */
    .fullLibGridPanel,.fullLibGrid{
      touch-action:pan-y!important;
      overscroll-behavior-x:contain!important;
    }
  `;
  document.head.appendChild(style);

  const grid=typeof fullLibGrid!=='undefined'?fullLibGrid:document.getElementById('fullLibGrid');
  const modal=typeof fullLibraryModal!=='undefined'?fullLibraryModal:document.getElementById('fullLibraryModal');
  if(!grid||!modal)return;

  const canTurnPage=()=>{
    try{return modal.classList.contains('open')&&fullLibCategory==='الكل';}
    catch(_){return false;}
  };
  const turnPage=(direction)=>{
    if(!canTurnPage())return;
    const pager=grid.querySelector('.fpLibPager');
    if(!pager)return;
    const buttons=pager.querySelectorAll('button');
    const button=direction==='next'?buttons[1]:buttons[0];
    if(button&&!button.disabled)button.click();
  };

  let startX=0,startY=0,tracking=false;
  grid.addEventListener('touchstart',event=>{
    if(event.touches.length!==1||!canTurnPage()){tracking=false;return;}
    const touch=event.touches[0];
    startX=touch.clientX;startY=touch.clientY;tracking=true;
  },{passive:true});
  grid.addEventListener('touchcancel',()=>{tracking=false;},{passive:true});
  grid.addEventListener('touchend',event=>{
    if(!tracking||!canTurnPage()){tracking=false;return;}
    tracking=false;
    const touch=event.changedTouches&&event.changedTouches[0];
    if(!touch)return;
    const dx=touch.clientX-startX,dy=touch.clientY-startY;
    if(Math.abs(dx)<52||Math.abs(dx)<=Math.abs(dy)*1.25)return;
    // Left = next page, right = previous page; identical to the visible buttons.
    turnPage(dx<0?'next':'previous');
  },{passive:true});

  window.__FURNIPLAN_V195_LIBRARY_LAYOUT_SWIPE__=true;
})();

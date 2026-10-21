/* One header with original contextual controls in the right sidebar. */
(function(){'use strict';
function boot(){
 const $=id=>document.getElementById(id),aside=document.querySelector('.app>aside'),sub=$('sewerSubRibbon');
 if(!aside||!sub||!window.SewerContextUI)return;
 document.documentElement.classList.add('sewer-side-ui');
 const tablet=/iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&(/Macintosh/i.test(navigator.userAgent)||navigator.platform==='MacIntel'));
 if(tablet)document.documentElement.classList.add('sewer-tablet-ui');
 if(/iPhone|iPod/i.test(navigator.userAgent))document.documentElement.classList.add('sewer-iphone-ui');
 // Preserve native vertical scrolling; relocated toolbar listeners must not consume wheel events.
 aside.addEventListener('wheel',event=>event.stopPropagation(),{capture:true,passive:true});
 const panel=document.createElement('section');panel.id='sewerSidePanel';
 const heading=document.createElement('div');heading.id='sewerSideHeading';
 const title=document.createElement('strong');const close=document.createElement('button');close.type='button';close.textContent='×';
 heading.append(title,close);panel.append(heading,sub);aside.prepend(panel);
 const library=$('library')?.closest('.section');if(library){library.classList.add('sewerSideLibrary');library.id='sewerSideLibrarySection';}
 const full=document.createElement('button');full.type='button';full.id='sewerFullLibraryTab';full.className='sewerRibbonButton';
 $('sewerTab_library').before(full);full.onclick=()=>window.openFullLibrary?.();
 const icons={
 file:'<path d="M3 7h7l2 2h9l-3 11H3z"/><path d="M3 7V4h7l2 3"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',
 measure:'<path d="m3 16 13-13 5 5L8 21zM12 7l3 3M8 11l3 3M4 15l3 3"/>',
 text:'<path d="M4 5h16M12 5v15M8 20h8M4 5v3M20 5v3"/>',
 color:'<path d="m4 13 8-8 8 8-8 8zM7 3l7 7"/><path d="M21 17s-3 3-3 4a3 3 0 0 0 6 0c0-1-3-4-3-4" transform="translate(-2 -1) scale(.9)"/>',
 visibility:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 pipes:'<path d="M3 3h7v7h11v7H3zM2 3h9M21 9v9"/>',
 library:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M14 3v18M17 7h1M17 11h1M17 15h1"/>',
 settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 full:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'};
 for(const [key,paths] of Object.entries(icons)){
  const b=key==='full'?full:$('sewerTab_'+key);if(!b)continue;
  const label=document.createElement('span');label.className='sewerTabLabel';label.textContent=b.textContent;
  b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';b.append(label);
 }
 const en=()=>window.FurniPlanLanguage?.get?.()==='en';
 function labels(){full.querySelector('.sewerTabLabel').textContent=en()?'Full library':'مكتبة كاملة';close.setAttribute('aria-label',en()?'Close side panel':'إغلاق اللوحة الجانبية');title.textContent=$('sewerTab_'+(aside.dataset.section||'file'))?.textContent||'';}
 function show(key,reopen){
  const changed=aside.dataset.section!==key;aside.dataset.section=key;
  document.body.classList.toggle('sewer-side-library',key==='library');
  if(changed||reopen){document.body.classList.remove('sewer-side-closed','sewer-hide-library');aside.scrollTop=0;}
  labels();
 }
 close.onclick=()=>document.body.classList.add('sewer-side-closed');
 window.SewerSideUI={show};
 window.addEventListener('furniplan-language-changed',()=>requestAnimationFrame(labels));
 show('file',true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

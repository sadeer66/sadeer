(()=>{function boot(){
 const mobile=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform));if(!mobile)return;
 document.documentElement.classList.add('sewer-mobile-v137');
 const phone=/iPhone|iPod/i.test(navigator.userAgent);if(phone)document.documentElement.classList.add('sewer-phone-v137');
 const scroll=document.getElementById('sewerPrimaryScroll'),brand=document.getElementById('sewerCompactBrand');if(scroll&&brand)scroll.prepend(brand);
 const aside=document.querySelector('.app>aside');if(!aside)return;
 // Let vertical swipes reach the sidebar instead of the relocated horizontal toolbar.
 for(const type of ['touchstart','touchmove','touchend','touchcancel'])aside.addEventListener(type,e=>{if(!e.target.closest('input[type=range],.touchDragHandle'))e.stopPropagation();},{capture:true,passive:true});
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();
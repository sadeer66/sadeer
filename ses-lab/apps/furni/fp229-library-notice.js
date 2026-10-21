(()=>{
function sync(){const footer=document.getElementById('fp225FooterInfo');if(!footer)return;let notice=document.getElementById('fp229LibraryNotice');if(!window.FP229LibrarySaveFailed){notice?.remove();return;}if(!notice){notice=document.createElement('span');notice.id='fp229LibraryNotice';notice.dataset.fp222Label='1';notice.setAttribute('role','status');notice.style.cssText='flex:0 0 auto;color:#ffd875;font:10px Tahoma;padding:0 5px;white-space:nowrap;';footer.prepend(notice);}notice.textContent=window.FurniPlanLanguage?.get()==='en'?'Library not saved in this browser — save the project to keep it.':'لم تُحفظ المكتبة في المتصفح — احفظ المشروع للاحتفاظ بها.';}
window.FP229LibraryNotice=sync;setTimeout(sync,2000);window.addEventListener('furniplan-language-changed',sync);
})();

/* V114: install before application startup so informational alerts never block entry. */
(()=>{
 'use strict';
 let notice=null,timer=0,pending=null,last='',lastTime=0;
 function show(message){
  const text=String(message??'').trim();if(!text)return;
  if(text===last&&Date.now()-lastTime<10000)return;
  last=text;lastTime=Date.now();pending=text;clearTimeout(timer);flush();
 }
 function flush(){
  if(!pending)return;
  const footer=document.querySelector('.appRights'),splash=document.getElementById('fpSplash');
  if(!footer||splash&&getComputedStyle(splash).display!=='none'){
   timer=setTimeout(flush,150);return;
  }
  if(!notice){notice=document.createElement('span');notice.id='sewerTemporaryNotice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');footer.prepend(notice);}
  notice.textContent=pending;notice.title=pending;notice.dir=window.FurniPlanLanguage?.get?.()==='en'?'ltr':'rtl';pending=null;notice.hidden=false;
  timer=setTimeout(()=>{notice.hidden=true;notice.textContent='';},6500);
 }
 window.SewerNotifications={show};
 window.alert=show;
 const style=document.createElement('style');style.textContent=`
 #sewerTemporaryNotice{display:block;flex:0 1 auto;min-width:0;max-width:75vw;font:11px/1.4 Tahoma,Arial;color:#fff3b0;white-space:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:0 6px;pointer-events:auto}
 #sewerTemporaryNotice[hidden]{display:none!important}
 #sewerTemporaryNotice::-webkit-scrollbar{display:none}
 `;document.head.appendChild(style);
})();

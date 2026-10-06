(function(){
'use strict';
const MASTER_NAME='SADEER Y. MOHAMMED',DEFAULT_MASTER='5231636373';
const byId=id=>document.getElementById(id);
const digits=v=>String(v??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/\D/g,'');
function getMaster(){try{return (db&&db.settings&&db.settings.masterCardNumber)||DEFAULT_MASTER}catch(e){return DEFAULT_MASTER}}
function ensureToolbarTop(){
 const paper=document.querySelector('.paper'),bar=document.querySelector('.control-zone');
 if(!paper||!bar)return;
 const header=paper.querySelector('.header');
 if(header&&bar.nextElementSibling!==header) paper.insertBefore(bar,header);
}
function ensurePayment(){
 let p=byId('masterPayment');
 if(!p){
  const sum=document.querySelector('.summary'); if(!sum)return;
  p=document.createElement('section');p.id='masterPayment';p.className='master-payment';
  p.innerHTML='<div class="master-payment-title">يمكنك الدفع بالماستر كارد</div><div class="master-payment-row"><div class="master-card-mark" aria-label="MasterCard"><div class="master-circles" aria-hidden="true"><span class="master-circle red"></span><span class="master-circle orange"></span></div><span class="master-card-word">MasterCard</span></div><div class="master-payment-divider" aria-hidden="true"></div><div class="master-payment-data"><strong class="master-payment-name" id="masterPaymentName">SADEER Y. MOHAMMED</strong><span class="master-payment-number" id="masterPaymentNumber"></span></div></div>';
  sum.insertAdjacentElement('afterend',p);
 }
 byId('masterPaymentName').textContent=MASTER_NAME;
 byId('masterPaymentNumber').textContent=getMaster();
}
function ensureSetting(){
 const form=byId('settingsForm'); if(!form)return;
 let input=byId('setMasterNumber');
 if(!input){
  const wrap=document.createElement('div');wrap.className='field';wrap.id='masterNumberSetting';
  wrap.innerHTML='<label for="setMasterNumber">رقم حساب الماستر كارد</label><input id="setMasterNumber" type="text" inputmode="numeric" autocomplete="off" maxlength="30" placeholder="رقم حساب الماستر كارد">';
  const logo=byId('setLogo')?.closest('.field');
  if(logo)logo.before(wrap);else form.querySelector('.actions')?.before(wrap);
  input=byId('setMasterNumber');
 }
 input.value=getMaster();
}
function bindSettings(){
 const open=byId('openSettings');
 if(open&&!open.dataset.v30){open.dataset.v30='1';open.addEventListener('click',()=>setTimeout(ensureSetting,0))}
 const form=byId('settingsForm');
 if(form&&!form.dataset.v30){
  form.dataset.v30='1';
  form.addEventListener('submit',ev=>{
   const input=byId('setMasterNumber'); if(!input)return;
   const value=digits(input.value);
   if(value.length<6||value.length>30){
    ev.preventDefault();ev.stopImmediatePropagation();
    const er=byId('settingsError'); if(er)er.textContent='رقم حساب الماستر كارد يجب أن يحتوي من 6 إلى 30 رقمًا.';
    input.focus();return;
   }
   input.value=value;
   try{if(db&&db.settings)db.settings.masterCardNumber=value}catch(e){}
   const out=byId('masterPaymentNumber'); if(out)out.textContent=value;
  },true);
 }
}
function grow(t){if(!t||!t.matches('.expense-table .details-cell textarea'))return;t.style.height='auto';t.style.height=Math.max(58,t.scrollHeight)+'px'}
function growAll(){document.querySelectorAll('.expense-table .details-cell textarea').forEach(grow)}
function cleanEscapes(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),arr=[];
 while(walker.nextNode())arr.push(walker.currentNode);
 for(const n of arr){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/i.test(p.tagName))continue;if(n.nodeValue&&n.nodeValue.includes('\\n'))n.nodeValue=n.nodeValue.replace(/\\n/g,' ')}
}
function init(){
 document.documentElement.dataset.wasoolatVersion='30-safe-responsive';
 const m=document.querySelector('meta[name="theme-color"]');if(m)m.content='#061a35';
 document.title='برنامج الوصولات — V30';
 ensureToolbarTop();ensurePayment();ensureSetting();bindSettings();growAll();cleanEscapes();
 document.addEventListener('input',e=>grow(e.target),true);
 const obs=new MutationObserver(()=>{ensureToolbarTop();ensurePayment();growAll();cleanEscapes()});
 obs.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('orientationchange',()=>setTimeout(()=>{ensureToolbarTop();growAll()},180));
 window.addEventListener('resize',()=>setTimeout(growAll,80),{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
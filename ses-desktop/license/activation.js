'use strict';
const get=id=>document.getElementById(id);
async function run(fn){for(const b of document.querySelectorAll('button'))b.disabled=true;try{const message=await fn();if(message)get('status').textContent=message;}catch(e){get('status').textContent=e.message;}finally{for(const b of document.querySelectorAll('button'))b.disabled=false;}}
async function refresh(){const info=await window.SESActivation.info();get('device').textContent=info.deviceId;get('logo').src=info.icon;if(info.license){get('status').textContent='مفعّل باسم '+info.license.customer;get('continue').hidden=false;}else if(!info.configured){get('status').textContent='هذه النسخة تنتظر ربط مفتاح المالك العام قبل إصدارها للمشترين.';get('import').disabled=true;}}
get('copy').onclick=()=>run(async()=>{await window.SESActivation.copyDevice();return'تم نسخ رمز الجهاز.';});
get('request').onclick=()=>run(async()=>{const r=await window.SESActivation.saveRequest();return r.saved?'تم حفظ ملف طلب التفعيل.':'';});
get('import').onclick=()=>run(async()=>{const r=await window.SESActivation.importLicense();if(r.cancelled)return;if(r.activated){await refresh();await window.SESActivation.launch();}});
get('continue').onclick=()=>run(()=>window.SESActivation.launch());
refresh().catch(e=>get('status').textContent=e.message);

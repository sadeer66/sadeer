/* Isolated trial storage; never writes stable version keys. */
(()=>{
 const prefix='furniplan-v222-trial:';const native=window.localStorage;
 window.FP222Storage={getItem:k=>native.getItem(prefix+k)??native.getItem(k),setItem:(k,v)=>native.setItem(prefix+k,v),removeItem:k=>native.removeItem(prefix+k)};
 let chain=Promise.resolve();
 function show(kind,message,value='') {const task=()=>new Promise(resolve=>{
 const en=window.FurniPlanLanguage?.get?.()==='en';const previous=document.activeElement;
 const layer=document.createElement('div');layer.style.cssText='position:fixed;inset:0;background:#020817b8;display:flex;align-items:center;justify-content:center;z-index:2147483647;padding:16px;box-sizing:border-box';
 const box=document.createElement('div');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.dir=en?'ltr':'rtl';box.style.cssText='width:420px;max-width:100%;background:#102238;color:#f4f8ff;border:1px solid #65839e;border-radius:14px;padding:22px;box-shadow:0 20px 70px #0009;font:14px/1.8 Tahoma,Arial';
 const title=document.createElement('strong');title.id='fp222DialogTitle';title.textContent=en?'FurniPlan — '+(kind==='confirm'?'Confirm':'Notice'):'FurniPlan — '+(kind==='confirm'?'تأكيد':'تنبيه');box.setAttribute('aria-labelledby',title.id);
 const text=document.createElement('p');text.textContent=String(window.FP222Translate?.(message)??message);text.style.whiteSpace='pre-wrap';box.append(title,text);
 const input=document.createElement('input');if(kind==='prompt'){input.value=value??'';input.style.cssText='box-sizing:border-box;width:100%;height:38px;background:#fff;color:#142234;border-radius:7px;padding:6px 10px';input.setAttribute('aria-label',String(message));box.append(input);}
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:18px';
 function done(v){layer.remove();document.removeEventListener('keydown',keys,true);previous?.focus?.();resolve(v);}
 const yes=document.createElement('button');yes.textContent=kind==='confirm'?(en?'Yes':'نعم'):(en?'OK':'موافق');yes.style.cssText='height:38px;min-width:85px;border:1px solid #2b9ad0;border-radius:7px;background:#075e8a;color:white;cursor:pointer';yes.onclick=()=>done(kind==='prompt'?input.value:true);actions.append(yes);
 let no;if(kind!=='alert'){no=document.createElement('button');no.textContent=kind==='confirm'?(en?'No':'كلا'):(en?'Cancel':'إلغاء');no.style.cssText=yes.style.cssText+';background:#293c50';no.onclick=()=>done(kind==='prompt'?null:false);actions.append(no);}
 function keys(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();done(kind==='prompt'?null:false);}else if(e.key==='Enter'&&document.activeElement===input){e.preventDefault();yes.click();}else if(e.key==='Tab'){const a=[...(kind==='prompt'?[input]:[]),yes,...(no?[no]:[])];let i=a.indexOf(document.activeElement);e.preventDefault();a[(i+(e.shiftKey?-1:1)+a.length)%a.length].focus();}else e.stopPropagation();}
 box.append(actions);layer.append(box);document.body.append(layer);document.addEventListener('keydown',keys,true);(kind==='prompt'?input:yes).focus();if(kind==='prompt')input.select();
 });const result=chain.then(task);chain=result.catch(()=>{});return result;}
 window.FP222Dialog={confirm:m=>show('confirm',m),prompt:(m,v)=>show('prompt',m,v),alert:m=>show('alert',m)};
 window.alert=m=>{show('alert',m);};
})();

window.FP222OpenVideo=function(url){
 const u=new URL(url),id=u.hostname.includes('youtu.be')?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.split('/').pop();
 if(!/^[A-Za-z0-9_-]{11}$/.test(id||'')){FP222Dialog.alert(window.FurniPlanLanguage?.get?.()==='en'?'Please enter a direct YouTube video link.':'يرجى إدخال رابط فيديو يوتيوب مباشر.');return;}
 const layer=document.createElement('div');layer.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#020817db;display:flex;align-items:center;justify-content:center;padding:16px';
 const box=document.createElement('section');box.style.cssText='width:min(900px,100%);padding:12px;background:#102238;border:1px solid #65839e;border-radius:14px';
 const close=document.createElement('button');close.textContent=window.FurniPlanLanguage?.get?.()==='en'?'Close ×':'إغلاق ×';close.style.cssText='height:38px;margin-bottom:10px';close.onclick=()=>layer.remove();
 const frame=document.createElement('iframe');frame.src='https://www.youtube.com/embed/'+id;frame.title='FurniPlan video';frame.allowFullscreen=true;frame.style.cssText='display:block;width:100%;aspect-ratio:16/9;border:0';box.append(close,frame);layer.append(box);document.body.append(layer);close.focus();
};

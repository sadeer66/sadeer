(() => {
 'use strict';
 const cleanName=s=>String(s||'').replace(/كنب[ةه]/g,'أريكة');
 const english=()=>window.FurniPlanLanguage?.get?.()==='en';
 const prior=fullLibDisplayName;
 fullLibDisplayName=function(obj){
  if(!obj)return english()?'Item':'قطعة';
  if(obj.customDisplayName)return obj.customDisplayName;
  const raw=cleanName(obj.name),def=furniture.find(d=>(d.id===obj.defId||(obj.src&&d.src===obj.src))&&(cleanName(d.name)===raw||d.nameEn===raw||d.en===raw));
  if(!english())return cleanName(def?.name||raw);
  const name=obj.nameEn||obj.en||def?.nameEn||def?.en;
  if(name)return name;
  return window.FurniPlanLanguage?.translate?.(raw)||prior({...obj,name:raw});
 };
 function normalizeLibrary(){for(const list of [furniture,defaultFurniture])for(const obj of list){obj.name=cleanName(obj.name);if(!obj.nameEn&&obj.en)obj.nameEn=obj.en;}}
 const render=renderLibrary;renderLibrary=function(){normalizeLibrary();return render.apply(this,arguments);};
 const oldTranslate=window.FurniPlanLanguage?.translate?.bind(window.FurniPlanLanguage);
 const dialogText={'ملف المشروع يحتوي على مكتبة أثاث محفوظة معه. هل ترغب بتحميلها أيضًا؟':'This project includes a saved furniture library. Would you like to load it too?','نعم':'Yes','كلا':'No'};
 if(oldTranslate)window.FurniPlanLanguage.translate=s=>dialogText[String(s).trim()]||oldTranslate(cleanName(s));
 function refresh(){normalizeLibrary();draw();scheduleUsedFurnitureSync(true);}
 window.addEventListener('furniplan-language-changed',refresh);
 async function confirmLibrary(){
  const previous=document.activeElement,overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:30000;background:#0007;display:flex;align-items:center;justify-content:center;padding:16px;';
  const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','fp219Question');panel.style.cssText='width:330px;max-width:100%;box-sizing:border-box;background:#142b45;color:white;padding:20px;border:1px solid #688099;border-radius:14px;box-shadow:0 15px 45px #0008;font:14px Tahoma;';
  const question=document.createElement('p');question.id='fp219Question';question.style.cssText='margin:0 0 20px;line-height:1.8;';const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;';
  const yes=document.createElement('button'),no=document.createElement('button');for(const btn of [yes,no]){btn.type='button';btn.style.cssText='flex:1;padding:10px;border:1px solid #7890a9;border-radius:7px;background:#233f5e;color:white;font:bold 14px Tahoma;';actions.appendChild(btn);}yes.style.background='#087ba3';panel.append(question,actions);overlay.appendChild(panel);document.body.appendChild(overlay);
  function translate(){panel.dir=english()?'ltr':'rtl';question.textContent=english()?'This project includes a saved furniture library. Would you like to load it too?':'ملف المشروع يحتوي على مكتبة أثاث محفوظة معه. هل ترغب بتحميلها أيضًا؟';yes.textContent=english()?'Yes':'نعم';no.textContent=english()?'No':'كلا';}
  translate();window.addEventListener('furniplan-language-changed',translate);yes.focus();
  return new Promise(resolve=>{function finish(value){window.removeEventListener('furniplan-language-changed',translate);overlay.remove();previous?.focus();resolve(value);}yes.onclick=()=>finish(true);no.onclick=()=>finish(false);overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish(false);}if(e.key==='Tab'){e.preventDefault();(document.activeElement===yes?no:yes).focus();}};});
 }
 window.FP219={cleanName,confirmLibrary};normalizeLibrary();renderLibrary();
})();

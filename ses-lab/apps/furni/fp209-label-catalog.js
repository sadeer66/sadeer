/* V209: bilingual plan labels; shared desktop/touch placement. */
(() => {
 'use strict';
 const defaults = `غرفة نوم|Bedroom
غرفة نوم رئيسية|Master Bedroom
غرفة نوم أطفال|Children’s Bedroom
غرفة ضيوف|Guest Bedroom
غرفة ملابس|Dressing Room
صالة معيشة|Living Room
صالة عائلية|Family Room
غرفة استقبال|Reception Room
مجلس|Majlis
غرفة طعام|Dining Room
مطبخ|Kitchen
مطبخ تحضيري|Prep Kitchen
مطبخ خارجي|Outdoor Kitchen
مخزن مؤن|Pantry
حمام|Bathroom
حمام رئيسي|Master Bathroom
حمام ضيوف|Guest Bathroom
دورة مياه|Toilet
منطقة استحمام|Shower Area
غرفة غسيل|Laundry Room
غرفة كوي|Ironing Room
غرفة خادمة|Maid’s Room
غرفة مكتب|Home Office
غرفة دراسة|Study Room
مكتبة|Library
غرفة ألعاب|Playroom
غرفة رياضة|Gym
غرفة صلاة|Prayer Room
غرفة متعددة الاستخدامات|Multipurpose Room
مدخل رئيسي|Main Entrance
مدخل جانبي|Side Entrance
مدخل خلفي|Rear Entrance
مدخل خدمة|Service Entrance
بهو المدخل|Entrance Hall
بهو|Lobby
ممر|Corridor
موزع|Hall
درج|Stairs
بيت الدرج|Stairwell
بسطة الدرج|Stair Landing
تحت الدرج|Under-Stair Space
مصعد|Elevator
بئر المصعد|Elevator Shaft
منور|Lightwell
فناء داخلي|Courtyard
حديقة داخلية|Indoor Garden
شرفة|Balcony
تراس|Terrace
سطح|Rooftop
حديقة|Garden
حديقة أمامية|Front Garden
حديقة خلفية|Back Garden
ساحة أمامية|Front Yard
ساحة خلفية|Backyard
ممر خارجي|Outdoor Walkway
جلسة خارجية|Outdoor Seating Area
كراج|Garage
موقف سيارات|Parking Area
مدخل سيارات|Driveway
غرفة حارس|Guard Room
غرفة سائق|Driver’s Room
مخزن|Storage Room
غرفة خدمات|Utility Room
غرفة كهرباء|Electrical Room
غرفة مولد|Generator Room
غرفة مضخات|Pump Room
غرفة خزانات|Water Tank Room
مسبح|Swimming Pool
نافورة|Fountain
منطقة شواء|BBQ Area
باب رئيسي|Main Door
باب داخلي|Interior Door
باب خارجي|Exterior Door
باب سحاب|Sliding Door
شباك|Window
بوابة|Gate
جدار|Wall
جدار فاصل|Partition Wall
عمود|Column
أرضية|Floor
سقف|Ceiling
فتحة تهوية|Ventilation Opening
مجرى خدمات|Service Shaft
حدود الأرض|Property Boundary
ارتداد أمامي|Front Setback
ارتداد خلفي|Rear Setback
ارتداد جانبي|Side Setback
الطابق الأرضي|Ground Floor
الطابق الأول|First Floor
الطابق الثاني|Second Floor
طابق سفلي|Basement
طابق نصفي|Mezzanine
ملحق|Annex
الطابق الثالث|Third Floor
الطابق الرابع|Fourth Floor
الطابق الخامس|Fifth Floor
عيادة|Clinic
محل|Shop
مكتب|Office
استقبال|Reception`.split('\n').map(row=>{const [ar,en]=row.split('|');return {ar,en};});
 const key='furniplanCustomLabelNamesV209';let extra=[];
 const valid=x=>x&&typeof x.ar==='string'&&typeof x.en==='string'&&x.ar.trim()&&x.en.trim();
 try{extra=JSON.parse(window.FP222Storage.getItem(key)||'[]').filter(valid);}catch{}
 let choice,search,results,openButton;
 const english=()=>window.FurniPlanLanguage?.get?.()==='en';
 function arm(text){
  if(!hasPlan()){setStatus(english()?'Upload a plan first':'ارفع الخارطة أولاً');return;}
  activateWorkingTool('labelPlace');pendingMapLabelText=text;
  const visibility=document.getElementById('mapLabelLayerToggle');visibility.checked=true;visibility.dispatchEvent(new Event('change'));
  points=[];selectedMeasureId=null;selectedMapLabelId=null;clearFurnitureSelection();syncSelectedPanel();updateInteractionCursor();draw();
  setStatus(english()?'Click the plan to place the label':'اضغط المكان المطلوب على الخارطة لإسقاط المسمى');
 }
 function refresh(){
  if(!choice)return;const old=choice.value;choice.replaceChildren();
  choice.add(new Option(english()?'Choose a label':'اختر المسمى',''));
  [...defaults,...extra].forEach((x,i)=>choice.add(new Option(x.ar+' — '+x.en,String(i))));
  choice.add(new Option(english()?'+ Add a new label':'+ إضافة مسمى جديد','add'));choice.value=old;
  choice.setAttribute('aria-label',english()?'Plan label names':'قائمة مسميات الخارطة');
  if(search){search.placeholder=english()?'Search Arabic / English':'ابحث بالعربي أو الإنكليزي';search.setAttribute('aria-label',search.placeholder);renderSearch();}
 }
 function renderSearch(all=false){
  if(!results)return;results.replaceChildren();const q=search.value.trim().toLocaleLowerCase();results.hidden=!q&&!all;if(!q&&!all)return;
  const normalize=t=>t.toLocaleLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F]/g,'');
  const matches=[...defaults,...extra].map((x,i)=>({x,i})).filter(({x})=>all||normalize(x.ar+' '+x.en).includes(normalize(q)));
  if(!matches.length){const empty=document.createElement('span');empty.textContent=english()?'No matching labels':'لا توجد مسميات مطابقة';results.appendChild(empty);}
  const width=Math.min(420,innerWidth-16),r=search.getBoundingClientRect();
  results.style.width=width+'px';results.style.left=Math.max(8,Math.min(r.left,innerWidth-width-8))+'px';results.style.top=r.bottom+4+'px';results.style.maxHeight=Math.max(80,Math.min(320,innerHeight-r.bottom-12))+'px';
  matches.forEach(({x,i})=>{const b=document.createElement('button');b.type='button';b.dir='rtl';b.setAttribute('data-fp-bilingual','');const ar=document.createElement('span'),en=document.createElement('span');ar.dir='rtl';en.dir='ltr';ar.textContent=x.ar;en.textContent=x.en;const metric=document.createElement('canvas').getContext('2d');if(metric){metric.font='12px Tahoma';const total=metric.measureText(x.ar).width+metric.measureText(x.en).width;b.style.fontSize=Math.min(12,(width-40)*12/Math.max(1,total))+'px';}b.append(ar,en);b.onclick=()=>{choice.value=String(i);search.value='';openButton.textContent=x.ar+' — '+x.en+' ▾';results.hidden=true;arm(x.ar+'\n'+x.en);};results.appendChild(b);});
  if(all){const add=document.createElement('button');add.type='button';add.textContent=english()?'+ Add a new label':'+ إضافة مسمى جديد';add.onclick=()=>{results.hidden=true;dialog(true);};results.appendChild(add);}

 }
 function dialog(catalog){
  document.getElementById('fp209LabelDialog')?.remove();
  const d=document.createElement('dialog');d.id='fp209LabelDialog';d.dir=english()?'ltr':'rtl';
  d.innerHTML='<form><h3></h3><label for="fp209Arabic">الاسم بالعربي / Arabic</label><input id="fp209Arabic" dir="rtl" maxlength="250" required><label for="fp209English">الاسم بالإنكليزي / English</label><input id="fp209English" dir="ltr" maxlength="250"><p role="status"></p><div><button type="submit"></button><button type="button"></button></div></form>';
  d.querySelector('h3').textContent=catalog?(english()?'Add a label to the list':'إضافة مسمى للقائمة'):(english()?'Place a custom label':'إضافة مسمى على الخارطة');
  const a=d.querySelector('#fp209Arabic'),e=d.querySelector('#fp209English');e.required=catalog;
  const buttons=d.querySelectorAll('button');buttons[0].textContent=english()?'Confirm':'موافق';buttons[1].textContent=english()?'Cancel':'إلغاء';
  const close=()=>{d.close();d.remove();};buttons[1].onclick=close;d.oncancel=ev=>{ev.preventDefault();close();};
  d.querySelector('form').onsubmit=ev=>{
   ev.preventDefault();const ar=a.value.trim(),en=e.value.trim();if(!ar||(catalog&&!en))return;
   if(catalog){const all=[...defaults,...extra];let index=all.findIndex(x=>x.ar===ar&&x.en.toLowerCase()===en.toLowerCase());
    if(index<0){extra.push({ar,en});index=defaults.length+extra.length-1;try{window.FP222Storage.setItem(key,JSON.stringify(extra));}catch{d.querySelector('p').textContent='تعذر حفظ الاسم. جرّب مجدداً.';extra.pop();return;}}
    refresh();choice.value=String(index);openButton.textContent=ar+' — '+en+' ▾';
   }
   close();arm(ar+(en?'\n'+en:''));
  };
  document.body.appendChild(d);d.showModal();a.focus();
 }
 window.FP209Labels={custom:()=>dialog(false),serialize:()=>extra.map(x=>({...x})),restore(rows){if(!Array.isArray(rows))return;rows.filter(valid).forEach(x=>{if(![...defaults,...extra].some(y=>y.ar===x.ar&&y.en===x.en))extra.push({ar:x.ar,en:x.en});});try{window.FP222Storage.setItem(key,JSON.stringify(extra));}catch{}refresh();}};
 function init(){
  const css=document.createElement('style');css.textContent='#fp209LabelChoice{width:210px;max-width:38vw;flex:none;height:42px;background:#193653;color:#fff;border:1px solid #70849c;border-radius:7px;font:12px Tahoma;padding:5px}#fp209LabelDialog{background:#152438;color:#fff;border:1px solid #63788e;border-radius:14px;padding:20px;width:380px;max-width:calc(100vw - 24px);max-height:90dvh;overflow:auto;box-sizing:border-box}#fp209LabelDialog::backdrop{background:#0008}#fp209LabelDialog label{display:block;margin:12px 0 6px}#fp209LabelDialog input{width:100%;box-sizing:border-box;background:#fff;color:#111;padding:10px;font:18px Tahoma}#fp209LabelDialog form>div{display:flex;gap:10px;margin-top:15px}';document.head.appendChild(css);
  const box=document.createElement('div');box.id='fp209LabelPicker';box.style.cssText='display:flex;flex-direction:column;gap:3px;flex:none;width:210px;max-width:38vw';
  search=document.createElement('input');search.type='search';search.id='fp209LabelSearch';search.setAttribute('data-fp-bilingual','');search.autocomplete='off';search.style.cssText='box-sizing:border-box;width:100%;height:29px;padding:5px;border:1px solid #70849c;border-radius:6px;background:#fff;color:#111;font:12px Tahoma';
  choice=document.createElement('select');choice.id='fp209LabelChoice';choice.style.height='29px';choice.hidden=true;choice.setAttribute('data-fp-bilingual','');openButton=document.createElement('button');openButton.id='fp210OpenLabels';openButton.type='button';openButton.setAttribute('data-fp-bilingual','');openButton.textContent='اختر المسمى / Choose label ▾';openButton.onclick=()=>{if(!results.hidden)results.hidden=true;else renderSearch(true);};box.append(search,choice,openButton);document.getElementById('v44Label').after(box);
  results=document.createElement('div');results.id='fp209LabelResults';results.setAttribute('data-fp-bilingual','');results.hidden=true;results.style.cssText='position:fixed;z-index:12000;overflow:auto;width:260px;max-width:calc(100vw - 8px);background:#152438;border:1px solid #70849c;border-radius:7px;box-shadow:0 8px 24px #0008;padding:5px;box-sizing:border-box';document.body.appendChild(results);
  const searchCSS=document.createElement('style');searchCSS.textContent='#fp209LabelResults button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:start;padding:8px 6px;margin:2px 0;background:#193653;color:white;font:clamp(8px,2.5vw,12px) Tahoma;white-space:nowrap;min-width:0}#fp209LabelResults button span{white-space:nowrap;flex:0 1 auto;min-width:0}#fp210OpenLabels{width:100%;height:29px;padding:3px;font:10px Tahoma;white-space:nowrap;overflow:hidden;background:#193653}#fp209LabelPicker #fp209LabelChoice{display:none!important}';document.head.appendChild(searchCSS);
  search.oninput=()=>renderSearch();search.onkeydown=e=>{if(e.key==='Escape'){results.hidden=true;}if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('button')?.focus();}if(e.key==='Enter'){e.preventDefault();results.querySelector('button')?.click();}};
  results.onkeydown=e=>{const buttons=[...results.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();buttons[Math.min(i+1,buttons.length-1)]?.focus();}if(e.key==='ArrowUp'){e.preventDefault();i<=0?search.focus():buttons[i-1]?.focus();}if(e.key==='Escape'){results.hidden=true;search.focus();}};
  document.addEventListener('pointerdown',e=>{if(!box.contains(e.target)&&!results.contains(e.target))results.hidden=true;});window.addEventListener('resize',()=>results.hidden=true);document.getElementById('modernTopToolbar').addEventListener('scroll',()=>results.hidden=true,{passive:true});refresh();
  choice.onchange=()=>{if(choice.value==='add'){choice.value='';dialog(true);}else if(choice.value!==''){const x=[...defaults,...extra][Number(choice.value)];if(x)arm(x.ar+'\n'+x.en);}};
  document.getElementById('addMapLabelBtn').onclick=()=>dialog(false);
  document.getElementById('v44Label').onclick=()=>{const x=choice.value!==''&&choice.value!=='add'?[...defaults,...extra][Number(choice.value)]:null;x?arm(x.ar+'\n'+x.en):dialog(false);};
  window.addEventListener('furniplan-language-changed',refresh);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* FurniPlan V196 — restore supplied library materials as direct, lightweight assets. */
(()=>{
  'use strict';

  const root='assets/v196/';
  const number=n=>String(n).padStart(2,'0');
  const make=(name,en,w,h,category,folder,index)=>({
    name,en,w,h,category,src:root+folder+'/'+number(index)+'.webp',color:'#bfa781',isCustom:false
  });

  const people=[
    ['رجل عربي جالس 1','Seated Arab Man 1'],['امرأة جالسة 1','Seated Woman 1'],
    ['امرأة بعباءة جالسة 1','Seated Woman in Abaya 1'],['رجل جالس 1','Seated Man 1'],
    ['رجل عربي واقف 1','Standing Arab Man 1'],['شاب جالس 1','Seated Young Man 1'],
    ['امرأة واقفة 1','Standing Woman 1'],['رجل كبير واقف','Standing Elderly Man'],
    ['امرأة جالسة 2','Seated Woman 2'],['رجل عربي واقف 2','Standing Arab Man 2'],
    ['رجل جالس 2','Seated Man 2'],['امرأة بعباءة واقفة','Standing Woman in Abaya'],
    ['امرأة جالسة 3','Seated Woman 3'],['شاب جالس 2','Seated Young Man 2'],
    ['امرأة جالسة 4','Seated Woman 4'],['امرأة محجبة جالسة','Seated Hijabi Woman'],
    ['شاب واقف 1','Standing Young Man 1'],['امرأة محجبة واقفة','Standing Hijabi Woman'],
    ['شاب واقف 2','Standing Young Man 2'],['رجل عربي جالس 2','Seated Arab Man 2'],
    ['رجل جالس 3','Seated Man 3'],['رجل عربي واقف 3','Standing Arab Man 3'],
    ['امرأة واقفة 2','Standing Woman 2'],['رجل عربي جالس 3','Seated Arab Man 3'],
    ['شاب جالس 3','Seated Young Man 3']
  ].map(([name,en],i)=>make(name,en,60,60,'أشخاص','people',i+1));

  const pets=[
    ['حمامة','Dove',28,20],['كلب ذهبي','Golden Dog',90,40],['أرنب','Rabbit',45,30],
    ['سلحفاة','Turtle',42,32],['طائر بادجي','Budgie',22,14],['طائر ملون','Colorful Bird',24,15],
    ['قطة جالسة','Sitting Cat',38,32],['كلب مستلقٍ','Lying Dog',85,45],['طائر أصفر','Yellow Bird',22,14],
    ['قطة ماشية','Walking Cat',65,28]
  ].map(([name,en,w,h],i)=>make(name,en,w,h,'حيوانات أليفة','pets',i+1));

  const indoorPlants=Array.from({length:37},(_,i)=>{
    const n=i+1;
    return make('نبات داخلي '+number(n),'Indoor Plant '+number(n),n%4===0?65:50,n%4===0?65:50,'نباتات داخلية','indoor-plants',n);
  });

  const rugs=Array.from({length:18},(_,i)=>{
    const n=i+1;
    return make('سجادة '+number(n),'Rug '+number(n),160,160,'سجاد','rugs',n);
  });

  const livingRoom=[
    ['أريكة ثنائية حديثة','Modern Two-seat Sofa',170,90],['أريكة ثنائية خشبية','Wooden Two-seat Sofa',175,90],
    ['كرسي عريض حديث','Modern Wide Chair',100,95],['أريكة ثنائية ملكية','Royal Two-seat Sofa',175,95],
    ['أريكة ثلاثية حديثة','Modern Three-seat Sofa',220,90],['كرسي مفرد حديث','Modern Armchair',95,90],
    ['كرسي مفرد خشبي','Wooden Armchair',95,90],['أريكة ثلاثية خشبية','Wooden Three-seat Sofa',220,90],
    ['كرسي ملكي مفرد','Royal Armchair',100,95],['أريكة ثلاثية ملكية','Royal Three-seat Sofa',220,100]
  ].map(([name,en,w,h],i)=>make(name,en,w,h,'صالة','living-room',i+1));

  const lighting=[
    ['ثريا دائرية','Round Chandelier',45,45],['سكة إنارة ثلاثية','Triple Track Light',60,25],
    ['سبوت سقفي','Ceiling Spotlight',45,45],['إنارة جدارية كريستال','Crystal Wall Light',60,25],
    ['إنارة خطية','Linear Light',60,25],['مصباح طاولة دائري','Round Table Lamp',60,25],
    ['ثريا دائرية صغيرة','Small Round Chandelier',45,45],['إنارة جدارية نصف دائرية','Half-round Wall Light',60,25],
    ['إنارة جدارية كريستال 2','Crystal Wall Light 2',60,25],['سبوت سقفي 2','Ceiling Spotlight 2',45,45],
    ['سبوت سقفي 3','Ceiling Spotlight 3',45,45],['إنارة زاوية خطية','Corner Linear Light',60,25],
    ['إنارة جدارية صناعية','Industrial Wall Light',60,25]
  ].map(([name,en,w,h],i)=>make(name,en,w,h,'إنارة','lighting',i+1));

  const recovered=[...people,...pets,...indoorPlants,...rugs,...livingRoom,...lighting];
  const translations={
    'سجاد':'Rugs',
    ...Object.fromEntries(rugs.map(x=>[x.name,x.en]))
  };

  function ensureCategoryOrder(){
    try{
      if(typeof EN==='object')Object.assign(EN,translations);
      if(typeof FP174_CATEGORY_ALIASES==='object'){
        FP174_CATEGORY_ALIASES['سجاد']='سجاد';
        FP174_CATEGORY_ALIASES['سجادات']='سجاد';
      }
      if(Array.isArray(FP174_CATEGORY_ORDER)&&!FP174_CATEGORY_ORDER.includes('سجاد')){
        const at=Math.max(0,FP174_CATEGORY_ORDER.indexOf('صالة')+1);
        FP174_CATEGORY_ORDER.splice(at,0,'سجاد');
      }
    }catch(_){ }
  }

  function removePetFurniture(list){
    if(!Array.isArray(list))return;
    for(let i=list.length-1;i>=0;i--){
      if(list[i]&&String(list[i].category||'').trim()==='حيوانات أليفة')list.splice(i,1);
    }
  }

  const normalText=value=>String(value||'').normalize('NFKC').toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[\sـ\-_/\\.,،:؛()[\]{}]+/g,'');

  function sameCategory(candidate,definition){
    return normalText(candidate&&candidate.category)===normalText(definition.category);
  }

  function sameItem(candidate,definition){
    if(!candidate||!sameCategory(candidate,definition))return false;
    const candidateName=normalText(candidate.name);
    const definitionName=normalText(definition.name);
    const candidateEn=normalText(candidate.nameEn||candidate.en);
    const definitionEn=normalText(definition.nameEn||definition.en);
    return Boolean(
      (candidateName&&candidateName===definitionName)||
      (candidateEn&&definitionEn&&candidateEn===definitionEn)
    );
  }

  /* Preserve the first copy of an existing lighting item and remove exact repeats.
     This runs after the supplied lights are merged, so a matching old entry is
     refreshed rather than appended as a second card in the lighting album. */
  function removeLightingDuplicates(list){
    if(!Array.isArray(list))return;
    const names=new Set();
    const englishNames=new Set();
    const sources=new Set();
    for(let i=0;i<list.length;){
      const item=list[i];
      if(!item||normalText(item.category)!==normalText('إنارة')){
        i++;
        continue;
      }
      const name=normalText(item.name);
      const en=normalText(item.nameEn||item.en);
      const src=String(item.src||'').trim();
      const duplicate=(name&&names.has(name))||(en&&englishNames.has(en))||(src&&sources.has(src));
      if(duplicate){
        list.splice(i,1);
        continue;
      }
      if(name)names.add(name);
      if(en)englishNames.add(en);
      if(src)sources.add(src);
      i++;
    }
  }

  function mergeInto(list,prefix){
    if(!Array.isArray(list))return;
    /* The Pets category must contain only the supplied animals. */
    removePetFurniture(list);
    recovered.forEach((definition,index)=>{
      const existing=list.find(candidate=>sameItem(candidate,definition));
      if(existing&&definition.category!=='حيوانات أليفة'){
        Object.assign(existing,definition,{isCustom:false});
      }else{
        list.push({...definition,id:prefix+'_'+index});
      }
    });
    removeLightingDuplicates(list);
  }

  function refreshViews(){
    try{buildCategoryButtons();renderLibrary();}catch(_){ }
    try{renderFullLibCategories();renderFullLibGrid();}catch(_){ }
  }

  function applyRestore(){
    try{
      ensureCategoryOrder();
      mergeInto(furniture,'v196');
      try{mergeInto(defaultFurniture,'v196_default');}catch(_){ }
      try{saveLibraryState();}catch(_){ }
      refreshViews();
      window.__FURNIPLAN_V196_LIBRARY_MATERIALS__=true;
    }catch(error){console.error('FurniPlan V196 material restore',error);}
  }

  applyRestore();
  window.addEventListener('furniplan-language-changed',refreshViews);
})();

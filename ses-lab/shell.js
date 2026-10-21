'use strict';
const programs=[
 {id:'color',name:'ColorPlan',ar:'تلوين المخطط',version:'V11.86',path:'smart-render-v11.74/?v=1186',crop:'100 155 840 340',icon:'350 155 275 235',desc:'لوّن مخططك، وأضف الخامات والإضاءة لتحوّله إلى عرض جميل وواضح.'},
 {id:'furni',name:'FurniPlan',ar:'تخطيط الأثاث',version:'V240',path:'furniplan-v233/?v=240',crop:'1165 140 590 350',icon:'1310 145 250 220',desc:'رتّب الأثاث على مخططك، واضبط مقاساته لتختار أفضل توزيع للمساحات.'},
 {id:'sewer',name:'SewerPlan',ar:'تمديدات المجاري',version:'V137',path:'sewerplan-v128/?v=137',crop:'1165 620 590 350',icon:'1310 625 255 235',desc:'خطّط شبكة المجاري، ووزّع التوصيلات مع حساب أطوال الأنابيب وأعداد الملحقات.'},
 {id:'electric',name:'ElectricalPlan',ar:'مخطط الكهرباء',version:'V61',path:'electricalplan-v53/?v=61',crop:'220 630 555 330',icon:'365 635 260 240',desc:'وزّع نقاط الكهرباء والإنارة والأجهزة على المخطط لتوضيح أماكنها وتنظيمها.'}
].filter(p=>['color','furni'].includes(p.id));
const englishDescriptions={"color":"Color your plan with finishes and lighting for a clear, polished view.","furni":"Place and size furniture to find the best layout for your space.","sewer":"Plan drainage routes, place fittings, and count pipes and accessories.","electric":"Position power points, lights, and devices clearly on your plan."};
let descriptionLanguage='ar';
try{descriptionLanguage=localStorage.getItem('ses-lab-description-language')==='en'?'en':'ar';}catch{}
const $=id=>document.getElementById(id),frames=new Map();let active=null,timeout;
const cropSvg=(p)=>{const [x,y,w,h]=p.icon.split(' ');return `<svg viewBox="${p.icon}" role="img" aria-label="${p.name}" preserveAspectRatio="xMidYMid meet" style="overflow:hidden"><defs><clipPath id="art-${p.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="assets/programs.png" width="1919" height="1080" clip-path="url(#art-${p.id})"/></svg>`;};
programs.forEach((p,index)=>{const tab=document.createElement('button');tab.className='app-tab';tab.dataset.program=p.id;tab.setAttribute('aria-pressed','false');tab.innerHTML=`${cropSvg(p,true)}<span><b dir="ltr">${p.name}</b>${p.ar}</span>`;tab.onclick=()=>openProgram(p.id);$('appTabs').append(tab);const card=document.createElement('button');card.className='program-card';card.dataset.program=p.id;card.innerHTML=`<span class="program-number" aria-label="البرنامج ${index+1}">${index+1}</span>${cropSvg(p)}<div class="card-copy"><b class="program-name" dir="ltr">${p.name}</b><strong>${p.ar}</strong><small>${p.desc}</small><span class="open-label">فتح البرنامج <b aria-hidden="true">←</b></span></div>`;card.onclick=()=>openProgram(p.id);$('programGrid').append(card)});
function applyDescriptionLanguage(){
 const english=descriptionLanguage==='en';
 for(const p of programs){const text=document.querySelector('.program-card[data-program="'+p.id+'"] .card-copy small');text.textContent=english?englishDescriptions[p.id]:p.desc;text.dir=english?'ltr':'rtl';text.lang=english?'en':'ar';
 const card=text.closest('.program-card');
 card.querySelector('.program-name').hidden=!english;
 card.querySelector('strong').hidden=english;
 card.querySelector('.open-label').innerHTML=(english?'Open program':'فتح البرنامج')+' <b aria-hidden="true">←</b>';
 document.querySelector('.app-tab[data-program="'+p.id+'"] span').innerHTML='<b dir="'+(english?'ltr':'rtl')+'">'+(english?p.name:p.ar)+'</b>';
 }
 document.querySelector('.eyebrow').hidden=!english;
 document.querySelector('.intro-copy h1').hidden=english;
 $('descriptionLanguage').textContent=english?'عربي':'English';
 $('descriptionLanguage').setAttribute('aria-label',english?'عرض الشرح بالعربية':'Show descriptions in English');
 $('descriptionLanguage').setAttribute('aria-pressed',String(english));
}
$('descriptionLanguage').onclick=()=>{descriptionLanguage=descriptionLanguage==='ar'?'en':'ar';try{localStorage.setItem('ses-lab-description-language',descriptionLanguage);}catch{}applyDescriptionLanguage();};
applyDescriptionLanguage();

function openProgram(id){window.SESProject.switchTo(id).catch(e=>document.getElementById("projectStatus").textContent=e.message)}

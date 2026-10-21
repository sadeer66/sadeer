/* Shared on-screen labels for engineering and realistic views. */
(function(){
'use strict';
const key='sewerplan_trial101-label-style-v74',defaults={weight:700,shadowColor:'#000000',shadowOffset:1,size:16,color:'#172b42',outline:2,outlineColor:'#ffffff',shadow:2,shadowDark:35};
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch(_){}
const state={...defaults,...saved};
for(const [k,min,max] of [['weight',400,900],['shadowOffset',0,10],['size',10,32],['outline',0,6],['shadow',0,15],['shadowDark',0,100]])state[k]=Math.max(min,Math.min(max,Number(state[k])||0));
for(const k of ['color','outlineColor','shadowColor'])if(!/^#[0-9a-f]{6}$/i.test(state[k]))state[k]=defaults[k];
function unit(){const c=document.getElementById('canvas');return c?c.width/Math.max(1,c.getBoundingClientRect().width):1;}
function size(){return state.size*unit();}
function prepare(c){const u=unit();c.font=state.weight+' '+size()+'px Tahoma,Arial,sans-serif';c.textBaseline='middle';c.fillStyle=state.color;c.strokeStyle=state.outlineColor;c.lineWidth=state.outline*u;c.lineJoin='round';const rgb=state.shadowColor.match(/[0-9a-f]{2}/gi).map(h=>parseInt(h,16));c.shadowColor='rgba('+rgb.join(',')+','+state.shadowDark/100+')';c.shadowBlur=state.shadow*u;c.shadowOffsetX=state.shadowOffset*u;c.shadowOffsetY=state.shadowOffset*u;}
function paint(c,t,x,y){if(state.outline>0)c.strokeText(t,x,y);c.fillText(t,x,y);}
window.SewerLabelStyle={unit,size,prepare,paint,snapshot:()=>({...state}),restore:value=>{Object.assign(state,value);for(const k of Object.keys(state)){const el=document.getElementById('sewerLabel_'+k);if(el){el.value=state[k];const out=el.parentElement.querySelector('output');if(out)out.textContent=el.type==='range'?state[k]:'';}}try{localStorage.setItem(key,JSON.stringify(state));}catch(_){}}};
function boot(){
 const host=document.getElementById('modernTopToolbar')||document.querySelector('.toolbar');if(!host)return;
 const panel=document.createElement('div');panel.id='sewerLabelSettingsPanel';panel.dir='rtl';panel.setAttribute('role','group');panel.setAttribute('aria-label','خصائص المسميات');
 const controls=[['size','حجم الكتابة','range',10,32,1],['color','لون الكتابة','color'],['weight','سمك الخط','range',400,900,100],['outline','سماكة الحد الخارجي','range',0,6,.5],['outlineColor','لون الحد الخارجي','color'],['shadowColor','لون الظل','color'],['shadow','سمك الظل / نعومته','range',0,15,1],['shadowOffset','امتداد الظل','range',0,10,.5],['shadowDark','غمق الظل','range',0,100,5]];
 controls.forEach(([k,title,type,min,max,step])=>{const row=document.createElement('label');row.className='slRow';const label=document.createElement('span');label.textContent=title;const input=document.createElement('input');input.type=type;input.id='sewerLabel_'+k;input.value=state[k];input.setAttribute('aria-label',title);const out=document.createElement('output');if(type==='range'){input.min=min;input.max=max;input.step=step;out.textContent=state[k];}row.append(label,input,out);panel.appendChild(row);input.addEventListener('input',()=>{state[k]=type==='range'?Number(input.value):input.value;out.textContent=type==='range'?state[k]:'';try{localStorage.setItem(key,JSON.stringify(state));}catch(_){}if(typeof draw==='function')draw();});input.addEventListener('pointerdown',e=>e.stopPropagation());});
 host.appendChild(panel);
 const css=document.createElement('style');css.textContent=`
 #sewerLabelSettingsPanel{position:static!important;display:flex;flex:0 0 auto;align-items:center;gap:10px;width:max-content;max-width:none;margin:0;padding:3px 8px;background:transparent;border:0;border-radius:0;box-shadow:none;color:#fff;direction:rtl}
 #sewerLabelSettingsPanel .slRow{display:grid!important;grid-template-columns:100px 25px;grid-template-rows:16px 25px;align-items:center;gap:2px 4px;flex:0 0 auto;margin:0!important;padding:3px 8px!important;min-width:0!important;width:129px!important;background:#14283d;border:1px solid #41576c;border-radius:7px;color:#fff;font:11px Tahoma,Arial,sans-serif}
 #sewerLabelSettingsPanel .slRow>span{grid-column:1 / -1;text-align:center;white-space:nowrap}
 #sewerLabelSettingsPanel .slRow input[type=range]{width:100px!important;min-width:0;touch-action:none;accent-color:#8dcaf1;height:22px;margin:0}
 #sewerLabelSettingsPanel .slRow input[type=color]{grid-column:1 / -1;width:100%!important;min-width:0;height:23px!important;padding:1px;border:1px solid #7993ab;border-radius:4px;cursor:pointer}
 #sewerLabelSettingsPanel .slRow output{font-size:10px;text-align:center}
 #sewerLabelSettingsPanel .slRow:has(input[type=color]){width:78px!important;grid-template-columns:78px}
 #sewerLabelSettingsPanel .slRow:has(input[type=color]) output{display:none}
 html body.sewer-ribbon-ui #sewerSubRibbon #modernTopToolbar #sewerPane_text{flex-wrap:nowrap!important;overflow:visible!important;min-width:0;align-items:center;height:58px!important;min-height:58px!important;max-height:58px!important}
 html body.sewer-ribbon-ui:has(#sewerTab_text.active) #sewerSubRibbon{height:76px!important;min-height:76px!important;max-height:76px!important;flex-basis:76px!important}
 html body.sewer-ribbon-ui:has(#sewerTab_text.active) #sewerSubRibbon #modernTopToolbar{height:62px!important;min-height:62px!important;max-height:62px!important;overflow:visible!important}
 html body.sewer-ribbon-ui #sewerSubRibbon #modernTopToolbar .sewerCreationOutline label{color:#f1f5f9!important;opacity:1!important}
 html body.sewer-ribbon-ui #sewerSubRibbon #modernTopToolbar .sewerCreationOutline output{color:#fff!important}
 #sewerLabelSettingsPanel .slRow{box-sizing:content-box!important;height:43px!important;min-height:43px!important;max-height:43px!important;overflow:visible!important}

 `;document.head.appendChild(css);
 for(const event of ['pointerdown','touchstart'])panel.addEventListener(event,e=>{if(e.target.closest('input'))e.stopPropagation();});

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

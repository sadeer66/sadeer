(function(){
 'use strict';
 let settings={size:10,strength:22};
 function normalize(s){return {size:Math.min(50,Math.max(0,Number(s.size)||0)),strength:Math.min(100,Math.max(0,Number(s.strength)||0))};}
 try{const saved=JSON.parse(window.FP222Storage.getItem('furniplanShadowV197')||'null');if(saved)settings=normalize(saved);}catch(e){}
 function sync(){for(const key of ['size','strength']){const input=document.getElementById('fp197Shadow'+key),value=document.getElementById('fp197Shadow'+key+'Value');if(input)input.value=settings[key];if(value)value.textContent=settings[key]+(key==='strength'?'%':'');}}
 window.FP197Shadow={get:()=>({...settings}),set:s=>{settings=normalize(s);sync();try{window.FP222Storage.setItem('furniplanShadowV197',JSON.stringify(settings));}catch(e){}},apply:g=>{g.shadowColor='rgba(0,0,0,'+(settings.strength/100)+')';g.shadowBlur=settings.size;g.shadowOffsetX=0;g.shadowOffsetY=settings.size*.3;}};
 document.addEventListener('DOMContentLoaded',function(){
  const row=document.getElementById('modernSliderRow');if(!row)return;
  for(const key of ['size','strength']){
   const box=document.createElement('div');box.className='modernSliderBox';box.title=key==='size'?'حجم ظل القطع':'شدة ظل القطع';
   box.innerHTML='<span class="sliderGlyph" aria-hidden="true">'+(key==='size'?'◯':'◐')+'</span><input id="fp197Shadow'+key+'" type="range" min="0" max="'+(key==='size'?50:100)+'" step="1" aria-label="'+box.title+'"><span class="sliderValue" id="fp197Shadow'+key+'Value"></span>';
   row.appendChild(box);box.querySelector('input').oninput=function(){settings[key]=Number(this.value);FP197Shadow.set(settings);const toggle=document.getElementById('shadowToggle');if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('change'));}if(typeof draw==='function')draw();};
  }
  sync();
 });
})();

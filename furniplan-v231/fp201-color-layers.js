/* Non-destructive map colour masks. Coordinates are normalized to the map. */
(function(){
 'use strict';
 var layers=[],draft=null,tool='',operation='add',points=[],pixels=null,sourceImage=null,selected=-1,revision=0;
 var selectionUndo=[],selectionRedo=[];
 var top=document.getElementById('modernTopToolbar'),row=document.getElementById('modernSliderRow');
 var group=document.createElement('div');group.id='fp201ColorGroup';group.className='topToolGroup colorLayerTools';top.appendChild(group);
 var paths={undo:'M9 4L3 10l6 6M3 10h11a7 7 0 0 1 7 7',redo:'M15 4l6 6-6 6M21 10H10a7 7 0 0 0-7 7',polygon:'M4 5L19 3 21 18 7 21Z M3 4h3v3H3z M18 2h3v3h-3z',wand:'M5 20L17 8M13 4v-3M20 7h3M18 2l2-2M4 10H1',add:'M12 4v16M4 12h16',subtract:'M4 12h16',invert:'M4 4h16v16H4zM4 4l16 16M4 20V4h16',color:'M12 3C8 8 5 12 5 16a7 7 0 0 0 14 0c0-4-3-8-7-13Z',ok:'M4 12l5 6L21 5',cancel:'M5 5l14 14M19 5L5 19',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15'};
 function icon(key){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[key]+'"/></svg>';}
 function button(id,key,label,fn){var b=document.createElement('button');b.id=id;b.type='button';b.className='modernIconBtn';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=icon(key)+'<span class="iconLabel">'+label+'</span>';b.onclick=fn;group.appendChild(b);return b;}
 var poly=button('colorPolygon','polygon','تحديد نقاط',()=>start('polygon'));
 var wand=button('colorWand','wand','عصا سحرية',()=>start('wand'));
 var editButton=button('colorEdit','polygon','تعديل منطقة',pickRegion);
 var previewButton=button('colorPreview','color','معاينة اللون',previewSelection);previewButton.title='إغلاق الحدود ومعاينة اللون قبل التأكيد';
 var add=button('colorAdd','add','إضافة',()=>{operation='add';sync();});
 var sub=button('colorSubtract','subtract','طرح',()=>{operation='subtract';sync();});
 var inverse=button('colorInvert','invert','عكس التحديد',()=>{if(!draft)return;rememberSelection();invertMask(draft.mask);refresh();});
 function invertMask(mask){var c=mask.getContext('2d'),data=c.getImageData(0,0,mask.width,mask.height);for(var i=0;i<data.data.length;i+=4){data.data[i]=data.data[i+1]=data.data[i+2]=255;data.data[i+3]=255-data.data[i+3];}c.putImageData(data,0,0);}
 var undoSelectionButton=button('colorSelectionUndo','undo','تراجع تحديد',()=>stepSelection(false));
 var redoSelectionButton=button('colorSelectionRedo','redo','إعادة تحديد',()=>stepSelection(true));
 var materialButton=button('colorMaterials','color','الخامات',()=>{materialPanel.hidden=!materialPanel.hidden;if(!materialPanel.hidden)renderSwatches();sync();});
 group.insertBefore(materialButton,add);
 var picker=document.createElement('input');picker.type='color';picker.value='#334155';picker.title='لون الطبقة';picker.setAttribute('aria-label','لون الطبقة');picker.className='layerColorPicker';group.appendChild(picker);
 var confirmButton=button('colorConfirm','ok','تأكيد',confirmLayer),cancelButton=button('colorCancel','cancel','إلغاء',cancel);
 var choice=document.createElement('select');choice.title='تعديل طبقة لون محفوظة';choice.setAttribute('aria-label',choice.title);group.appendChild(choice);
 var eye=button('colorLayerVisible','eye','إظهار/إخفاء',()=>{if(selected<0)return;if(draft){draft.visible=!draft.visible;}else{var before=cloneEditState();layers[selected].visible=!layers[selected].visible;commitHistory(before);}sync();draw();});
 var del=button('colorLayerDelete','trash','حذف طبقة',()=>{if(selected<0)return;var before=cloneEditState();layers.splice(selected,1);cancel();list();commitHistory(before);});
 var materialPanel=document.createElement('section');materialPanel.id='fp201Materials';materialPanel.hidden=true;materialPanel.dir='rtl';document.body.appendChild(materialPanel);
 var heading=document.createElement('header');heading.innerHTML='<strong>اللون والخامة</strong>';var closePanel=document.createElement('button');closePanel.type='button';closePanel.textContent='×';closePanel.onclick=()=>{materialPanel.hidden=true;sync();};closePanel.setAttribute('aria-label','إغلاق الخامات');heading.appendChild(closePanel);materialPanel.appendChild(heading);
 var panelHint=document.createElement('p');panelHint.textContent='بعد رسم النقاط اضغط معاينة اللون، ثم عدّل اللون والخامة قبل التأكيد. للتعديل لاحقًا: تعديل منطقة ثم اضغط داخلها.';materialPanel.appendChild(panelHint);
 var panelColorLabel=document.createElement('label');panelColorLabel.textContent='لون المنطقة';var panelColor=document.createElement('input');panelColor.type='color';panelColor.value=picker.value;panelColor.id='fp204RegionColor';panelColorLabel.htmlFor=panelColor.id;materialPanel.appendChild(panelColorLabel);materialPanel.appendChild(panelColor);panelColor.oninput=()=>{picker.value=panelColor.value;refresh();};
 var connected=document.createElement('select');connected.setAttribute('aria-label','نطاق العصا السحرية');connected.title='نطاق العصا السحرية';connected.innerHTML='<option value="connected">المتصل فقط</option><option value="all">كل الألوان المشابهة</option>';connected.value='connected';materialPanel.appendChild(connected);
 function slider(id,label,min,max,value,glyph){
  var box=document.createElement('div');box.className='modernSliderBox';box.title=label;
  var caption=document.createElement('label');caption.textContent=label;caption.htmlFor=id;
  box.innerHTML='<span class="sliderGlyph">'+glyph+'</span><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" value="'+value+'" aria-label="'+label+'"><input class="fp217SliderNumber" type="number" inputmode="decimal" aria-label="'+label+' — رقم"><span class="sliderValue"></span>';
  materialPanel.appendChild(caption);materialPanel.appendChild(box);
  var input=box.querySelector('input[type=range]'),number=box.querySelector('input[type=number]'),unit=box.querySelector('.sliderValue'),factor=id==='fp201TextureRepeat'?100:1,typing=false;
  number.min=min/factor;number.max=max/factor;number.step=1/factor;input.numberField=number;
  unit.textContent=id==='fp203GroutWidth'?'ملم':id==='fp201TextureRepeat'?'×':id==='fp201TextureAngle'?'°':'%';
  function sync(){if(!typing)number.value=Number(input.value)/factor;number.disabled=input.disabled;}
  function apply(final){var v=number.valueAsNumber;if(!Number.isFinite(v)){if(final)sync();return;}if(!final&&(v<min/factor||v>max/factor))return;
   v=Math.max(min,Math.min(max,Math.round(v*factor)));input.value=v;typing=!final;input.dispatchEvent(new Event('input',{bubbles:true}));typing=false;if(final)sync();
  }
  input.addEventListener('input',sync);number.addEventListener('input',()=>apply(false));number.addEventListener('change',()=>apply(true));number.addEventListener('blur',()=>apply(true));
  number.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();apply(true);number.blur();}});sync();return input;
 }
 var transparency=slider('colorLayerTransparency','شفافية طبقة اللون',0,100,50,icon('color'));
 var tolerance=slider('colorWandTolerance','تسامح لون العصا السحرية',0,100,18,icon('wand'));

 var material='solid';
 var textureOpacity=slider('fp201TextureOpacity','وضوح الخامة فوق اللون',0,100,60,icon('color'));
 var repetition=slider('fp201TextureRepeat','تكرار الخامة',25,500,100,'▦');
 var rotation=slider('fp201TextureAngle','دوران الخامة',0,360,0,'↻');
 function tileDimension(id,title){var label=document.createElement('label');label.textContent=title;label.htmlFor=id;var input=document.createElement('input');input.type='number';input.id=id;input.min='1';input.max='1000';input.step='5';input.value='120';input.style.width='100%';materialPanel.appendChild(label);materialPanel.appendChild(input);return input;}
 var tileWidth=tileDimension('fp212TileWidth','عرض البلاطة / الشبكة (سم)'),tileHeight=tileDimension('fp212TileHeight','طول البلاطة / الشبكة (سم)');
 var alignTexture=document.createElement('input');alignTexture.type='checkbox';alignTexture.id='fp214AlignTexture';alignTexture.checked=true;var alignLabel=document.createElement('label');alignLabel.appendChild(alignTexture);alignLabel.appendChild(document.createTextNode(' توزيع الخامة حسب فواصل البلاط'));materialPanel.appendChild(alignLabel);
 var scaleHint=document.createElement('p');materialPanel.appendChild(scaleHint);
 function dimension(value){return Math.max(1,Math.min(1000,Number(value)||120));}
 var groutWidth=slider('fp203GroutWidth','سمك فاصل البلاط (ملم)',0,10,2,'▦');
 var groutColor=document.createElement('input');groutColor.type='color';groutColor.value='#c9c4ba';groutColor.id='fp203GroutColor';var groutLabel=document.createElement('label');groutLabel.textContent='لون فاصل البلاط';groutLabel.htmlFor=groutColor.id;materialPanel.appendChild(groutLabel);materialPanel.appendChild(groutColor);
 var layout=document.createElement('select');layout.id='fp203Layout';layout.title='طريقة تركيب البلاط';layout.setAttribute('aria-label',layout.title);layout.innerHTML='<option value="square">تركيب مستقيم</option><option value="brick">تركيب متعاقب</option>';layout.value='square';materialPanel.appendChild(layout);
 var tintEnabled=document.createElement('input');tintEnabled.type='checkbox';var tintLabel=document.createElement('label');tintLabel.appendChild(tintEnabled);tintLabel.appendChild(document.createTextNode(' تخصيص لون الخامة'));materialPanel.appendChild(tintLabel);var materialTone=document.createElement('input');materialTone.type='color';materialTone.value='#d9c9aa';materialTone.title='لون إضافي للمرمر أو الكرانيت أو الموزاييك';materialTone.setAttribute('aria-label',materialTone.title);materialPanel.appendChild(materialTone);
 var shade=slider('fp201TextureShadow','ظل حدود المنطقة',0,100,0,'◐');
 function textureSettings(){return {material:material,textureOpacity:Number(textureOpacity.value)/100,repeat:Number(repetition.value)/100,alignTexture:alignTexture.checked,tileWidthCm:dimension(tileWidth.value),tileHeightCm:dimension(tileHeight.value),angle:Number(rotation.value),shadow:Number(shade.value)/100,groutWidth:Number(groutWidth.value),groutColor:groutColor.value,layout:layout.value,materialTone:tintEnabled.checked?materialTone.value:'',customTexture:window.FP203Materials?.embedded(material)};}
 var category=document.createElement('select');category.id='fp203MaterialCategory';category.setAttribute('aria-label','نوع الخامة');category.innerHTML='<option value="all">كل الخامات</option><option value="marble">مرمر</option><option value="granite">كرانيت</option><option value="mosaic">موزاييك</option><option value="legacy">خشب وحجر</option><option value="custom">الباترن المضاف</option>';category.value='marble';materialPanel.appendChild(category);
 var upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.hidden=true;upload.id='fp203PatternFile';materialPanel.appendChild(upload);
 var uploadButton=document.createElement('button');uploadButton.type='button';uploadButton.textContent='＋ إضافة باترن من الجهاز';uploadButton.style.width='100%';uploadButton.onclick=()=>upload.click();materialPanel.appendChild(uploadButton);
 upload.onchange=async()=>{var file=upload.files[0];if(!file)return;uploadButton.disabled=true;try{var item=await window.FP203Materials.importFile(file);material=item.id;category.value='custom';tintEnabled.checked=false;refresh();renderSwatches();setStatus('تمت إضافة الباترن وحفظه — اختره ثم حدد المنطقة أو عدّل طبقة موجودة');}catch(error){alert(error.message||'تعذرت إضافة الباترن');}finally{upload.value='';uploadButton.disabled=false;}};
 var swatches=document.createElement('div');swatches.className='fp201Swatches';materialPanel.appendChild(swatches);
 var presets=[['solid','بدون خامة'],['cream','مرمر كريمي قديم'],['white','مرمر أبيض قديم'],['grey','مرمر رصاصي قديم'],['oak','باركيه بلوط'],['walnut','باركيه جوز'],['basket','باركيه مربعات'],['sand','حجر رملي'],['slate','حجر داكن'],['blocks','حجر متنوع']];
 function renderSwatches(){
  if(materialPanel.hidden)return;
  swatches.innerHTML='';var list=presets.map(pair=>({id:pair[0],name:pair[1],type:'legacy'})).concat(window.FP203Materials?.list()||[]);
  list.filter(v=>v.id==='solid'||category.value==='all'||v.type===category.value||(category.value==='mosaic'&&v.type==='terrazzo')).forEach(item=>{var b=document.createElement('button');b.type='button';b.dataset.material=item.id;b.textContent=item.name;if(item.id!=='solid'){var thumb=makeCanvas(256,160);thumb.getContext('2d').drawImage(window.FP203Materials.tile(item.id,{groutWidth:0,layout:'square'}),0,0,256,160);b.prepend(thumb);}b.onclick=()=>{material=item.id;tintEnabled.checked=false;if(item.color)materialTone.value=item.color;refresh();syncTextures();};swatches.appendChild(b);});syncTextures();
 }
 function syncTextures(){repetition.disabled=alignTexture.checked;repetition.numberField.disabled=alignTexture.checked;scaleHint.textContent=pxPerCm?'أبعاد البلاط بالسنتيمتر حسب معايرة الخارطة.':'عاير الخارطة أولاً لإظهار فواصل البلاط بأبعاد حقيقية.';swatches.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.material===material));}
 category.onchange=renderSwatches;
 [textureOpacity,repetition,rotation,shade,groutWidth,groutColor,layout,tintEnabled,materialTone,tileWidth,tileHeight,alignTexture].forEach(input=>input.addEventListener('input',refresh));
 [groutWidth,groutColor,layout].forEach(input=>input.addEventListener('change',renderSwatches));
 window.addEventListener('furniplan-materials-changed',renderSwatches);renderSwatches();
 var panelActions=document.createElement('div');panelActions.className='fp201Actions';[['معاينة اللون',previewSelection],['✓ تأكيد',confirmLayer],['إلغاء',cancel]].forEach(pair=>{var b=document.createElement('button');b.type='button';b.textContent=pair[0];b.onclick=pair[1];panelActions.appendChild(b);});materialPanel.insertBefore(panelActions,panelHint);
 var style=document.createElement('style');style.textContent=`
 #fp201Materials[hidden]{display:none!important}#fp201Materials{position:fixed;z-index:5800;left:10px;bottom:45px;width:330px;max-width:calc(100vw - 20px);max-height:65dvh;overflow:auto;background:#102740;color:white;border:1px solid #63788e;border-radius:12px;padding:12px;box-sizing:border-box;box-shadow:0 12px 35px #0006;font:12px Tahoma;touch-action:pan-y}
 #fp201Materials header{display:flex;align-items:center;justify-content:space-between}#fp201Materials p{font-size:11px;line-height:1.7;color:#cbd7e3}#fp201Materials label{display:block;margin-top:8px;font-size:11px}#fp201Materials button,#fp201Materials select{background:#193653;color:white;border:1px solid #526980;border-radius:6px;padding:6px;font:inherit}#fp201Materials .modernSliderBox{height:32px!important;margin:4px 0!important;display:flex!important}#fp201Materials input[type=range]{min-width:40px;width:100%;accent-color:#f5bd52}#fp201Materials .sliderGlyph{display:none}#fp201Materials .sliderValue{font-size:11px;min-width:20px}#fp201Materials .fp217SliderNumber{width:62px!important;min-width:62px!important;flex:0 0 62px;height:28px;box-sizing:border-box;background:#0f172a;color:white;border:1px solid #63788e;border-radius:5px;text-align:center;font:12px Tahoma}#fp201Materials .fp217SliderNumber:disabled{opacity:.45}#fp201Materials .fp201Swatches{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:10px 0}#fp201Materials .fp201Swatches button{font-size:10px;min-width:0;padding:3px}#fp201Materials canvas{width:100%;height:76px;display:block}#fp201Materials .fp201Swatches{max-height:260px;overflow-y:auto}#fp201Materials select{width:100%;margin-top:7px}#fp201Materials input[type=color]{height:32px;width:70px}#fp201Materials .active{border-color:#ffc85a!important;box-shadow:inset 0 0 0 1px #ffc85a}.fp201Actions{display:flex;gap:5px;position:sticky;top:0;z-index:2;background:#102740;padding:6px 0}.fp201Actions button{font-size:11px!important;min-width:0;padding:6px 3px!important}.fp201Actions button{flex:1}
 #modernTopToolbar .colorLayerTools{border-color:#bb9444!important}.layerColorPicker{width:34px;min-width:34px;height:36px;padding:2px}.colorLayerTools select{max-width:108px;background:#193653;color:white;border:1px solid #536a80;border-radius:6px;padding:5px}
 @media(max-width:700px){#fp201Materials{width:285px;max-height:48dvh}}
 `;document.head.appendChild(style);syncTextures();

 function makeCanvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function empty(){var scale=Math.min(1,1400/Math.max(canvas.width,canvas.height));return makeCanvas(Math.max(1,Math.round(canvas.width*scale)),Math.max(1,Math.round(canvas.height*scale)));}
 function selectionSnapshot(){
  var d=draft.mask.getContext('2d').getImageData(0,0,draft.mask.width,draft.mask.height).data,a=new Uint8Array(d.length/4);
  for(var i=0;i<a.length;i++)a[i]=d[i*4+3];
  return {alpha:a,points:points.map(p=>({x:p.x,y:p.y})),tool:tool,operation:operation};
 }
 function rememberSelection(){if(!draft)return;selectionUndo.push(selectionSnapshot());selectionRedo=[];var limit=Math.max(2,Math.min(40,Math.floor(24000000/(draft.mask.width*draft.mask.height))));while(selectionUndo.length>limit)selectionUndo.shift();}
 function stepSelection(redo){
  if(!draft)return;var from=redo?selectionRedo:selectionUndo,to=redo?selectionUndo:selectionRedo;if(!from.length)return;
  to.push(selectionSnapshot());var snap=from.pop(),c=draft.mask.getContext('2d'),d=c.createImageData(draft.mask.width,draft.mask.height);
  for(var i=0;i<snap.alpha.length;i++){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=255;d.data[i*4+3]=snap.alpha[i];}
  c.putImageData(d,0,0);points=snap.points;tool=snap.tool;operation=snap.operation;canvas.style.cursor=tool?'crosshair':'';refresh();
  setStatus(redo?'تمت إعادة خطوة التحديد':'تم التراجع عن خطوة التحديد');
 }
 function start(kind){
  if(!hasPlan()){setStatus('ارفع الخارطة أولاً');return;}
  if(kind==='wand'&&!bgImage){setStatus('العصا السحرية تعمل على صور الخرائط؛ استخدم النقاط لخارطة DXF');return;}
  window.FP199Surfaces?.cancel();
  if(window.FP201Tools)window.FP201Tools.rememberColor(kind);
  if(!draft){selected=-1;operation='add';draft={mask:empty(),color:picker.value,opacity:1-Number(transparency.value)/100,visible:true,...textureSettings()};}
  if(points.length)rememberSelection();
  tool=kind;points=[];pixels=null;sourceImage=bgImage;materialPanel.hidden=false;renderSwatches();
  clearFurnitureSelection();activateWorkingTool(kind==='wand'?'colorWand':'colorPolygon');panDrag=null;canvas.style.cursor='crosshair';sync();draw();
  setStatus(kind==='polygon'?'حدد ثلاث نقاط أو أكثر ثم اضغط معاينة اللون؛ بعدها عدّل اللون والخامة قبل التأكيد':'انقر لوناً لتحديده؛ يمكنك الإضافة والطرح أو عكس التحديد');
 }
 function path(context,pts,w,h){context.beginPath();pts.forEach((p,i)=>i?context.lineTo(p.x*w,p.y*h):context.moveTo(p.x*w,p.y*h));context.closePath();}
 function closePolygon(){if(points.length<3)return false;rememberSelection();var c=draft.mask.getContext('2d');c.save();c.globalCompositeOperation=operation==='subtract'?'destination-out':'source-over';c.fillStyle='#fff';path(c,points,draft.mask.width,draft.mask.height);c.fill();c.restore();points=[];refresh();return true;}
 function refresh(){repetition.disabled=alignTexture.checked;repetition.numberField.disabled=alignTexture.checked;scaleHint.textContent=pxPerCm?'أبعاد البلاط بالسنتيمتر مرتبطة بمعايرة الخارطة؛ تغيير التكرار لا يغيّر الفواصل.':'عاير الخارطة أولاً لإظهار فواصل البلاط بأبعاد حقيقية.';panelColor.value=picker.value;if(draft){draft.color=picker.value;draft.opacity=1-Number(transparency.value)/100;Object.assign(draft,textureSettings());draft.paint=null;draft.encoded=null;}sync();draw();}
 picker.oninput=refresh;transparency.addEventListener('input',refresh);
 function cancel(){materialPanel.hidden=true;down=null;selectionUndo=[];selectionRedo=[];draft=null;tool='';points=[];selected=-1;pixels=null;canvas.style.cursor='';if(mode==='colorWand'||mode==='colorPolygon'||mode==='colorEdit')activateWorkingTool('select');sync();draw();}
 function confirmLayer(){if(!draft)return;if(points.length&&!closePolygon()){setStatus('اختر ثلاث نقاط على الأقل');return;}
  var a=draft.mask.getContext('2d').getImageData(0,0,draft.mask.width,draft.mask.height).data,has=false;for(var i=3;i<a.length;i+=4)if(a[i]){has=true;break;}if(!has){setStatus('حدد مساحة قبل التأكيد');return;}
  var before=cloneEditState();if(selected>=0)layers[selected]=draft;else layers.push(draft);cancel();list();commitHistory(before);setStatus('تم اعتماد اللون والخامة وانتهت الأداة — كلك يمين يعيد آخر أداة');
 }
 function list(){choice.innerHTML='<option value="-1">اختر منطقة للتعديل</option>';layers.forEach((l,i)=>{var o=document.createElement('option');o.value=i;o.textContent='منطقة '+(i+1);choice.appendChild(o);});choice.value=String(selected);}
 function editLayer(i){cancel();if(i<0||!layers[i])return;selected=i;operation='add';var l=layers[i],m=makeCanvas(l.mask.width,l.mask.height);m.getContext('2d').drawImage(l.mask,0,0);draft={...l,mask:m,paint:null,encoded:null};material=l.material||'solid';textureOpacity.value=Math.round((l.textureOpacity??.6)*100);repetition.value=(l.repeat||1)*100;alignTexture.checked=l.alignTexture!==false;tileWidth.value=dimension(l.tileWidthCm);tileHeight.value=dimension(l.tileHeightCm);rotation.value=l.angle||0;shade.value=(l.shadow||0)*100;groutWidth.value=l.groutWidth??0;groutColor.value=l.groutColor||'#c9c4ba';layout.value=l.layout||'square';tintEnabled.checked=!!l.materialTone;if(l.materialTone)materialTone.value=l.materialTone;category.value=window.FP203Materials.get(l.material)?.type||'legacy';if(category.value==='terrazzo'||window.FP203Materials.get(l.material)?.type==='terrazzo')category.value='mosaic';materialPanel.hidden=false;renderSwatches();syncTextures();picker.value=l.color;transparency.value=Math.round((1-l.opacity)*100);transparency.dispatchEvent(new Event('input'));[textureOpacity,repetition,rotation,shade,groutWidth].forEach(el=>el.dispatchEvent(new Event('input')));choice.value=i;sync();setStatus('تعديل المنطقة '+(i+1)+' — غيّر اللون أو الخامة، أو استخدم النقاط والعصا للإضافة والطرح؛ ثم اضغط تأكيد');}
 choice.onchange=()=>editLayer(Number(choice.value));
 function previewSelection(){
  if(!draft){setStatus('ابدأ بالعصا السحرية أو تحديد النقاط أولًا');return;}
  if(points.length&&!closePolygon()){setStatus('حدد ثلاث نقاط على الأقل لإغلاق الحدود');return;}
  tool='';activateWorkingTool('select');canvas.style.cursor='';materialPanel.hidden=false;renderSwatches();refresh();
  setStatus('هذه معاينة قبل الحفظ — غيّر اللون والخامة كما ترغب ثم اضغط تأكيد');
 }
 function pickRegion(){
  if(!layers.length){setStatus('لا توجد مناطق محفوظة بعد؛ حدد منطقة ثم اضغط تأكيد');return;}
  cancel();tool='edit';activateWorkingTool('colorEdit');canvas.style.cursor='crosshair';materialPanel.hidden=false;renderSwatches();sync();
  setStatus('اضغط داخل المنطقة المحفوظة لتعديلها، أو اختر طبقتها من القائمة');
 }
 function regionAt(p){for(var i=layers.length-1;i>=0;i--){var layer=layers[i];if(!layer.visible)continue;var x=Math.max(0,Math.min(layer.mask.width-1,Math.floor(p.x*layer.mask.width))),y=Math.max(0,Math.min(layer.mask.height-1,Math.floor(p.y*layer.mask.height)));if(layer.mask.getContext('2d').getImageData(x,y,1,1).data[3]>32)return i;}return -1;}
 function sync(){editButton.disabled=!layers.length;editButton.classList.toggle('active',tool==='edit');previewButton.disabled=!draft;confirmButton.title=selected>=0?'حفظ تعديل المنطقة':'تأكيد المنطقة';var confirmText=confirmButton.querySelector('.iconLabel');if(confirmText)confirmText.textContent=selected>=0?'حفظ التعديل':'تأكيد';undoSelectionButton.disabled=!draft||!selectionUndo.length;redoSelectionButton.disabled=!draft||!selectionRedo.length;poly.classList.toggle('active',tool==='polygon');wand.classList.toggle('active',tool==='wand');add.classList.toggle('active',operation==='add');sub.classList.toggle('active',operation==='subtract');[add,sub,inverse,confirmButton].forEach(b=>b.disabled=!draft);cancelButton.disabled=!draft&&materialPanel.hidden;eye.disabled=del.disabled=selected<0;eye.classList.toggle('active',selected>=0&&(draft?draft.visible:layers[selected].visible));if(!draft)choice.value='-1';}
 // Compare against the clicked colour, never against previously accepted pixels.
 function selectPixels(data,w,h,seed,tol,contiguous){
  var out=new Uint8Array(w*h),seen=new Uint8Array(w*h),k=seed*4,r=data[k],g=data[k+1],b=data[k+2],limit=tol*tol*3;
  function match(i){var n=i*4;return (data[n]-r)**2+(data[n+1]-g)**2+(data[n+2]-b)**2<=limit;}
  if(!contiguous){for(var i=0;i<out.length;i++)if(match(i))out[i]=1;return out;}
  var queue=new Int32Array(w*h),head=0,tail=1;queue[0]=seed;seen[seed]=1;
  while(head<tail){var i=queue[head++];if(!match(i))continue;out[i]=1;var x=i%w;visit(i-w);visit(i+w);if(x)visit(i-1);if(x<w-1)visit(i+1);}
  function visit(i){if(i>=0&&i<out.length&&!seen[i]){seen[i]=1;queue[tail++]=i;}}
  return out;
 }
 function magic(p){
  var w=draft.mask.width,h=draft.mask.height;
  try{if(!pixels||sourceImage!==bgImage){var src=makeCanvas(w,h),sc=src.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,w,h);sc.drawImage(bgImage,0,0,w,h);pixels=sc.getImageData(0,0,w,h).data;sourceImage=bgImage;}
   var x=Math.min(w-1,Math.max(0,Math.floor(p.x*w))),y=Math.min(h-1,Math.max(0,Math.floor(p.y*h)));
   var selection=selectPixels(pixels,w,h,y*w+x,Number(tolerance.value)*2.55,connected.value==='connected');
   rememberSelection();
   var c=draft.mask.getContext('2d'),d=c.getImageData(0,0,w,h);for(var i=0;i<selection.length;i++)if(selection[i]){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=255;d.data[i*4+3]=operation==='subtract'?0:255;}c.putImageData(d,0,0);refresh();
  }catch(e){setStatus('تعذر قراءة ألوان الصورة؛ يمكنك استخدام التحديد بالنقاط');console.error(e);}
 }
 var down=null;
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 window.addEventListener('pointerdown',function(e){if(!tool||e.target!==canvas||e.button>0)return;consume(e);down={x:e.clientX,y:e.clientY,id:e.pointerId};try{canvas.setPointerCapture(e.pointerId);}catch(_){}},true);
 window.addEventListener('pointermove',function(e){if(tool&&down)consume(e);},true);
 window.addEventListener('pointerup',function(e){if(!tool||!down||e.pointerId!==down.id)return;consume(e);var start=down;down=null;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)return;var r=canvas.getBoundingClientRect(),p={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};if(tool==='edit'){var i=regionAt(p);if(i>=0)editLayer(i);else setStatus('لم توجد منطقة هنا؛ اضغط داخل منطقة ملوّنة أو اخترها من القائمة');return;}if(tool==='wand'){magic(p);return;}
  if(points.length>=3&&Math.hypot((p.x-points[0].x)*r.width,(p.y-points[0].y)*r.height)<12){closePolygon();return;}rememberSelection();points.push(p);sync();draw();
 },true);
 mainScroll.addEventListener('pointercancel',()=>{down=null;},true);
 ['mousedown','mouseup','click','touchstart','touchend'].forEach(name=>mainScroll.addEventListener(name,e=>{if(tool&&e.target===canvas)consume(e);},{capture:true,passive:false}));
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!materialPanel.hidden){consume(e);cancel();return;}if(!draft||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())){consume(e);stepSelection(e.key.toLowerCase()==='y'||e.shiftKey);return;}if(e.key==='Escape'){consume(e);cancel();}else if(e.key==='Enter'){consume(e);confirmLayer();}},true);

 function paint(l){
  var paintKey=[canvas.width,canvas.height,pxPerCm].join(':');if(l.paintKey!==paintKey){l.paint=null;l.paintKey=paintKey;}
  if(!l.paint){
   var w=l.mask.width,h=l.mask.height;cachesTrim();l.paint=makeCanvas(w,h);var c=l.paint.getContext('2d');
   c.globalAlpha=Math.max(0,Math.min(1,l.opacity));c.fillStyle=l.color;c.fillRect(0,0,w,h);
   if(l.material&&l.material!=='solid'&&l.textureOpacity>0){
    window.FP214Tiles.paintTexture(c,l,w,h,canvas.width,canvas.height,pxPerCm);
   }
   window.FP214Tiles.paintGrid(c,l,w,h,canvas.width,canvas.height,pxPerCm);

   c.globalAlpha=1;c.globalCompositeOperation='destination-in';c.drawImage(l.mask,0,0);
   if(l.shadow>0){
    var edge=makeCanvas(w,h),ec=edge.getContext('2d');ec.fillStyle='#172330';ec.fillRect(0,0,w,h);ec.globalCompositeOperation='destination-out';ec.drawImage(l.mask,0,0);
    c.globalCompositeOperation='source-atop';c.globalAlpha=l.shadow;c.filter='blur('+Math.max(1,6*w/canvas.width*(pxPerCm||1))+'px)';c.drawImage(edge,0,0);c.filter='none';
   }
  }
  ctx.save();ctx.drawImage(l.paint,0,0,canvas.width,canvas.height);ctx.restore();
 }
 function cachesTrim(){var painted=layers.filter(l=>l.paint);while(painted.length>3)painted.shift().paint=null;}
 function encode(l){
  if(!l.encoded){var bytes=l.mask.getContext('2d').getImageData(0,0,l.mask.width,l.mask.height).data,runs=[],start=-1;
   for(var i=0;i<=bytes.length/4;i++){var filled=i<bytes.length/4&&bytes[i*4+3]>=128;if(filled&&start<0)start=i;if(!filled&&start>=0){runs.push(start,i-start);start=-1;}}
   l.encoded={width:l.mask.width,height:l.mask.height,runs:runs};
  }
  return {mask:l.encoded,color:l.color,opacity:l.opacity,visible:l.visible,material:l.material||'solid',textureOpacity:l.textureOpacity??.6,repeat:l.repeat||1,alignTexture:l.alignTexture!==false,tileWidthCm:dimension(l.tileWidthCm),tileHeightCm:dimension(l.tileHeightCm),angle:l.angle||0,shadow:l.shadow||0,groutWidth:l.groutWidth??0,groutColor:l.groutColor||'#c9c4ba',layout:l.layout||'square',materialTone:l.materialTone||'',customTexture:l.customTexture||window.FP203Materials?.embedded(l.material)};
 }
 function decode(raw){
  if(!raw?.mask)return null;if(raw.customTexture)window.FP203Materials?.register(raw.customTexture).catch(()=>setStatus('تعذر فتح الباترن المحفوظ'));var m=raw.mask,w=Number(m.width),h=Number(m.height);if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>2000000||!Array.isArray(m.runs)||m.runs.length%2)return null;
  var c=makeCanvas(w,h),g=c.getContext('2d'),d=g.createImageData(w,h);
  for(var j=0;j<m.runs.length;j+=2){var start=m.runs[j],length=m.runs[j+1];if(!Number.isInteger(start)||!Number.isInteger(length)||start<0||length<0||start+length>w*h)return null;for(var i=start;i<start+length;i++){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=d.data[i*4+3]=255;}}
  g.putImageData(d,0,0);return {mask:c,encoded:m,color:/^#[0-9a-f]{6}$/i.test(raw.color)?raw.color:'#334155',opacity:Math.max(0,Math.min(1,Number(raw.opacity)||0)),visible:raw.visible!==false,material:raw.material||'solid',textureOpacity:Math.max(0,Math.min(1,Number(raw.textureOpacity)||0)),repeat:Math.max(.25,Math.min(5,Number(raw.repeat)||1)),alignTexture:raw.alignTexture!==false,tileWidthCm:dimension(raw.tileWidthCm),tileHeightCm:dimension(raw.tileHeightCm),angle:Number(raw.angle)||0,shadow:Math.max(0,Math.min(1,Number(raw.shadow)||0)),groutWidth:Math.max(0,Math.min(10,Number(raw.groutWidth)||0)),groutColor:/^#[0-9a-f]{6}$/i.test(raw.groutColor||'')?raw.groutColor:'#c9c4ba',layout:raw.layout==='brick'?'brick':'square',materialTone:/^#[0-9a-f]{6}$/i.test(raw.materialTone||'')?raw.materialTone:'',customTexture:raw.customTexture||null};
 }
 window.FP201ColorLayers={
  render:function(){layers.forEach((l,i)=>{if(l.visible&&(i!==selected||window.FP199Exporting))paint(l);});if(draft&&!window.FP199Exporting){if(draft.visible)paint(draft);if(points.length){ctx.save();ctx.strokeStyle='#38bdf8';ctx.lineWidth=2/zoom;ctx.setLineDash([5/zoom,4/zoom]);path(ctx,points,canvas.width,canvas.height);ctx.stroke();ctx.setLineDash([]);points.forEach(p=>{ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,4/zoom,0,Math.PI*2);ctx.fillStyle='#facc15';ctx.fill();});ctx.restore();}}},
  serialize:function(){return layers.map(encode);},
  clear:function(){revision++;layers=[];cancel();list();},
  load:function(raw){revision++;layers=(Array.isArray(raw)?raw:[]).map(decode).filter(Boolean);cancel();list();},
  adoptLegacy:function(w,h){
   var legacy=areaPolygons.filter(a=>a.kind==='surface');if(!legacy.length)return;
   legacy.forEach(a=>{var m=empty(),g=m.getContext('2d');g.fillStyle='#fff';path(g,(a.points||[]).map(p=>({x:p.x/w,y:p.y/h})),m.width,m.height);g.fill();var st=a.surface||{},solid=st.material==='solid';layers.push({mask:m,color:st.color||'#e8d8b9',opacity:solid?(st.opacity??.85):0,visible:true,material:st.material||'cream',textureOpacity:solid?0:(st.opacity??.85),repeat:st.repeat||1,angle:0,shadow:st.shadow||0});});
   areaPolygons=areaPolygons.filter(a=>a.kind!=='surface');list();
  },
  start:start,cancel:cancel,selectPixels:selectPixels,invalidate:function(){layers.forEach(l=>l.paint=null);if(draft)draft.paint=null;}

 };
 top.addEventListener('click',function(e){if(tool&&!group.contains(e.target)){tool='';if(mode==='colorWand'||mode==='colorPolygon'||mode==='colorEdit')activateWorkingTool('select');canvas.style.cursor='';sync();draw();}},true);
 list();sync();
})();

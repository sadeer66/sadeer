from pathlib import Path
import re

p=Path('index.html')
c=p.read_text(encoding='utf-8')

if 'V60 AutoCAD DXF' in c and 'id="dxfInput"' in c and 'function parseAsciiDxf' in c:
    print('V60 DXF already applied')
else:
    # Title from current V59 or prior V58 fallback.
    c=c.replace('<title>تأثيثي V59 — المساعد المحمي</title>','<title>تأثيثي V60 — AutoCAD DXF</title>')
    c=c.replace('<title>تأثيثي V58 — المساعد</title>','<title>تأثيثي V60 — AutoCAD DXF</title>')

    # Keep hidden file inputs out of the layout.
    c=c.replace('#fileInput,#loadInput{display:none}', '#fileInput,#loadInput,#dxfInput{display:none}')

    # Add the DXF picker beside map upload in the original toolbar (modern toolbar mirrors it below).
    old='<label class="btn" for="fileInput"><span class="actionIcon">▣</span>رفع الخارطة</label><input id="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" />'
    new=old+'\n      <label class="btn" for="dxfInput"><span class="actionIcon">DXF</span>AutoCAD DXF</label><input id="dxfInput" type="file" accept=".dxf,application/dxf,text/plain" />'
    if 'id="dxfInput"' not in c:
        if old not in c: raise SystemExit('map upload toolbar anchor missing')
        c=c.replace(old,new,1)

    # Add an ASCII DXF parser and vector-to-map renderer.  The rendered plan becomes the normal
    # background map, so all existing furniture, measurement, print, save/open code keeps working.
    anchor="document.getElementById('fileInput').onchange=async e=>{"
    if 'function parseAsciiDxf' not in c:
        if anchor not in c: raise SystemExit('file input handler anchor missing')
        js=r'''
// ===== V60 AutoCAD DXF import =====
function dxfPairs(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const out=[];
  for(let i=0;i+1<lines.length;i+=2){
    const code=parseInt(lines[i].trim(),10);if(!Number.isFinite(code))continue;
    out.push({code,value:lines[i+1].trim()});
  }
  return out;
}
function dxfNumber(v,def=0){const n=Number(v);return Number.isFinite(n)?n:def;}
function dxfFirst(chunk,code,def=null){const p=chunk.find(x=>x.code===code);return p?dxfNumber(p.value,def):def;}
function dxfText(chunk,code,def=''){const p=chunk.find(x=>x.code===code);return p?String(p.value||''):def;}
function dxfInsUnits(pairs){
  for(let i=0;i<pairs.length;i++)if(pairs[i].code===9&&pairs[i].value==='$INSUNITS'){
    for(let j=i+1;j<Math.min(pairs.length,i+10);j++)if(pairs[j].code===70)return parseInt(pairs[j].value,10)||0;
  }
  return 0;
}
function dxfUnitInfo(code){
  const common={
    1:{cm:2.54,label:'إنش'},2:{cm:30.48,label:'قدم'},4:{cm:.1,label:'ملم'},5:{cm:1,label:'سم'},6:{cm:100,label:'متر'},
    10:{cm:91.44,label:'ياردة'},14:{cm:10,label:'ديسيمتر'}
  };
  return common[code]||null;
}
function askDxfUnitInfo(code){
  const known=dxfUnitInfo(code);if(known)return known;
  const answer=prompt('ملف DXF لا يحدد وحدة رسم مدعومة. اكتب وحدة الرسم: mm أو cm أو m','mm');
  if(answer===null)return null;
  const s=String(answer).trim().toLowerCase();
  if(['m','meter','meters','م','متر'].includes(s))return {cm:100,label:'متر (اختيار يدوي)'};
  if(['cm','centimeter','centimeters','سم'].includes(s))return {cm:1,label:'سم (اختيار يدوي)'};
  if(['in','inch','inches'].includes(s))return {cm:2.54,label:'إنش (اختيار يدوي)'};
  return {cm:.1,label:'ملم (اختيار يدوي)'};
}
function parseAsciiDxf(text){
  if(/^AutoCAD Binary DXF/i.test(String(text||'').trimStart()))throw new Error('BINARY_DXF');
  const pairs=dxfPairs(text);if(!pairs.length)throw new Error('EMPTY_DXF');
  const insUnits=dxfInsUnits(pairs);
  let inEntities=false,entities=[];
  for(let i=0;i<pairs.length;){
    const p=pairs[i];
    if(p.code===0&&p.value==='SECTION'&&pairs[i+1]?.code===2&&pairs[i+1]?.value==='ENTITIES'){inEntities=true;i+=2;continue;}
    if(inEntities&&p.code===0&&p.value==='ENDSEC'){break;}
    if(!inEntities){i++;continue;}
    if(p.code!==0){i++;continue;}
    const type=p.value;
    if(type==='POLYLINE'){
      let header=[],verts=[],closed=false;i++;
      while(i<pairs.length&&pairs[i].code!==0){header.push(pairs[i++]);}
      closed=((dxfFirst(header,70,0)||0)&1)!==0;
      while(i<pairs.length){
        if(pairs[i].code!==0){i++;continue;}
        if(pairs[i].value==='SEQEND'){i++;break;}
        if(pairs[i].value!=='VERTEX')break;
        i++;let ch=[];while(i<pairs.length&&pairs[i].code!==0)ch.push(pairs[i++]);
        const x=dxfFirst(ch,10,null),y=dxfFirst(ch,20,null);if(x!==null&&y!==null)verts.push({x,y});
      }
      if(verts.length>1)entities.push({type:'POLYLINE',verts,closed});
      continue;
    }
    i++;let ch=[];while(i<pairs.length&&pairs[i].code!==0)ch.push(pairs[i++]);
    if(type==='LINE'){
      const x1=dxfFirst(ch,10,null),y1=dxfFirst(ch,20,null),x2=dxfFirst(ch,11,null),y2=dxfFirst(ch,21,null);
      if([x1,y1,x2,y2].every(v=>v!==null))entities.push({type,x1,y1,x2,y2});
    }else if(type==='LWPOLYLINE'){
      const verts=[];let cur=null;for(const q of ch){if(q.code===10){if(cur&&cur.y!==undefined)verts.push(cur);cur={x:dxfNumber(q.value)};}else if(q.code===20&&cur){cur.y=dxfNumber(q.value);} }
      if(cur&&cur.y!==undefined)verts.push(cur);
      if(verts.length>1)entities.push({type,verts,closed:((dxfFirst(ch,70,0)||0)&1)!==0});
    }else if(type==='CIRCLE'){
      const cx=dxfFirst(ch,10,null),cy=dxfFirst(ch,20,null),r=dxfFirst(ch,40,null);if(cx!==null&&cy!==null&&r>0)entities.push({type,cx,cy,r});
    }else if(type==='ARC'){
      const cx=dxfFirst(ch,10,null),cy=dxfFirst(ch,20,null),r=dxfFirst(ch,40,null),a1=dxfFirst(ch,50,0),a2=dxfFirst(ch,51,0);if(cx!==null&&cy!==null&&r>0)entities.push({type,cx,cy,r,a1,a2});
    }else if(type==='POINT'){
      const x=dxfFirst(ch,10,null),y=dxfFirst(ch,20,null);if(x!==null&&y!==null)entities.push({type,x,y});
    }
  }
  if(!entities.length)throw new Error('NO_2D_ENTITIES');
  return {entities,insUnits};
}
function dxfBounds(entities){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const add=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y))return;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);};
  for(const e of entities){
    if(e.type==='LINE'){add(e.x1,e.y1);add(e.x2,e.y2);}else if(e.verts){e.verts.forEach(v=>add(v.x,v.y));}
    else if(e.type==='CIRCLE'||e.type==='ARC'){add(e.cx-e.r,e.cy-e.r);add(e.cx+e.r,e.cy+e.r);}else if(e.type==='POINT')add(e.x,e.y);
  }
  if(!Number.isFinite(minX)||!(maxX>minX)||!(maxY>minY))throw new Error('BAD_BOUNDS');
  return {minX,minY,maxX,maxY,w:maxX-minX,h:maxY-minY};
}
function renderDxfMap(parsed,unit){
  const b=dxfBounds(parsed.entities),touch=isTouchDevice();
  const maxW=touch?1400:1700,maxH=touch?1000:1150,margin=42;
  const scale=Math.min((maxW-margin*2)/b.w,(maxH-margin*2)/b.h);
  if(!Number.isFinite(scale)||scale<=0)throw new Error('BAD_SCALE');
  const w=Math.max(320,Math.ceil(b.w*scale+margin*2)),h=Math.max(240,Math.ceil(b.h*scale+margin*2));
  const off=document.createElement('canvas');off.width=w;off.height=h;const g=off.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,w,h);g.strokeStyle='#111827';g.fillStyle='#111827';g.lineWidth=Math.max(1,Math.min(2.2,scale*.6));g.lineJoin='round';g.lineCap='round';
  const X=x=>margin+(x-b.minX)*scale,Y=y=>margin+(b.maxY-y)*scale;
  for(const e of parsed.entities){
    g.beginPath();
    if(e.type==='LINE'){g.moveTo(X(e.x1),Y(e.y1));g.lineTo(X(e.x2),Y(e.y2));g.stroke();}
    else if(e.verts){g.moveTo(X(e.verts[0].x),Y(e.verts[0].y));for(let i=1;i<e.verts.length;i++)g.lineTo(X(e.verts[i].x),Y(e.verts[i].y));if(e.closed)g.closePath();g.stroke();}
    else if(e.type==='CIRCLE'){g.arc(X(e.cx),Y(e.cy),e.r*scale,0,Math.PI*2);g.stroke();}
    else if(e.type==='ARC'){
      // Canvas Y is inverted relative to DXF, therefore angle signs are inverted.
      const s=-e.a1*Math.PI/180,t=-e.a2*Math.PI/180;g.arc(X(e.cx),Y(e.cy),e.r*scale,s,t,true);g.stroke();
    }else if(e.type==='POINT'){const x=X(e.x),y=Y(e.y);g.arc(x,y,2.2,0,Math.PI*2);g.fill();}
  }
  return {data:off.toDataURL('image/png'),width:w,height:h,pxPerCm:scale/unit.cm,entityCount:parsed.entities.length};
}
function loadDxfRenderedMap(result,unit,fileName=''){
  const img=new Image();
  img.onload=()=>{
    bgImage=img;bgData=result.data;
    items=[];clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;points=[];measurements=[];mapLabels=[];mode='select';pendingFurnitureDef=null;pendingMapLabelText='';
    pxPerCm=result.pxPerCm;undoStack=[];redoStack=[];updateHistoryButtons();syncSelectedPanel();updateScaleUI();
    canvas.width=result.width;canvas.height=result.height;updateStageSize();draw();fitToViewport();
    if(fileName&&!projectMeta.mapTitle)projectMeta.mapTitle=fileName.replace(/\.dxf$/i,'');
    setStatus(`تم فتح DXF — ${result.entityCount} عنصر — الوحدة ${unit.label} — المقياس مضبوط تلقائيًا`);
  };
  img.src=result.data;
}
document.getElementById('dxfInput').onchange=async e=>{
  const input=e.currentTarget,f=input.files&&input.files[0];if(!f)return;
  input.disabled=true;setStatus('جاري قراءة مخطط AutoCAD DXF…');
  await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
  try{
    const text=await f.text(),parsed=parseAsciiDxf(text),unit=askDxfUnitInfo(parsed.insUnits);if(!unit){setStatus('تم إلغاء استيراد DXF');return;}
    const result=renderDxfMap(parsed,unit);loadDxfRenderedMap(result,unit,f.name||'');
  }catch(err){
    console.error(err);
    const msg=err&&err.message==='BINARY_DXF'?'هذا ملف DXF ثنائي. من AutoCAD استخدم Save As واختر DXF بصيغة ASCII ثم أعد فتحه.':'تعذر قراءة ملف DXF. جرّب حفظه من AutoCAD بصيغة DXF ASCII (يفضل 2013 أو 2018) وتأكد أن المخطط ثنائي الأبعاد.';
    alert(msg);setStatus('لم يتم تحميل ملف DXF');
  }finally{input.disabled=false;input.value='';}
};
// ===== End V60 AutoCAD DXF import =====

'''
        c=c.replace(anchor,js+anchor,1)

    # Reset the new input with a new project.
    old_reset="document.getElementById('fileInput').value='';document.getElementById('loadInput').value='';"
    new_reset="document.getElementById('fileInput').value='';document.getElementById('loadInput').value='';document.getElementById('dxfInput').value='';"
    if old_reset in c:
        c=c.replace(old_reset,new_reset,1)

    # Add icon and expose input to the modern toolbar shell.
    if "cad:svg(" not in c:
        icon_anchor="    upload:svg('<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><path d=\"M12 16V8M9 11l3-3 3 3\"/>'),"
        if icon_anchor not in c: raise SystemExit('upload icon anchor missing')
        cad_icon="\n    cad:svg('<path d=\"M5 3h10l4 4v14H5z\"/><path d=\"M15 3v5h5M8 16l3-6 3 6M9 14h4M16 11v5h3\"/>'),"
        c=c.replace(icon_anchor,icon_anchor+cad_icon,1)

    old_inputs="  const loadInput=document.getElementById('loadInput');\n  const fileInput=document.getElementById('fileInput');\n  if(loadInput)document.body.appendChild(loadInput);\n  if(fileInput)document.body.appendChild(fileInput);"
    new_inputs="  const loadInput=document.getElementById('loadInput');\n  const fileInput=document.getElementById('fileInput');\n  const dxfInput=document.getElementById('dxfInput');\n  if(loadInput)document.body.appendChild(loadInput);\n  if(fileInput)document.body.appendChild(fileInput);\n  if(dxfInput)document.body.appendChild(dxfInput);"
    if old_inputs in c:
        c=c.replace(old_inputs,new_inputs,1)
    elif 'const dxfInput=document.getElementById(\'dxfInput\')' not in c:
        raise SystemExit('modern toolbar input anchor missing')

    old_upload="      label('v44Upload','upload','رفع الخارطة','fileInput','','خارطة')"
    new_upload=old_upload+",\n      label('v60Dxf','cad','فتح مخطط AutoCAD DXF','dxfInput','','DXF')"
    if "label('v60Dxf'" not in c:
        if old_upload not in c: raise SystemExit('modern upload button anchor missing')
        c=c.replace(old_upload,new_upload,1)

    # V60 marker and validation.
    marker='<!-- V60 AutoCAD DXF -->'
    if marker not in c:
        idx=c.rfind('</body>')
        if idx<0: raise SystemExit('body closing tag missing')
        c=c[:idx]+marker+'\n'+c[idx:]
    required=['id="dxfInput"','function parseAsciiDxf','function renderDxfMap',"label('v60Dxf'",'V60 AutoCAD DXF']
    missing=[x for x in required if x not in c]
    if missing:raise SystemExit('V60 verification failed: '+', '.join(missing))
    p.write_text(c,encoding='utf-8')

sw=Path('service-worker.js')
if sw.exists():
    t=sw.read_text(encoding='utf-8')
    t=re.sub(r'const CACHE_NAME = "[^"]+";', 'const CACHE_NAME = "taatheethi-v60-autocad-dxf";', t, count=1)
    sw.write_text(t,encoding='utf-8')

mf=Path('manifest.webmanifest')
if mf.exists():
    t=mf.read_text(encoding='utf-8')
    t=re.sub(r'"name"\s*:\s*"[^"]+"', '"name": "تأثيثي V60 - استيراد AutoCAD DXF"', t, count=1)
    t=re.sub(r'"description"\s*:\s*"[^"]+"', '"description": "تأثيثي مع استيراد مخططات AutoCAD DXF وضبط المقياس تلقائيًا ووضع الأثاث فوق المخطط."', t, count=1)
    mf.write_text(t,encoding='utf-8')

print('V60 AutoCAD DXF patch applied')
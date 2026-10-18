/* Fit the active selection using the same canvas coordinates in both views. */
(()=>{
 function bounds(){
  const eng=window.SewerEngineering?.isActive(),api=window.SewerPlan;
  const ref=eng?window.SewerEngineering.selectionReference():api?.selectionReference();
  const boxes=[];
  const point=(p,r=20)=>{if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))boxes.push({minX:p.x-r,maxX:p.x+r,minY:p.y-r,maxY:p.y+r});};
  const item=it=>{if(it)boxes.push(itemAABBAt(it));};
  if(!eng)selectedItems().forEach(item);
  if(ref?.type==='furniture')item(items.find(it=>it.id===ref.id));
  else if(ref?.type==='symbol'){const s=window.SewerEngineering.getSymbols().find(s=>s.id===ref.id);point(s,50*(s?.scale||1));}
  else if(ref?.type==='junction'){const j=api.getJunctions()[ref.index];point(j,Math.max(20,(j?.diameter||4)*2.54*(pxPerCm||1)*(j?.visualScale||1)));}
  else if(ref){const r=ref.draft?api.getDraft()?.route:api.getRoutes()[ref.route];if(r){const radius=Math.max(15,(r.diameter||4)*2.54*(pxPerCm||1));if(ref.type==='segment'){point(r.points[ref.segment],radius);point(r.points[ref.segment+1],radius);}else if(ref.type==='coupling'){point(r.points[ref.segment],radius);point(r.points[ref.segment+1],radius);}else point(r.points[ref.point],radius);}}
  if(!boxes.length)return null;
  return {minX:Math.min(...boxes.map(b=>b.minX)),maxX:Math.max(...boxes.map(b=>b.maxX)),minY:Math.min(...boxes.map(b=>b.minY)),maxY:Math.max(...boxes.map(b=>b.maxY))};
 }
 function fit(){const b=bounds();if(!b)return;const w=mainScroll.clientWidth,h=mainScroll.clientHeight;
  setZoomPercent(100*Math.min(w*.78/Math.max(1,b.maxX-b.minX),h*.78/Math.max(1,b.maxY-b.minY)));
  const center=()=>{const c=canvas.getBoundingClientRect(),v=mainScroll.getBoundingClientRect();mainScroll.scrollLeft+=c.left+(b.minX+b.maxX)/2*c.width/canvas.width-(v.left+mainScroll.clientLeft+w/2);mainScroll.scrollTop+=c.top+(b.minY+b.maxY)/2*c.height/canvas.height-(v.top+mainScroll.clientTop+h/2);};center();requestAnimationFrame(center);
 }
 window.SewerSelectedView={bounds,fit};
})();

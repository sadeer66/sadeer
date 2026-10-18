(function(){
'use strict';
function removeTarget(s,t){
 const r=s.routes[t.route];
 if(t.type==='elbow'&&r){r.removedElbows=r.removedElbows||{};r.removedElbows[t.point]=true;return true;}
 if(t.type==='junction'){s.junctions.splice(t.index,1);return true;}
 if(t.type==='furniture'){const it=s.items.find(v=>v.id===t.id);if(!it||it.locked)return false;s.items=s.items.filter(v=>v.id!==t.id);return true;}
 if(t.type!=='segment'||!r)return false;
 const cut=t.segment,pieces=[];
 function part(start,end){if(end-start<2)return;const q={...r,id:r.id+'_cut_'+start+'_'+Date.now(),points:r.points.slice(start,end).map(p=>({...p}))};
  for(const key of ['elbowColors','removedElbows','couplingLengths']){q[key]={};for(const [k,v]of Object.entries(r[key]||{})){const n=Number(k)-start;if(n>=0&&n<q.points.length)q[key][n]=v;}}
  q.couplingColors={};for(const [k,v]of Object.entries(r.couplingColors||{})){const [a,b]=k.split(':').map(Number),n=a-start;if(n>=0&&n<q.points.length-1)q.couplingColors[n+':'+b]=v;}
  pieces.push({q,start,end});}
 part(0,cut+1);part(cut+1,r.points.length);
 s.routes.splice(t.route,1,...pieces.map(p=>p.q));
 // Preserve attached pieces on the surviving spans; detach those on the removed span.
 function relink(owner,key){const a=owner[key];if(!a||a.routeId!==r.id)return;const pos=a.segment??a.elbow;const p=pieces.find(p=>pos>=p.start&&pos<p.end-1);if(!p){delete owner[key];return;}a.routeId=p.q.id;if(a.segment!=null)a.segment-=p.start;if(a.elbow!=null)a.elbow-=p.start;}
 for(const j of s.junctions){relink(j,'attachment');relink(j,'fittingAttachment');}for(const it of s.items){relink(it,'sewerAttachment');relink(it,'engineeringConnection');}
 return true;
}
window.SewerDeleteModel={removeTarget};
function boot(){const canvas=document.getElementById('canvas'),rail=document.getElementById('furnitureIconToolbar');if(!canvas||!rail||!window.SewerPlan)return;
 let mode=false,spent=false,undo=[];const group=document.createElement('div');group.className='unifiedEditControls';
 function button(id,text,glyph){const b=document.createElement('button');b.type='button';b.id=id;b.className='modernIconBtn';b.innerHTML='<b style="font-size:21px">'+glyph+'</b><span class="iconLabel">'+text+'</span>';b.title=text;group.appendChild(b);return b;}
 const del=button('sewerDeletePiece','حذف أنبوب/عكس','⌫'),back=button('sewerUndoDelete','تراجع الحذف','↶');back.disabled=true;
 const controls=rail.querySelector('.unifiedEditControls');if(controls)controls.after(group);else rail.prepend(group);
 function setMode(on){mode=on;del.classList.toggle('active',on);del.setAttribute('aria-pressed',String(on));canvas.style.cursor=on?'crosshair':'';}
 window.SewerDelete={stop:()=>{setMode(false);spent=false;},isActive:()=>mode||spent};
 del.onclick=()=>{spent=false;window.SewerPlan.finishInteraction();setMode(!mode);if(mode)setStatus('اضغط الأنبوب لحذف الجزء بين زاويتين، أو اضغط العكس لحذفه وحده؛ Esc للإلغاء');};
 back.onclick=()=>{const s=undo.pop();if(!s)return;window.SewerPlan.restoreSnapshot(s);back.disabled=!undo.length;setMode(false);setStatus('تم التراجع عن الحذف');};
 function target(p){const api=window.SewerPlan,hit=api.hitAccessoryHandle(p);if(hit&&hit.target.type!=='coupling')return hit.target;
  const routes=api.getRoutes(),u=canvas.width/Math.max(1,canvas.getBoundingClientRect().width),tol=12*u;
  for(let ri=routes.length-1;ri>=0;ri--){const r=routes[ri];for(let i=1;i<r.points.length-1;i++)if(r.autoElbows!==false&&!(r.removedElbows&&r.removedElbows[i])&&Math.hypot(p.x-r.points[i].x,p.y-r.points[i].y)<tol)return {type:'elbow',route:ri,point:i};}
  let best=null,dist=Infinity;routes.forEach((r,ri)=>{for(let i=0;i<r.points.length-1;i++){const q=window.SewerGeometry.project(r.points[i],r.points[i+1],p),d=Math.hypot(p.x-q.x,p.y-q.y),w=(window.SewerFittingSizes.centimetres[r.diameter]||r.diameter*2.54)*(typeof pxPerCm==='number'?pxPerCm:1.6);if(d<Math.max(tol,w/2)&&d<dist){best={type:'segment',route:ri,segment:i};dist=d;}}});return best;
 }
 function block(e){e.preventDefault();e.stopImmediatePropagation();}
 document.addEventListener('pointerdown',e=>{if((!mode&&!spent)||e.target!==canvas||e.button>0)return;block(e);if(spent)return;const b=canvas.getBoundingClientRect(),p={x:(e.clientX-b.left)*canvas.width/b.width,y:(e.clientY-b.top)*canvas.height/b.height},t=target(p);if(!t){setStatus('اضغط على جسم الأنبوب أو العكس المراد حذفه');return;}const before=window.SewerPlan.snapshot(),after=JSON.parse(JSON.stringify(before));if(!removeTarget(after,t))return;undo.push(before);if(undo.length>20)undo.shift();window.SewerPlan.restoreSnapshot(after);back.disabled=false;setMode(false);spent=true;setStatus(t.type==='segment'?'تم حذف جزء الأنبوب — يمكنك التراجع عن الحذف':'تم حذف القطعة — يمكنك التراجع عن الحذف');},true);
 for(const type of ['pointermove','pointerup','click'])document.addEventListener(type,e=>{if((mode||spent)&&e.target===canvas)block(e);},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMode(false);spent=false;}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

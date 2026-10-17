/* Render only the visible map at native screen density; model coordinates stay unchanged. */
(function(){
  'use strict';
  if(typeof canvas==='undefined'||typeof ctx==='undefined'||typeof draw!=='function')return;
  var display=document.createElement('canvas'),displayContext=display.getContext('2d');
  if(!displayContext)return;
  display.id='furniplanHighResolution';display.setAttribute('aria-hidden','true');
  display.style.cssText='position:absolute;pointer-events:none;z-index:1;display:block;image-rendering:auto';
  canvas.parentElement.appendChild(display);
  var sceneDraw=draw,frame=0,failed=false;
  function viewport(){
    var r=canvas.getBoundingClientRect(),v=mainScroll.getBoundingClientRect();
    var left=Math.max(r.left,v.left+mainScroll.clientLeft,0),top=Math.max(r.top,v.top+mainScroll.clientTop,0);
    var right=Math.min(r.right,v.left+mainScroll.clientLeft+mainScroll.clientWidth,window.innerWidth);
    var bottom=Math.min(r.bottom,v.top+mainScroll.clientTop+mainScroll.clientHeight,window.innerHeight);
    var width=Math.max(0,right-left),height=Math.max(0,bottom-top);
    var density=Math.min(window.devicePixelRatio||1,3,Math.sqrt(6000000/Math.max(1,width*height)),8192/Math.max(1,width),8192/Math.max(1,height));
    return {x:left-r.left,y:top-r.top,width:width,height:height,density:density,scaleX:r.width/canvas.width,scaleY:r.height/canvas.height};
  }
  function repaint(){
    frame=0;if(failed)return;
    var view=viewport();if(!view.width||!view.height){display.hidden=true;display.style.display='none';return;}
    display.hidden=false;display.style.display='block';
    display.style.left=((canvas.offsetLeft||0)+view.x)+'px';display.style.top=((canvas.offsetTop||0)+view.y)+'px';
    display.style.width=view.width+'px';display.style.height=view.height+'px';
    var width=Math.max(1,Math.floor(view.width*view.density)),height=Math.max(1,Math.floor(view.height*view.density));
    if(display.width!==width||display.height!==height){display.width=width;display.height=height;}
    var dx=width/view.width,dy=height/view.height;
    displayContext.setTransform(1,0,0,1,0,0);displayContext.clearRect(0,0,width,height);
    displayContext.setTransform(view.scaleX*dx,0,0,view.scaleY*dy,-view.x*dx,-view.y*dy);
    var modelContext=ctx;
    try{ctx=displayContext;sceneDraw();}
    catch(error){failed=true;display.style.display='none';console.error('FurniPlan high-resolution view',error);}
    finally{ctx=modelContext;}
  }
  function schedule(){if(!frame&&!failed)frame=requestAnimationFrame(repaint);}
  draw=function(){sceneDraw.apply(this,arguments);schedule();};
  mainScroll.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  if(window.visualViewport){window.visualViewport.addEventListener('resize',schedule);window.visualViewport.addEventListener('scroll',schedule);}
  if(typeof ResizeObserver!=='undefined'){var observer=new ResizeObserver(schedule);observer.observe(canvas);observer.observe(mainScroll);}
  window.FurniPlanHighResolution={refresh:schedule,getViewport:viewport};schedule();
})();

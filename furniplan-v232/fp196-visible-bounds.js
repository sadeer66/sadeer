/* Rendering bounds only: original artwork and stored project dimensions remain intact. */
(function(){
 'use strict';
 const bounds=new WeakMap();
 function rect(image){
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  if(!w||!h)return {x:0,y:0,w:1,h:1};
  const cached=bounds.get(image);if(cached&&cached.source===(image.currentSrc||image.src||'')&&cached.iw===w&&cached.ih===h)return cached;
  let r={x:0,y:0,w:w,h:h};
  const c=document.createElement('canvas');c.width=w;c.height=h;
  try{
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const pixels=g.getImageData(0,0,w,h).data;
   let x0=w,y0=h,x1=-1,y1=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   if(x1>=x0&&y1>=y0)r={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
  }catch(e){/* Cross-origin imports retain their original display when pixels cannot be read. */}
  c.width=c.height=1;r.source=image.currentSrc||image.src||'';r.iw=w;r.ih=h;bounds.set(image,r);return r;
 }
 function draw(context,image,x,y,w,h,reference){const r=rect(reference||image);context.drawImage(image,r.x,r.y,r.w,r.h,x,y,w,h);}
 function crop(image){const r=rect(image),c=document.createElement("canvas");c.width=r.w;c.height=r.h;c.getContext("2d").drawImage(image,r.x,r.y,r.w,r.h,0,0,r.w,r.h);return c;}
 window.FP196Visible={rect:rect,draw:draw,crop:crop};
 // Thumbnail normalization is lazy and limited to the visible library images.
 const normalized=new WeakMap();
 document.addEventListener('load',function(event){
  const im=event.target;if(!im||im.tagName!=='IMG'||!im.closest('#library,#fullLibGrid,#libraryPreview'))return;
  const source=im.currentSrc||im.src;if(normalized.get(im)===source)return;
  const r=rect(im);if(r.x===0&&r.y===0&&r.w===im.naturalWidth&&r.h===im.naturalHeight)return;
  try{const c=document.createElement('canvas'),scale=Math.min(1,512/Math.max(r.w,r.h));c.width=Math.max(1,Math.round(r.w*scale));c.height=Math.max(1,Math.round(r.h*scale));c.getContext('2d').drawImage(im,r.x,r.y,r.w,r.h,0,0,c.width,c.height);const view=c.toDataURL('image/png');normalized.set(im,view);im.src=view;c.width=c.height=1;}catch(e){}
 },true);
})();

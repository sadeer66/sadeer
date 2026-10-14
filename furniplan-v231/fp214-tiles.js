/* V214: texture repetition and calibrated joints are independent. */
(() => {
 'use strict';
 const dimension=v=>Math.max(1,Math.min(1000,Number(v)||120));
 function geometry(l,w,h,mw,mh,ppcm){
  const factor=l.alignTexture===false?Math.max(.25,Number(l.repeat)||1):1;
  return {x:dimension(l.tileWidthCm)*(ppcm||1)*w/mw,y:dimension(l.tileHeightCm)*(ppcm||1)*h/mh,factor};
 }
 function fill(c,tile,l,w,h,sx,sy){
  const pattern=c.createPattern(tile,'repeat');if(!pattern)return;
  pattern.setTransform(new DOMMatrix().translate(w/2,h/2).scale(w/canvas.width,h/canvas.height).rotate(l.angle||0).scale(sx/(w/canvas.width),sy/(h/canvas.height)));
  c.fillStyle=pattern;c.fillRect(0,0,w,h);
 }
 function paintTexture(c,l,w,h,mw,mh,ppcm){
  const g=geometry(l,w,h,mw,mh,ppcm),brick=l.alignTexture!==false&&l.layout==='brick';
  const tile=window.FP203Materials.tile(l.material,{...l,groutWidth:0,layout:brick?'brick':'square'}),multiple=brick?2:1;
  c.save();c.globalAlpha=l.textureOpacity;fill(c,tile,l,w,h,g.x*multiple/tile.width/g.factor,g.y*multiple/tile.height/g.factor);c.restore();
 }
 function paintGrid(c,l,w,h,mw,mh,ppcm){
  if(!(ppcm>0)||!(l.groutWidth>0))return;
  // Draw joints directly; a downsampled repeating bitmap can miss thin
  // horizontal rows altogether, especially in the staggered layout.
  const tw=dimension(l.tileWidthCm)*ppcm,th=dimension(l.tileHeightCm)*ppcm;
  const radius=Math.hypot(mw,mh)/2,brick=l.layout==='brick';
  const firstRow=Math.floor(-radius/th),lastRow=Math.ceil(radius/th);
  const firstCol=Math.floor(-radius/tw)-1,lastCol=Math.ceil(radius/tw)+1;
  c.save();c.globalAlpha=1;c.translate(w/2,h/2);c.scale(w/mw,h/mh);c.rotate((l.angle||0)*Math.PI/180);
  c.strokeStyle=l.groutColor||'#c9c4ba';c.lineWidth=Number(l.groutWidth)/10*ppcm;c.lineCap='butt';
  c.beginPath();
  for(let row=firstRow;row<=lastRow;row++){
   const y=row*th;c.moveTo(-radius,y);c.lineTo(radius,y);
  }
  if(brick){
   for(let row=firstRow;row<lastRow;row++){
    const offset=Math.abs(row%2)*tw/2;
    for(let col=firstCol;col<=lastCol;col++){
     const x=col*tw+offset;c.moveTo(x,row*th);c.lineTo(x,(row+1)*th);
    }
   }
  }else{
   for(let col=firstCol;col<=lastCol;col++){const x=col*tw;c.moveTo(x,-radius);c.lineTo(x,radius);}
  }
  c.stroke();c.restore();
 }
 window.FP214Tiles={geometry,paintTexture,paintGrid};
})();

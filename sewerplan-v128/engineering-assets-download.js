(function(){'use strict';
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function header(size){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);return {bytes,u16:(p,v)=>view.setUint16(p,v,true),u32:(p,v)=>view.setUint32(p,v,true)};}
function zipFiles(files){const local=[],central=[];let offset=0,centralSize=0;
 for(const file of files){const name=new TextEncoder().encode(file.name),data=file.data,crc=crc32(data),h=header(30);h.u32(0,0x04034b50);h.u16(4,20);h.u16(6,0x800);h.u32(14,crc);h.u32(18,data.length);h.u32(22,data.length);h.u16(26,name.length);local.push(h.bytes,name,data);
 const c=header(46);c.u32(0,0x02014b50);c.u16(4,20);c.u16(6,20);c.u16(8,0x800);c.u32(16,crc);c.u32(20,data.length);c.u32(24,data.length);c.u16(28,name.length);c.u32(42,offset);central.push(c.bytes,name);centralSize+=46+name.length;offset+=30+name.length+data.length;}
 const end=header(22);end.u32(0,0x06054b50);end.u16(8,files.length);end.u16(10,files.length);end.u32(12,centralSize);end.u32(16,offset);return new Blob([...local,...central,end.bytes],{type:'application/zip'});
}
window.EngineeringAssetZip=zipFiles;
const button=document.getElementById('downloadAllImages'),status=document.getElementById('downloadStatus');if(!button)return;
button.onclick=async()=>{button.disabled=true;try{const links=[...document.querySelectorAll('article a[download]')],files=[];let index=0,done=0;await Promise.all(Array.from({length:3},async()=>{while(index<links.length){const link=links[index++],response=await fetch(link.href);if(!response.ok)throw Error('Download failed');files.push({name:link.download,data:new Uint8Array(await response.arrayBuffer())});status.textContent=`تجهيز الصور ${++done} / ${links.length}`;}}));const blob=zipFiles(files),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sewerplan-3d-images-v88.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='تم تجهيز جميع الصور للتنزيل.';}catch(_){status.textContent='تعذّر تجميع الصور. يمكنك تنزيل كل صورة من زرها أو المحاولة مجدداً.';}finally{button.disabled=false;}};
})();

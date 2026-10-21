'use strict';
(()=>{
 if(!window.webkit?.messageHandlers?.sesFiles)return;
 const pending=new Map();let serial=0;
 window.SESNative={save(name,text){return new Promise((resolve,reject)=>{const id=String(++serial);pending.set(id,{resolve,reject});window.webkit.messageHandlers.sesFiles.postMessage({action:'save',id,name,text})})}};
 window.SESNativeComplete=(id,error)=>{const p=pending.get(id);if(!p)return;pending.delete(id);if(error)p.reject(Error(error));else p.resolve()};
})();

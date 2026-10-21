'use strict';
// Runs before each copied application. Preferences never fall through to stable apps.
(()=>{
 const native=window.localStorage,prefix='ses-lab-20261021:'+document.documentElement.dataset.sesStage+':';
 const storage={getItem:k=>native.getItem(prefix+k),setItem:(k,v)=>native.setItem(prefix+k,String(v)),removeItem:k=>native.removeItem(prefix+k),clear(){for(const k of Object.keys(native))if(k.startsWith(prefix))native.removeItem(k)},key(i){return Object.keys(native).filter(k=>k.startsWith(prefix))[i]?.slice(prefix.length)??null},get length(){return Object.keys(native).filter(k=>k.startsWith(prefix)).length}};
 Object.defineProperty(window,'localStorage',{value:storage});
})();

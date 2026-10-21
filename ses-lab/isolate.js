'use strict';
// Only installed inside the independent SES copies, before their native code.
(()=>{
 const native=window.localStorage,prefix='ses-lab-20261021:'+document.documentElement.dataset.sesStage+(new URLSearchParams(location.search).has('qa')?':qa:':':');
 const storage={getItem:k=>native.getItem(prefix+k),setItem:(k,v)=>native.setItem(prefix+k,String(v)),removeItem:k=>native.removeItem(prefix+k),clear(){for(const k of Object.keys(native))if(k.startsWith(prefix))native.removeItem(k)},key(i){return Object.keys(native).filter(k=>k.startsWith(prefix))[i]?.slice(prefix.length)??null},get length(){return Object.keys(native).filter(k=>k.startsWith(prefix)).length}};
 Object.defineProperty(window,'localStorage',{value:storage});
 const factory=window.indexedDB;
 if(factory){const scoped={open:(name,version)=>version===undefined?factory.open(prefix+name):factory.open(prefix+name,version),deleteDatabase:name=>factory.deleteDatabase(prefix+name),cmp:factory.cmp.bind(factory)};Object.defineProperty(window,'indexedDB',{value:scoped});}
 // Native PWA installers must not prefetch a second library or touch stable caches.
 if('serviceWorker'in navigator)Object.defineProperty(navigator,'serviceWorker',{value:{register:()=>Promise.resolve({update(){},active:true}),ready:Promise.resolve({}),getRegistrations:()=>Promise.resolve([]),addEventListener(){},controller:null}});
 // Automatic helper-link checks are optional and must not require a network at startup.
 const nativeFetch=window.fetch.bind(window);
 window.fetch=(input,options)=>{const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.origin!==location.origin&&u.protocol!=='data:'&&u.protocol!=='blob:')return Promise.reject(Error('المحتوى الخارجي يحتاج اتصالًا'));return nativeFetch(input,options)};
})();

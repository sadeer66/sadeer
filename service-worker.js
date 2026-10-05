const CACHE='furniplan-v179-kitchen-laundry-20261005';
const CORE=[
  './',
  './index.html',
  './assets/v179/kitchen_01.webp',
  './assets/v179/kitchen_02.webp',
  './assets/v179/kitchen_03.webp',
  './assets/v179/kitchen_04.webp',
  './assets/v179/kitchen_05.webp',
  './assets/v179/kitchen_06.webp',
  './assets/v179/kitchen_07.webp',
  './assets/v179/kitchen_08.webp',
  './assets/v179/kitchen_09.webp',
  './assets/v179/kitchen_10.webp',
  './assets/v179/kitchen_11.webp',
  './assets/v179/kitchen_12.webp',
  './assets/v179/kitchen_13.webp',
  './assets/v179/kitchen_14.webp',
  './assets/v179/kitchen_15.webp',
  './assets/v179/laundry_01.webp',
  './assets/v179/laundry_02.webp',
  './assets/v179/laundry_03.webp',
  './assets/v179/laundry_04.webp',
  './assets/v179/laundry_05.webp',
  './assets/v179/laundry_06.webp',
  './assets/v179/laundry_07.webp',
  './assets/v179/laundry_08.webp',
  './assets/v179/laundry_09.webp',
  './assets/v179/laundry_10.webp',
  './manifest.webmanifest',
  './v85-final-patch.js?v=179',
  './icons/icon-192.png?v=100',
  './icons/icon-512.png?v=100',
  './apple-touch-icon.png',
  './assets/accessories10/accessory_01.webp',
  './assets/accessories10/accessory_02.webp',
  './assets/accessories10/accessory_03.webp',
  './assets/accessories10/accessory_04.webp',
  './assets/accessories10/accessory_05.webp',
  './assets/accessories10/accessory_06.webp',
  './assets/accessories10/accessory_07.webp',
  './assets/accessories10/accessory_08.webp',
  './assets/accessories10/accessory_09.webp',
  './assets/accessories10/accessory_10.webp',
  './assets/v176/living_01.webp',
  './assets/v176/living_02.webp',
  './assets/v176/living_03.webp',
  './assets/v176/living_04.webp',
  './assets/v176/living_05.webp',
  './assets/v176/living_06.webp',
  './assets/v176/living_07.webp',
  './assets/v176/living_08.webp',
  './assets/v176/living_09.webp',
  './assets/v176/living_10.webp',
  './assets/v176/dining_01.webp',
  './assets/v176/dining_02.webp',
  './assets/v176/dining_03.webp',
  './assets/v176/dining_04.webp',
  './assets/v176/dining_05.webp',
  './assets/v176/dining_06.webp',
  './assets/v176/dining_07.webp',
  './assets/v176/dining_08.webp',
  './assets/v176/dining_09.webp',
  './assets/v176/dining_10.webp',
  './assets/v176/bedroom_01.webp',
  './assets/v176/bedroom_02.webp',
  './assets/v176/bedroom_03.webp',
  './assets/v176/bedroom_04.webp',
  './assets/v176/bedroom_05.webp',
  './assets/v176/bedroom_06.webp',
  './assets/v176/bedroom_07.webp',
  './assets/v176/bedroom_08.webp',
  './assets/v176/bedroom_09.webp',
  './assets/v176/bedroom_10.webp',
  './assets/v176/bathroom_01.webp',
  './assets/v176/bathroom_02.webp',
  './assets/v176/bathroom_03.webp',
  './assets/v176/bathroom_04.webp',
  './assets/v176/bathroom_05.webp',
  './assets/v176/bathroom_06.webp',
  './assets/v176/bathroom_07.webp',
  './assets/v176/bathroom_08.webp',
  './assets/v176/bathroom_09.webp',
  './assets/v176/bathroom_10.webp'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE.map(u=>new Request(u,{cache:'reload'}))))
      .catch(()=>{})
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')||caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res && res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
    })
  );
});

const CACHE_NAME = "furniture-planner-v16-1";
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './logo2.png', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png', './assets/furniture/armchair_orange.png', './assets/furniture/armchair_yellow.png', './assets/furniture/basin_half_60.png', './assets/furniture/basin_half_70.png', './assets/furniture/basin_round_small.png', './assets/furniture/bathtub.png', './assets/furniture/bed_double_purple.png', './assets/furniture/bed_double_red.png', './assets/furniture/bed_single_blue.png', './assets/furniture/bed_single_white.png', './assets/furniture/bidet_slim.png', './assets/furniture/cabinet_low.png', './assets/furniture/cabinet_wide.png', './assets/furniture/car_red.png', './assets/furniture/car_white.png', './assets/furniture/ceiling_fan.png', './assets/furniture/ceiling_light_large.png', './assets/furniture/ceiling_light_medium.png', './assets/furniture/coffee_dark.png', './assets/furniture/coffee_red.png', './assets/furniture/console_brown.png', './assets/furniture/cooktop_2.png', './assets/furniture/cooktop_4.png', './assets/furniture/corner_module_red.png', './assets/furniture/corner_sofa_red.png', './assets/furniture/corner_sofa_small_red.png', './assets/furniture/counter_module_1.png', './assets/furniture/counter_module_2.png', './assets/furniture/counter_white_135.png', './assets/furniture/dining_rect.png', './assets/furniture/dining_round.png', './assets/furniture/dining_small.png', './assets/furniture/dining_square_gray.png', './assets/furniture/double_sink.png', './assets/furniture/floor_drain_round.png', './assets/furniture/floor_drain_square.png', './assets/furniture/fridge_small.png', './assets/furniture/fridge_tall.png', './assets/furniture/kitchen_sink_60.png', './assets/furniture/light_square_small.png', './assets/furniture/light_wall_1.png', './assets/furniture/light_wall_2.png', './assets/furniture/light_wall_3.png', './assets/furniture/light_wall_4.png', './assets/furniture/linear_drain.png', './assets/furniture/microwave_60.png', './assets/furniture/ottoman_green.png', './assets/furniture/plant_small.png', './assets/furniture/pouf_red.png', './assets/furniture/round_basin_60.png', './assets/furniture/shower_blue.png', './assets/furniture/shower_corner_110.png', './assets/furniture/shower_corner_70.png', './assets/furniture/shower_corner_80.png', './assets/furniture/shower_corner_90.png', './assets/furniture/shower_long.png', './assets/furniture/shower_square_70.png', './assets/furniture/shower_square_80.png', './assets/furniture/shower_square_90.png', './assets/furniture/side_table_red_small.png', './assets/furniture/sink.png', './assets/furniture/sink_beige_2.png', './assets/furniture/sink_counter_120.png', './assets/furniture/sofa_3.png', './assets/furniture/sofa_orange_2.png', './assets/furniture/sofa_orange_3.png', './assets/furniture/sofa_orange_long.png', './assets/furniture/spot_large.png', './assets/furniture/spot_medium.png', './assets/furniture/spot_small.png', './assets/furniture/stool_round_brown.png', './assets/furniture/stool_round_red.png', './assets/furniture/toilet.png', './assets/furniture/tv_console_brown.png', './assets/furniture/utility_small_gray.png', './assets/furniture/washer_round_blue.png', './assets/furniture/worktop_brown.png'];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const req=event.request;
  const isPage=req.mode==="navigate" || new URL(req.url).pathname.endsWith("/index.html");
  if(isPage){
    event.respondWith(
      fetch(req).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));
        return response;
      }).catch(()=>caches.match(req).then(r=>r||caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
      return response;
    }))
  );
});

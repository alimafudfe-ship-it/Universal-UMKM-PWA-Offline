const CACHE='universal-umkm-pwa-v3-3-45-katalog-25-usaha';
const CORE=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./master.json','./icon-192.png','./icon-512.png','./icon-512-maskable.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('universal-umkm-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const isAppScript=url.pathname.endsWith('/app.js')||url.pathname==='/app.js';
  const isHtml=request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname==='/';
  if(isAppScript||isHtml){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }).catch(async()=>{
      return (await caches.match(request))||(isHtml?await caches.match('./index.html'):await caches.match('./app.js'))||Response.error();
    }));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>caches.match('./index.html'))));
});

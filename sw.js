// Офлайн-режим: оболочка и картинки кэшируются; страница и скрипты обновляются из сети, когда она есть.
var V='back-v10';
var CORE=["./", "index.html", "anim.js", "tgbk.js", "ydsync.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png", "icon.svg", "gif/ph-1-1.webp", "gif/ph-30-1.webp", "gif/ph-1-2.webp", "gif/ph-10-1.webp", "gif/ph-10-2.webp", "gif/ph-12-1.webp", "gif/ph-12-2.webp", "gif/ph-14-1.webp", "gif/ph-14-2.webp", "gif/ph-16-1.webp", "gif/ph-16-2.webp", "gif/ph-17-1.webp", "gif/ph-17-2.webp", "gif/ph-18-1.webp", "gif/ph-18-2.webp", "gif/ph-19-1.webp", "gif/ph-19-2.webp", "gif/ph-2-1.webp", "gif/ph-2-2.webp", "gif/ph-20-1.webp", "gif/ph-21-1.webp", "gif/ph-21-2.webp", "gif/ph-23-1.webp", "gif/ph-23-2.webp", "gif/ph-24-1.webp", "gif/ph-24-2.webp", "gif/ph-4-1.webp", "gif/ph-4-2.webp", "gif/ph-6-1.webp", "gif/ph-6-2.webp", "gif/ph-8-1.webp", "gif/ph-8-2.webp"];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url); if(u.origin!==location.origin) return;
  if(/\.(webp|png|svg)$/.test(u.pathname)){ // картинки: сразу из кэша, фоном обновляем
    e.respondWith(caches.open(V).then(function(c){return c.match(r).then(function(hit){
      var net=fetch(r).then(function(res){ if(res&&res.ok) c.put(r,res.clone()); return res; }).catch(function(){return hit;});
      return hit||net;
    });}));
    return;
  }
  e.respondWith(fetch(r).then(function(res){ // страница и скрипты: сначала сеть, без сети из кэша
    if(res&&res.ok){ var cp=res.clone(); caches.open(V).then(function(c){c.put(r,cp);}); }
    return res;
  }).catch(function(){return caches.match(r).then(function(h){return h||caches.match('index.html');});}));
});

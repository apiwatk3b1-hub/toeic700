/* Service worker: เปิดแอปและใช้งานออฟไลน์ได้ */
var V = 't700-v6';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(V).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==V; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});
function put(req, res){ var cp=res.clone(); caches.open(V).then(function(c){ c.put(req, cp); }); }
self.addEventListener('fetch', function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url);
  /* ไฟล์เสียง: ใช้ของที่เก็บไว้ก่อน ไม่มีค่อยโหลดแล้วเก็บ */
  if(u.origin===location.origin && u.pathname.indexOf('/audio/')>=0){
    e.respondWith(caches.match(r).then(function(h){
      return h || fetch(r).then(function(res){ if(res.ok) put(r,res); return res; });
    }));
    return;
  }
  /* หน้าเว็บและฟอนต์: โหลดใหม่เมื่อออนไลน์ ถ้าออฟไลน์ใช้ของที่เก็บไว้ */
  if(u.origin===location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(
      fetch(r).then(function(res){ if(res.ok || res.type==='opaque') put(r,res); return res; })
        .catch(function(){
          return caches.match(r).then(function(h){
            return h || (r.mode==='navigate' ? caches.match('./index.html') : Response.error());
          });
        })
    );
  }
});

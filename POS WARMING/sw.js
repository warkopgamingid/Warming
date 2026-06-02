const CACHE = "warming-pos-v1";

const PRECACHE = [
  "/POS%20PlayStation%20Rental.html",
  "/styles.css",
  "/tweaks-panel.jsx",
  "/data.jsx",
  "/store.jsx",
  "/inventory-store.jsx",
  "/icons.jsx",
  "/screens/dashboard.jsx",
  "/screens/unit-drawer.jsx",
  "/screens/history.jsx",
  "/screens/report.jsx",
  "/screens/menu-mgr.jsx",
  "/app.jsx",
  "/xlsx-export.js",
  "/db-export.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/food/indomie-goreng.png",
  "/assets/food/indomie-rebus.png",
  "/assets/food/kentang-goreng.png",
  "/assets/food/cireng-rujak.png",
  "/assets/drink/es-americano.png",
  "/assets/drink/es-kopi-susu.png",
  "/assets/drink/es-teh-manis.png",
  "/assets/drink/es-nutrisari.png",
  "/assets/drink/hot-latte.png",
  "/assets/drink/hot-americano.png",
  "/assets/addon/telur.png",
  "/assets/addon/kornet.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for local assets, network-first for external (fonts, React CDN)
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Let external CDN requests go through normally (React, Babel, fonts)
  if (url.hostname !== self.location.hostname) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

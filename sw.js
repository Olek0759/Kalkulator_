// Service worker: działa offline, po wgraniu nowej wersji aktualizuje się sam.
// Przy każdej zmianie aplikacji podbij numer wersji poniżej.
var CACHE = "kalkulator-v2";
var FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: "reload" pomija pamięć podręczną przeglądarki, więc zawsze bierze świeże pliki
      return Promise.all(FILES.map(function (f) {
        return fetch(new Request(f, { cache: "reload" })).then(function (r) {
          if (r.ok) return c.put(f, r);
        });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});

// Service worker: działa offline i po cichu odświeża pliki w tle.
// Przy każdej zmianie aplikacji podbij numer wersji poniżej.
var CACHE = "kalkulator-v13";
var FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: "reload" pomija pamięć podręczną przeglądarki, więc zawsze bierze świeże pliki.
      // Brakujący plik (np. ikona) nie psuje instalacji.
      return Promise.all(FILES.map(function (f) {
        return fetch(new Request(f, { cache: "reload" })).then(function (r) {
          if (r.ok) return c.put(f, r);
        }).catch(function () {});
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

// Najpierw pamięć podręczna (szybko i offline), a w tle pobranie świeżej wersji na następne otwarcie.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var sameOrigin = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (sameOrigin && res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return null; });
        if (hit) { e.waitUntil(net); return hit; }
        return net.then(function (res) { return res || c.match("index.html"); });
      });
    })
  );
});

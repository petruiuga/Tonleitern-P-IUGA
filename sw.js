// Offline-Speicher: beim ersten Öffnen (mit Internet) werden alle App-Dateien abgelegt.
// Danach startet die App immer aus dem Speicher – auch ohne Internet – und holt
// im Hintergrund neue Versionen. Bei Änderungen an der App die Versionsnummer erhöhen.
const CACHE = "tonleitern-v13";
const FILES = [
  "./",
  "index.html",
  "app.js",
  "manifest.webmanifest",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "vendor/Tone.js",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "voice/de/1.wav",
  "voice/de/10.wav",
  "voice/de/11.wav",
  "voice/de/12.wav",
  "voice/de/2.wav",
  "voice/de/3.wav",
  "voice/de/4.wav",
  "voice/de/5.wav",
  "voice/de/6.wav",
  "voice/de/7.wav",
  "voice/de/8.wav",
  "voice/de/9.wav",
  "voice/de/and.wav",
  "voice/en/1.wav",
  "voice/en/10.wav",
  "voice/en/11.wav",
  "voice/en/12.wav",
  "voice/en/2.wav",
  "voice/en/3.wav",
  "voice/en/4.wav",
  "voice/en/5.wav",
  "voice/en/6.wav",
  "voice/en/7.wav",
  "voice/en/8.wav",
  "voice/en/9.wav",
  "voice/en/and.wav",
  "voice/fr/1.wav",
  "voice/fr/10.wav",
  "voice/fr/11.wav",
  "voice/fr/12.wav",
  "voice/fr/2.wav",
  "voice/fr/3.wav",
  "voice/fr/4.wav",
  "voice/fr/5.wav",
  "voice/fr/6.wav",
  "voice/fr/7.wav",
  "voice/fr/8.wav",
  "voice/fr/9.wav",
  "voice/fr/and.wav",
  "voice/ro/1.wav",
  "voice/ro/10.wav",
  "voice/ro/11.wav",
  "voice/ro/12.wav",
  "voice/ro/2.wav",
  "voice/ro/3.wav",
  "voice/ro/4.wav",
  "voice/ro/5.wav",
  "voice/ro/6.wav",
  "voice/ro/7.wav",
  "voice/ro/8.wav",
  "voice/ro/9.wav",
  "voice/ro/and.wav",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst aus dem Speicher (sofort, auch offline), im Hintergrund aus dem Netz auffrischen.
// Seitenaufrufe (auch mit anderer Schreibweise der Adresse) bekommen immer die App-Seite.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  const isPage = req.mode === "navigate";
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = isPage
        ? (await cache.match(new URL("./", self.registration.scope).href)) || (await cache.match("index.html"))
        : await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok && !isPage) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(fresh);
        return cached;
      }
      return (await fresh) || new Response("Offline", { status: 503 });
    })
  );
});

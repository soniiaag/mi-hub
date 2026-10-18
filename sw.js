// Mi Hub · service worker
// Guarda la app en el móvil para que abra rápido y funcione sin conexión.
// Los datos NO se guardan aquí: van siempre a Supabase.
const VERSION = "mihub-v1";
const SHELL = ["./", "index.html", "config.js", "supabase.js", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // Supabase: siempre en directo, nunca desde caché
  if (url.hostname.endsWith("supabase.co") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/")) return;
  // Fuentes de Google: caché primero
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (_) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Archivos de la app: red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  }).catch(async () => (await caches.match(req)) || (await caches.match("index.html"))));
});

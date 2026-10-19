// Mi Hub · service worker
// Guarda la app en el móvil para que abra rápido y funcione sin conexión.
// Los datos NO se guardan aquí: van siempre a Supabase.
const VERSION = "mihub-v5";
const SHELL = ["./", "index.html", "styles.css", "config.js", "supabase.js", "core.js", "mod-agenda.js", "mod-entreno.js",
  "mod-finanzas.js", "mod-salud.js", "mod-dieta.js", "mod-datos.js", "mod-musculos.js", "mod-inicio.js", "asistente.js", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/")) return;
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (_) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Archivos de la app: siempre la versión más nueva si hay conexión; si no, la guardada
  e.respondWith(fetch(req, { cache: "no-cache" }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match("index.html"))));
});

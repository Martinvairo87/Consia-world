self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// cache minimal (no aggressive caching para evitar bugs)
self.addEventListener("fetch", (e) => {});

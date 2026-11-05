const CACHE = 'vtpub-v1';
const PRECACHE = ['./', 'vtpub-icon.png'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {}))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Cache d'abord (fonctionne hors ligne), puis mise à jour en arrière-plan quand le réseau est disponible
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    e.respondWith(
        caches.match(req, { ignoreSearch: true }).then(cached => {
            const network = fetch(req).then(res => {
                if (res && res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return res;
            }).catch(() => null);
            if (cached) { e.waitUntil(network); return cached; }
            return network.then(res => res || (req.mode === 'navigate' ? caches.match('./') : null) || Response.error());
        })
    );
});

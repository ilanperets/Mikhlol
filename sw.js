// מכלול: עבודה גם בלי אינטרנט. מעדכנים את המספר כשמעלים גרסה חדשה של index.html.
const CACHE = 'mikhlol-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const save = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // The app itself: always try the network first so updates arrive, fall back to the saved copy offline.
    if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
      e.respondWith(fetch(req).then(r => save(req, r)).catch(() => caches.match(req).then(m => m || caches.match('./index.html'))));
      return;
    }
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => save(req, r))));
    return;
  }
  // Fonts and the screenshot library: keep a copy so they work offline. Claude API calls are never cached.
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)cdnjs\.cloudflare\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => save(req, r))));
  }
});

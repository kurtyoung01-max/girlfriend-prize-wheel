const CACHE = 'girlfriend-prize-wheel-v6-prize-editor';
const FILES = ['./', './index.html', './style.css', './script.js', './manifest.json', './icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request))));

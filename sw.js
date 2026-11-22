// 오프라인 지원: 네트워크 우선, 3초 넘게 안 오면 저장해 둔 것.
// 이 앱 파일 + 우리가족 앱과 같이 쓰는 파일(스티커 규칙 · 포켓몬/티니핑 방 · 그림)만 다룸.
const CACHE = 'weekly-mission-v8';
const SHARED = ['stickers-shared.js', 'poke-room.js', 'mission-board.js', 'poke/', 'ping/'].map((p) => new URL('../our-family/' + p, self.location).pathname);
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-180.png', '../our-family/stickers-shared.js', '../our-family/poke-room.js', '../our-family/mission-board.js'].map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('weekly-mission-v') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const own = u.origin === location.origin;
  const mine = own && (u.pathname.startsWith(new URL('./', self.registration.scope).pathname) || SHARED.some((p) => u.pathname.startsWith(p)));
  if (!mine && u.origin !== 'https://fonts.googleapis.com' && u.origin !== 'https://fonts.gstatic.com') return;
  const net = (own ? fetch(u.href, { cache: 'no-cache' }) : fetch(e.request)).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); }
    return r;
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith((async () => {
    const first = await Promise.race([net.catch(() => null), new Promise((res) => setTimeout(() => res('slow'), 3000))]);
    if (first && first !== 'slow') return first;
    const saved = await caches.match(e.request, { ignoreSearch: own });
    return saved || net;
  })());
});

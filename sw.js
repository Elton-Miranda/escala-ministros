// Service worker: deixa o app abrir rápido e funcionar com internet fraca.
// A escala (data/dados.json) e as páginas sempre tentam a versão mais nova primeiro.
// Ao mudar arquivos de estilo ou código, aumente o número da VERSAO.
const VERSAO = 'escala-v1';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/css/tokens.css', 'assets/css/base.css', 'assets/css/ministro.css',
  'assets/js/core/util.js', 'assets/js/core/dados.js', 'assets/js/core/gerador.js', 'assets/js/core/textos.js', 'assets/js/core/visual.js',
  'assets/js/ministro/app.js',
  'assets/img/logo.svg', 'assets/img/vitral.svg', 'assets/img/pomba.svg', 'assets/img/padrao.svg', 'assets/img/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const primeiroRede = url.pathname.endsWith('.json') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (primeiroRede) {
    e.respondWith(fetch(e.request).then((r) => {
      const copia = r.clone();
      caches.open(VERSAO).then((c) => c.put(e.request.url.split('?')[0], copia));
      return r;
    }).catch(() => caches.match(e.request.url.split('?')[0])));
  } else {
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
  }
});

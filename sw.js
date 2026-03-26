// 升级版本号以触发浏览器更新 (当前：v12.0)
const CACHE_NAME = 'lunar-calendar-v12.0';

// 核心资源列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './screenshot_mobile.png',
  './screenshot_wide.png',
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js',
  'https://gc.zgo.at/count.js'
];

// 1. 安装阶段：强制预缓存所有核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('正在预缓存核心资源...');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：彻底清理旧版冗余缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('清理过期缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 拦截请求：采用“缓存优先，后台更新”策略
self.addEventListener('fetch', (event) => {
  // 仅处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果命中缓存，直接返回，同时在后台发起网络请求更新缓存
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // 检查响应是否有效
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 网络失败时静默处理，因为已经有缓存返回了
      });

      return cachedResponse || fetchPromise;
    })
  );
});

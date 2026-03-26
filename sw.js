// 更新版本号以强制浏览器刷新缓存 (当前版本：v11.0)
const CACHE_NAME = 'lunar-calendar-v11.0';

// 需要缓存的静态资源列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // 核心图标：确保包含您刚在 Manifest 中定义的两个新文件名
  './icon-192.png',
  './icon-512.png',
  // 截图：虽然很大，但缓存后可以让安装界面加载更快
  './screenshot_mobile.png',
  './screenshot_wide.png',
  // 外部依赖库 (CDN 链接也会被 Service Worker 拦截并缓存)
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js',
  'https://gc.zgo.at/count.js'
];

// 安装阶段：预缓存所有资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache: ' + CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 强制新 Service Worker 立即接管
  );
});

// 激活阶段：清理旧版本的缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即开始控制所有页面
  );
});

// 策略：网络优先 (Network First)
// 这样在有网络时能看到最新的节日信息，无网络时使用缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果网络请求成功，克隆一份存入缓存
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // 网络请求失败（离线），尝试从缓存中获取
        return caches.match(event.request);
      })
  );
});

// 使用精确到分钟的时间戳，确保版本唯一性
const CACHE_NAME = 'lunar-clock-20260327-1048';

// ⚠️ 请务必确认以下每一个文件在您的 GitHub 根目录下【真实存在】
// 如果有一个文件找不到（404），安装就会报错 "Failed to fetch"
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. 安装阶段：将资源写入缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('正在开启新缓存:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 强制跳过等待，立即激活新版本
  );
});

// 2. 激活阶段：清理所有旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('正在清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得页面的控制权
  );
});

// 3. 拦截请求：优先从缓存读取
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，直接返回；否则发起网络请求
        return response || fetch(event.request);
      })
  );
});

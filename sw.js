const CACHE_NAME = 'calendar-cache-v3.6'; // 每次修改务必升级版本号
const ASSETS = [
  './',               // 代表根路径，这在 GitHub Pages 中非常重要
  './index.html',     // 明确指向当前目录下的文件
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js'
];

self.addEventListener('install', (e) => {
  // 使用 self.skipWaiting() 强迫旧的 SW 立即退位
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('正在预缓存所有资源...');
      return cache.addAll(ASSETS);
    })
  );
});

// 清理旧缓存（防止 v3.5 的旧文件占用空间）
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() => {
        // 如果网络也断了，且缓存也没命中的 fallback 逻辑（可选）
        console.log('网络不可用且无缓存');
      });
    })
  );
});

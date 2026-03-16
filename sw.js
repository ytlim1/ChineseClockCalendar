const CACHE_NAME = 'calendar-cache-v3.8'; // 每次更新请改版本号
const ASSETS = [
  './',               // 必须包含这个，代表项目根目录
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js'
];

// 1. 安装：强制缓存所有资源
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('正在注入离线缓存...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. 激活：清理掉 v3.5, v3.7 等旧缓存，释放手机空间
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

// 3. 拦截：【核心修改】优先从缓存读取，解决飞行模式白屏
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => {
      // 如果缓存里有，立即返回，不再去请求 GitHub
      if (res) return res;
      
      // 如果缓存没有，再去联网获取
      return fetch(e.request);
    })
  );
});

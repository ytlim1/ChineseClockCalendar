/**
 * Chinese Clock Calendar - Service Worker
 * 版本：v4.2 (2026-03-17)
 * 修复：解决 "Return response is null" 报错及离线路径匹配问题
 */

const CACHE_NAME = 'calendar-cache-v5.5';

// 资源清单：包含所有可能访问到的根路径变体
const ASSETS = [
  './',
  'index.html',
  './index.html',
  'manifest.json',
  './manifest.json',
  'icon.png',
  './icon.png',
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js'
];

// 1. 安装阶段：容错预缓存
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 正在执行容错预缓存...');
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[SW] 资源缓存失败 (跳过): ${url}`, err);
          });
        })
      );
    })
  );
});

// 2. 激活阶段：清理旧版本
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. 拦截请求：核心修复逻辑
self.addEventListener('fetch', (event) => {
  // 只拦截 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // A. 如果缓存命中，直接返回
      if (cachedResponse) {
        return cachedResponse;
      }

      // B. 如果缓存未命中，尝试请求网络
      return fetch(event.request).then((networkResponse) => {
        // 检查返回是否有效
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        return networkResponse;
      }).catch(() => {
        /**
         * C. 兜底逻辑：网络断开且缓存无数据
         * 解决 "Return response is null" 报错
         */
        
        // 如果是页面跳转请求（如刷新主页），强制返回缓存中的 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        // 对于其他资源（如 GoatCounter 统计脚本），返回一个空的成功响应或自定义错误
        // 这样浏览器就不会报错 "response is null"
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

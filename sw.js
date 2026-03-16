/**
 * Chinese Clock Calendar - Service Worker
 * 版本：v4.0 (2026-03-17)
 * 优化：解决离线白屏、路径匹配及容错缓存
 */

const CACHE_NAME = 'calendar-cache-v4.0';

// 资源清单：请确保这些文件名在您的 GitHub 仓库中完全正确（注意大小写）
const ASSETS = [
  './',               // 项目根目录
  './index.html',     // 主页面
  './manifest.json',  // PWA 配置
  './icon.png',       // 确认仓库中只有这个 icon.png
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js' // 外部依赖库
];

// 1. 安装阶段 (Install)：预抓取资源并存入 Cache Storage
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 强制跳过等待，让新版本立即接管
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 开始预缓存核心资源');
      
      // 使用 map 逐个添加，防止其中一个请求失败（如 404）导致整个缓存失败
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((error) => {
            console.error(`[Service Worker] 缓存失败的资源: ${url}`, error);
          });
        })
      );
    })
  );
});

// 2. 激活阶段 (Activate)：清理所有旧版本的缓存，节省空间
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[Service Worker] 清理旧缓存: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // 确保 Service Worker 立即控制页面
  return self.clients.claim();
});

// 3. 请求拦截 (Fetch)：【离线优先策略】
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果缓存中存在资源，直接返回（实现秒开，无需等待网络超时）
      if (cachedResponse) {
        return cachedResponse;
      }

      // 如果缓存中没有，尝试从网络获取
      return fetch(event.request).catch(() => {
        // 如果网络请求也失败（完全断网），这里可以打印日志或返回自定义错误
        console.warn(`[Service Worker] 无法获取资源且无缓存: ${event.request.url}`);
      });
    })
  );
});

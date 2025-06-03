
const CACHE_NAME = 'clarityledger-cache-v1.4'; // Increment version for changes
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json', // Cache the manifest
  '/src/index.tsx', // Main application script
  '/src/index.css', // Global CSS file
  '/favicon.ico', // Add favicon
  // Tailwind CSS from CDN
  'https://cdn.tailwindcss.com',
  // Google Fonts CSS
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  // Font Awesome CSS from CDN
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  // JS dependencies from importmap (actual URLs used by browser)
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0',
  'https://esm.sh/recharts@^2.15.3',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js',
  // Locale files
  '/locales/en.json',
  '/locales/zh-TW.json',
  // Icons (referenced in manifest)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png' // For iOS home screen
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching assets for version:', CACHE_NAME);
        const promises = ASSETS_TO_CACHE.map(assetUrl => {
          // Use Request object with cache: 'reload' to ensure fresh assets are fetched for the SW cache
          return cache.add(new Request(assetUrl, { cache: 'reload' })).catch(err => {
            console.warn(`Failed to cache ${assetUrl}:`, err);
          });
        });
        return Promise.all(promises);
      })
      .catch(err => {
        console.error('Failed to open cache during install:', err);
      })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (HTML), try network first, then cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/') || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images, fonts), use cache-first strategy.
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
             const url = new URL(request.url);
             const knownCDNs = [
                'cdn.tailwindcss.com',
                'fonts.googleapis.com',
                'fonts.gstatic.com',
                'cdnjs.cloudflare.com',
                'esm.sh',
                'cdn.jsdelivr.net'
             ];
             // Cache if it's one of the predefined assets or from a known CDN
             const shouldCache = ASSETS_TO_CACHE.includes(url.pathname) ||
                                 ASSETS_TO_CACHE.includes(request.url) || // For full URLs in ASSETS_TO_CACHE
                                 knownCDNs.includes(url.hostname);

            if (shouldCache) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
            }
          }
          return networkResponse;
        }).catch(error => {
            console.warn(`Fetch failed for ${request.url}; resource might be unavailable offline.`, error);
            // Return a synthetic error response to prevent the TypeError
            // and provide a clear indication of a network failure.
            return Response.error(); // This creates a network error Response object
        });
      })
  );
});

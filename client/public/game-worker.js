const self = this;
const MANIFEST_URL = '/assets-manifest.json';
const MANIFEST_FORCE_REFRESH_DEBOUNCE_MS = 1000;
let ASSETS_MANIFEST = null;
let ASSETS_MANIFEST_LOADING = false;
let manifestLoadPromise = null;
let lastManifestForceTrigger = 0;

// Import Dexie - works in service workers
importScripts('https://unpkg.com/dexie@4.0.11/dist/dexie.min.js');

async function loadManifest(reason = 'manual') {
  console.log('loadManifest', reason);
  if (ASSETS_MANIFEST_LOADING && manifestLoadPromise) {
    return manifestLoadPromise;
  }

  ASSETS_MANIFEST_LOADING = true;
  const cacheBuster = Date.now();

  manifestLoadPromise = (async () => {
    try {
      const response = await fetch(`${MANIFEST_URL}?ts=${cacheBuster}`, {
        cache: 'reload',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });

      if (response.ok) {
        ASSETS_MANIFEST = await response.json();
        console.log(`📋 Asset manifest loaded (${reason}): version ${ASSETS_MANIFEST.version}, ${Object.keys(ASSETS_MANIFEST.assets).length} assets`);
      } else {
        console.error('❌ Failed to load asset manifest');
      }
    } catch (error) {
      console.error('❌ Error loading asset manifest:', error);
      throw error;
    } finally {
      ASSETS_MANIFEST_LOADING = false;
      manifestLoadPromise = null;
    }
  })();

  return manifestLoadPromise;
}

//Dexie-based asset cache
class AssetCache extends Dexie {
  constructor() {
    super('PistolsAssetCache');
    
    this.version(1).stores({
      cachedAssets: 'manifestKey, hash, cachedAt, size, path',
      manifestInfo: 'version'
    });
    
    this.cachedAssets = this.table('cachedAssets');
    this.manifestInfo = this.table('manifestInfo');
  }

  async getCachedAsset(manifestKey) {
    try {
      const asset = await this.cachedAssets.get(manifestKey);
      return asset;
    } catch (error) {
      console.error('Error getting cached asset:', error);
      return null;
    }
  }

  async setCachedAsset(asset) {
    try {
      const assetToStore = {
        ...asset,
        cachedAt: Date.now(),
      };
      await this.cachedAssets.put(assetToStore);
      return assetToStore;
    } catch (error) {
      console.error('Error setting cached asset:', error);
      throw error;
    }
  }

  async deleteCachedAsset(manifestKey) {
    try {
      await this.cachedAssets.delete(manifestKey);
    } catch (error) {
      console.error('Error deleting cached asset:', error);
      throw error;
    }
  }
}

const assetCache = new AssetCache();

// Helper functions
function shouldInterceptRequest(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
  // Exclude specific paths that are definitely not assets
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/src/') ||
      pathname.includes('worker.js') ||
      pathname.includes('manifest.json') ||
      pathname.startsWith('/_') ||
      pathname.includes('.html') ||
      pathname.startsWith('/@vite/assets/') ||
      pathname.startsWith('/@fs/')) {
    return false;
  }
  
  return true;
}

function createPathKeyFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let cleanPath = decodeURIComponent(urlObj.pathname);
    
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    
    const key = cleanPath
      .replace(/[^a-zA-Z0-9_/-]/g, '_')
      .split(/[/_-]/)
      .filter(Boolean)
      .map((part, index) => 
        index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join('');
    
    return key;
    
  } catch (error) {
    console.warn(`🚨 Failed to parse URL: ${url}`, error);
    return '';
  }
}

function createResponseFromBlob(blob, contentType) {
  const headers = new Headers();
  
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  
  headers.set('Content-Length', blob.size.toString());
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('X-Served-From', 'pistols-cache');
  
  return new Response(blob, {
    status: 200,
    statusText: 'OK',
    headers
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getManifestReloadReason(request) {
  if (request.mode !== 'navigate') {
    return null;
  }

  if (request.cache === 'reload' || request.cache === 'no-store') {
    return 'browser-reload';
  }

  const cacheControl = (request.headers.get('cache-control') || '').toLowerCase();
  const pragma = (request.headers.get('pragma') || '').toLowerCase();
  const hasNoCacheHeaders = cacheControl.includes('max-age=0') ||
    cacheControl.includes('no-cache') ||
    cacheControl.includes('no-store') ||
    pragma.includes('no-cache');

  return hasNoCacheHeaders ? 'no-cache-navigation' : null;
}

function queueManifestRefresh(reason) {
  const now = Date.now();
  if (now - lastManifestForceTrigger < MANIFEST_FORCE_REFRESH_DEBOUNCE_MS) {
    return manifestLoadPromise || Promise.resolve();
  }

  lastManifestForceTrigger = now;
  return loadManifest(reason);
}

// Event handlers
self.addEventListener('install', (event) => {
  console.log('🐙 Pistols Assets Service Worker installing...');
  event.waitUntil(loadManifest().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  console.log('🐙 Pistols Assets Service Worker activated!');
  event.waitUntil(
    (async () => {
      // FIRST: Load manifest if not already loaded
      if (!ASSETS_MANIFEST && !ASSETS_MANIFEST_LOADING) {
        console.log('📋 Loading manifest during activation...');
        await loadManifest();
      }
      // Wait for manifest loading to finish if in progress
      while (ASSETS_MANIFEST_LOADING) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      // THEN: Claim clients only after manifest is ready
      console.log('🎯 Manifest ready, claiming clients...');
      await self.clients.claim();
      console.log('✅ Service worker fully ready with manifest!');
    })()
  );
});

// Notification click handler (merged from notification-worker.js)
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.data)
  event.notification.close()

  const duelIds = event.notification.data?.duelIds

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        const client = clientList[0]
        client.focus()

        // ✅ Send duelId to app
        client.postMessage({
          type: 'DUEL_NOTIFICATION_CLICK',
          duelIds
        })

        return
      }

      // No tab? Open fresh one
      if (clients.openWindow) {
        return clients.openWindow(`/tavern?duel=${duelIds}`)
      }
    })
  )
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  const reloadReason = getManifestReloadReason(request);
  if (reloadReason) {
    event.waitUntil(queueManifestRefresh(reloadReason));
  }
  
  if (request.method !== 'GET' || !shouldInterceptRequest(url)) {
    return;
  }
  
  event.respondWith(handleAssetFetch(request));
});

// Message handling - provide manifest data and operations to main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'CHECK_MANIFEST_READY':
        event.ports[0]?.postMessage({ 
          ready: !!ASSETS_MANIFEST,
          loading: ASSETS_MANIFEST_LOADING
        });
        break;
        
      case 'GET_MANIFEST':
        if (ASSETS_MANIFEST) {
          event.ports[0]?.postMessage({ 
            success: true, 
            data: ASSETS_MANIFEST 
          });
        } else {
          event.ports[0]?.postMessage({ 
            success: false, 
            loading: ASSETS_MANIFEST_LOADING,
            error: ASSETS_MANIFEST_LOADING ? 'Manifest still loading...' : 'Manifest failed to load' 
          });
        }
        break;
        
      default:
        console.log('🤔 Unknown message type:', type);
        event.ports[0]?.postMessage({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('❌ Service worker message error:', error);
    event.ports[0]?.postMessage({ success: false, error: error.message });
  }
});

async function handleAssetFetch(request) {
  const url = request.url;
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  try {
    // Try to load manifest if it's not loaded yet (fallback)
    if (!ASSETS_MANIFEST && !ASSETS_MANIFEST_LOADING) {
      console.warn('⚠️ Asset manifest not loaded yet, loading now...');
      await loadManifest();
    }
    
    // If still not loaded after attempt, proceed with normal fetch
    if (!ASSETS_MANIFEST) {
      console.warn('⚠️ Asset manifest failed to load, proceeding with normal fetch for:', pathname);
      return fetch(request);
    }

    const pathKey = createPathKeyFromUrl(url);
    const manifestAsset = ASSETS_MANIFEST.assets[pathKey];
    
    if (manifestAsset) {
      return await handleManagedAsset(request, pathname, manifestAsset, pathKey);
    } else {
      return await handleUnmanagedAsset(request, pathname, pathKey);
    }
    
  } catch (error) {
    console.error('❌ Asset fetch error:', error);
    return fetch(request);
  }
}

async function handleManagedAsset(request, pathname, manifestAsset, manifestKey) {
  const cachedAsset = await assetCache.getCachedAsset(manifestKey);
  
  if (cachedAsset) {
    if (cachedAsset.hash === manifestAsset.hash) {
      return createResponseFromBlob(cachedAsset.blob, cachedAsset.contentType);
    } else {
      await assetCache.deleteCachedAsset(manifestKey);
    }
  }
  
  const response = await fetch(request);
  
  if (!response.ok) {
    return response;
  }
  
  const responseClone = response.clone();
  const blob = await responseClone.blob();
  
  const newCachedAsset = {
    manifestKey: manifestKey,
    path: pathname,
    hash: manifestAsset.hash,
    blob: blob,
    size: blob.size,
    mtime: manifestAsset.mtime,
    contentType: response.headers.get('content-type') || 'application/octet-stream'
  };
  
  await assetCache.setCachedAsset(newCachedAsset);
  console.log(`💾 Cached asset: ${pathname} -> ${manifestKey} (${formatBytes(blob.size)})`);
  
  return response;
}

async function handleUnmanagedAsset(request, pathKey) {
  const cachedAsset = await assetCache.getCachedAsset(pathKey);
  if (cachedAsset) {
    await assetCache.deleteCachedAsset(pathKey);
  }
  
  return fetch(request);
}

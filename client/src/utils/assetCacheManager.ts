import Dexie from 'dexie';
import { SceneName, GroupName } from '/src/data/assetsTypes';
import { SCENE_PRIORITIES, TEXTURES, SPRITESHEETS } from '/src/data/assets';

export interface AssetManifest {
  version: string;
  generatedAt: number;
  assets: Record<string, {
    path: string;
    hash: string;
    size: number;
    mtime: number;
  }>;
}

export interface CacheStats {
  totalAssets: number;
  totalSize: number;
}

export interface AssetLoadProgress {
  loadedAssets: number;
  totalAssets: number;
  currentSizeMB: number;
  totalSizeMB: number;
  currentAsset?: string;
  percentage: number;
}

export interface AssetLoadResult {
  success: boolean;
  cached: number;
  downloaded: number;
  failed: number;
  totalSizeMB: number;
}

class PistolsAssetCache extends Dexie {
  cachedAssets!: Dexie.Table<{
    manifestKey: string;
    path: string;
    hash: string;
    cachedAt: number;
    size: number;
    blob: Blob;
    mtime: number;
    contentType: string;
  }, string>;
  
  manifestInfo!: Dexie.Table<{
    version: string;
  }, string>;

  constructor() {
    super('PistolsAssetCache');
    
    this.version(1).stores({
      cachedAssets: 'manifestKey, hash, cachedAt, size, path',
      manifestInfo: 'version'
    });
  }
}

export class AssetCacheManager {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private db: PistolsAssetCache;
  private manifest: AssetManifest | null = null;
  private manifestKeyMap: Record<string, string> = {};

  constructor() {
    this.db = new PistolsAssetCache();
  }

  // =====================================
  // DATA API - For useAssetSetup.tsx
  // =====================================

  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Initialize service worker
      await this.initializeServiceWorker();
      
      // Load manifest
      await this.loadManifest();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async loadSceneAssets(
    scene?: SceneName,
    excludeGroups?: GroupName[],
    onProgress?: (progress: AssetLoadProgress) => void
  ): Promise<AssetLoadResult> {
    const groups = scene ? this.getAssetGroupsForScene(scene) : Object.values(GroupName).filter(g => typeof g === 'number') as GroupName[];
    const finalGroups = excludeGroups ? groups.filter(g => !excludeGroups.includes(g)) : groups;
    
    const assetPaths = this.getAssetsForGroups(finalGroups);
    
    return this.loadAssets(assetPaths, onProgress);
  }

  async clearCache(): Promise<boolean> {
    try {
      await this.db.cachedAssets.clear();
      await this.db.manifestInfo.clear();
      console.log('🧹 Asset cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      return false;
    }
  }

  async checkAssetsCache(assetPaths: string[]): Promise<Record<string, { cached: boolean; valid: boolean; size: number }>> {
    try {
      const cacheStatus: Record<string, { cached: boolean; valid: boolean; size: number }> = {};
      
      for (const assetPath of assetPaths) {
        const manifestKey = this.createPathKeyFromUrl(assetPath);
        const cachedAsset = await this.db.cachedAssets.get(manifestKey);
        
        if (cachedAsset && this.manifest) {
          const manifestAsset = this.manifest.assets[manifestKey];
          const isValid = manifestAsset && cachedAsset.hash === manifestAsset.hash;
          cacheStatus[assetPath] = {
            cached: true,
            valid: isValid,
            size: cachedAsset.size || 0
          };
        } else {
          cacheStatus[assetPath] = {
            cached: false,
            valid: false,
            size: 0
          };
        }
      }
      
      return cacheStatus;
    } catch (error) {
      console.error('❌ Failed to check assets cache:', error);
      return {};
    }
  }

  isServiceWorkerActive(): boolean {
    return !!this.serviceWorkerRegistration?.active;
  }

  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  getAssetGroupsForScene(scene: SceneName): GroupName[] {
    const priorityGroups = SCENE_PRIORITIES[scene] || [];
    const allGroups = [GroupName.General, ...priorityGroups];
    
    allGroups.push(GroupName.Animations);
    
    return Array.from(new Set(allGroups));
  }

  // =====================================
  // PRIVATE FUNCTIONS IMPLEMENTATION
  // =====================================

  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported in this browser');
    }
    
    try {
      // Get the specific registration for our service worker (should already be registered by main.tsx)
      const registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        throw new Error('No service worker registration found');
      }
      
      if (registration.waiting) {
        await new Promise<void>((resolve) => {
          const checkActive = () => {
            if (registration.active?.scriptURL.includes('game-worker.js')) {
              resolve();
            } else {
              setTimeout(checkActive, 100);
            }
          };
          checkActive();
        });
      }
      
      console.log('✅ AssetCacheManager: game-worker.js is active and ready');
      this.serviceWorkerRegistration = registration;
    } catch (error) {
      console.warn('⚠️ Service worker failed, using direct mode:', error);
      this.serviceWorkerRegistration = { active: null } as any;
    }
  }

  private async loadManifest(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration?.active) {
        return;
      }

      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        try {
          const manifest = await this.sendMessageToServiceWorker('GET_MANIFEST', null, 2000);
          
          if (manifest.success) {
            this.manifest = manifest.data;
            break;
          } else if (manifest.loading) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            continue;
          } else {
            this.manifest = null;
            break;
          }
        } catch (error) {
          console.warn(`❌ Service worker message failed (attempt ${attempts + 1}):`, error);
          attempts++;
          if (attempts >= maxAttempts) {
            console.warn('❌ Max attempts reached, using fallback manifest');
            this.manifest = { version: 'fallback', generatedAt: Date.now(), assets: {} };
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
    } catch (error) {
      this.manifest = { version: 'fallback', generatedAt: Date.now(), assets: {} };
    }
  }

  private async sendMessageToServiceWorker(type: string, data: any, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.serviceWorkerRegistration?.active) {
        reject(new Error('Service worker not active'));
        return;
      }

      const messageChannel = new MessageChannel();
      const timeout = setTimeout(() => {
        reject(new Error(`Service worker message timeout: ${type}`));
      }, timeoutMs);

      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      this.serviceWorkerRegistration.active.postMessage(
        { type, data },
        [messageChannel.port2]
      );
    });
  }

  private getAssetsForGroups(groups: GroupName[]): string[] {
    const assets: string[] = [];
    const assetSet = new Set<string>();

    // Add regular assets from TEXTURES
    for (const [key, attributes] of Object.entries(TEXTURES)) {
      if (attributes.groups.some(group => groups.includes(group))) {
        if (!assetSet.has(attributes.path)) {
          assets.push(attributes.path);
          assetSet.add(attributes.path);
        }
      }
    }

    // Add animation frames if Animations group is requested
    if (groups.includes(GroupName.Animations)) {
      Object.entries(SPRITESHEETS).forEach(([characterType, animations]) => {
        Object.entries(animations).forEach(([animName, animData]) => {
          if (animData.path && animData.frameCount && animData.frameCount > 0) {
            for (let frame = 1; frame <= animData.frameCount; frame++) {
              const frameNumber = ('000' + frame.toString()).slice(-3);
              const framePath = `${animData.path}/frame_${frameNumber}.ktx2`;
              if (!assetSet.has(framePath)) {
                assets.push(framePath);
                assetSet.add(framePath);
              }
            }
          }
        });
      });
    }

    return [...new Set(assets)];
  }

  private async loadAssets(
    assetPaths: string[], 
    onProgress?: (progress: AssetLoadProgress) => void
  ): Promise<AssetLoadResult> {
    let loadedAssets = 0;
    let loadedSize = 0;
    let cached = 0;
    let downloaded = 0;
    let failed = 0;
    let totalSize = 0;

    const cacheStatus = await this.checkAssetsCache(assetPaths);
    
    for (const path of assetPaths) {
      const manifestKey = this.createPathKeyFromUrl(path);
      const assetSize = this.manifest?.assets[manifestKey]?.size || 0;
      totalSize += assetSize;

      if (cacheStatus[path]?.cached && cacheStatus[path]?.valid) {
        cached++;
        loadedAssets++;
        loadedSize += assetSize;
      }
    }

    const totalSizeMB = totalSize / (1024 * 1024);

    // Initial progress for cached assets
    onProgress?.({
      loadedAssets,
      totalAssets: assetPaths.length,
      currentSizeMB: loadedSize / (1024 * 1024),
      totalSizeMB,
      percentage: (loadedAssets / assetPaths.length) * 100
    });

    // Load uncached assets
    const uncachedAssets = assetPaths.filter(path => !cacheStatus[path]?.cached || !cacheStatus[path]?.valid);
    
    for (const assetPath of uncachedAssets) {
      try {
        const response = await this.withTimeout(
          fetch(assetPath),
          10000,
          { ok: false, headers: { get: () => '0' } } as any,
          `Asset ${assetPath}`
        );
        
        if (response.ok) {
          const contentLength = parseInt(response.headers.get('content-length') || '0');
          const manifestKey = this.createPathKeyFromUrl(assetPath);
          const assetSize = this.manifest?.assets[manifestKey]?.size || contentLength || 0;
          
          downloaded++;
          loadedAssets++;
          loadedSize += assetSize;
          
          onProgress?.({
            loadedAssets,
            totalAssets: assetPaths.length,
            currentSizeMB: loadedSize / (1024 * 1024),
            totalSizeMB,
            currentAsset: assetPath,
            percentage: (loadedAssets / assetPaths.length) * 100
          });
        } else {
          failed++;
          loadedAssets++;
        }
      } catch (error) {
        failed++;
        loadedAssets++;
        console.warn(`❌ Failed to load asset: ${assetPath}`, error);
      }
    }

    return {
      success: failed < assetPaths.length * 0.5, // Success if < 50% failed
      cached,
      downloaded,
      failed,
      totalSizeMB: totalSize / (1024 * 1024)
    };
  }

  private createPathKeyFromUrl(url: string): string {
    try {
      if (this.manifestKeyMap[url]) {
        return this.manifestKeyMap[url];
      }

      let cleanPath: string;
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        cleanPath = decodeURIComponent(urlObj.pathname);
      } else {
        cleanPath = decodeURIComponent(url);
      }
      
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

      this.manifestKeyMap[url] = key;
      
      return key;
    } catch (error) {
      console.warn(`🚨 Failed to parse URL: ${url}`, error);
      return '';
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    fallback: T, 
    operation: string = 'operation'
  ): Promise<T> {
    return new Promise(async (resolve) => {
      try {
        const result = await Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
        resolve(result);
      } catch (error) {
        console.warn(`⚠️ ${operation} timed out or failed, using fallback:`, error);
        resolve(fallback);
      }
    });
  }
}

export const assetCacheManager = new AssetCacheManager(); 
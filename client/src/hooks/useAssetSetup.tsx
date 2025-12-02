import { useEffect, useState, useRef } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useStoreLoadingProgress } from '/src/stores/progressStore'
import { 
  assetCacheManager, 
  AssetManifest, 
  AssetLoadProgress 
} from '/src/utils/assetCacheManager'
import { usePistolsContext } from './PistolsContext'

export interface AssetProgress {
  percentage: number;
  loadedAssets: number;
  totalAssets: number;
  currentSizeMB: number;
  totalSizeMB: number;
  currentAsset?: string;
}

export interface AssetSetupResult {
  manifest: AssetManifest | null;
  sceneAssetsLoaded: boolean;
  progress: AssetProgress;
  status: {
    isReady: boolean;
    isLoading: boolean;
    isError: boolean;
    errorMessage: string | null;
  };
}

export type AssetSetupStatus = ReturnType<typeof useAssetSetup>

export function useAssetSetup() {
  const mounted = useMounted()
  const { currentScene } = usePistolsContext()
  const dataLoadingState = useStoreLoadingProgress()
  
  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [sceneAssetsLoaded, setSceneAssetsLoaded] = useState(false)
  const [assetsProgress, setAssetsProgress] = useState(0) // 0-100
  const hasLoadedAssetsOnce = useRef(false) // Track if assets have been loaded once per session
  
  const [progress, setProgress] = useState<AssetProgress>({
    percentage: 0,
    loadedAssets: 0,
    totalAssets: 0,
    currentSizeMB: 0,
    totalSizeMB: 0,
  })
  
  const [status, setStatus] = useState({
    isReady: false,
    isLoading: true,
    isError: false,
    errorMessage: null as string | null,
  })

  // Calculate combined progress (70% assets, 30% data)
  useEffect(() => {
    const assetProgressContribution = assetsProgress * 0.7
    const dataProgressContribution = dataLoadingState.progress * 100 * 0.3;
    const combinedProgress = assetProgressContribution + dataProgressContribution
    
    // Mark as ready when both complete
    const isComplete = assetsProgress >= 100 && dataLoadingState.finished
    
    setProgress(prev => ({
      ...prev,
      percentage: isComplete ? 100 : combinedProgress,
    }))
    
    if (isComplete) {
      setStatus(prev => ({ 
        ...prev, 
        isReady: true, 
        isLoading: false 
      }))
    }
  }, [assetsProgress, dataLoadingState.progress, dataLoadingState.finished, dataLoadingState.counter])

  // Emergency timeout - force completion if stuck
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!status.isReady && assetsProgress < 50) {
        console.warn('🚨 Emergency recovery: Loading stuck, forcing completion!')
        setAssetsProgress(100)
      }
    }, 30_000);
    
    return () => clearTimeout(emergencyTimeout)
  }, [status.isReady, assetsProgress])

  // Timeout for data loading phase
  useEffect(() => {
    if (assetsProgress < 100) return
    
    const dataTimeout = setTimeout(() => {
      if (!dataLoadingState.finished) {
        console.warn('⚠️ Data loading timeout, forcing completion...')
        setStatus(prev => ({ 
          ...prev, 
          isReady: true, 
          isLoading: false 
        }))
      }
    }, 20_000)
    
    return () => clearTimeout(dataTimeout)
  }, [assetsProgress, dataLoadingState.finished])

  // Step 1: Initialize AssetCacheManager
  useEffect(() => {
    if (!mounted) return
    
    let cancelled = false
    
    const initialize = async () => {
      try {
        const result = await assetCacheManager.initialize()
        
        if (!result.success) {
          throw new Error(result.error || 'AssetCacheManager initialization failed')
        }
        
        console.log('🔄 AssetCacheManager initialized successfully', result, cancelled)
        if (!cancelled) {
          setIsInitialized(true)
          console.log('✅ AssetCacheManager initialized successfully')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ AssetCacheManager initialization failed:', error)
          setStatus(prev => ({
            ...prev,
            isError: true,
            errorMessage: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }))
        }
      }
    }
    
    initialize()
    return () => { cancelled = true }
  }, [mounted])

  // Step 2: Load scene assets using AssetCacheManager
  useEffect(() => {
    if (!mounted || !isInitialized || hasLoadedAssetsOnce.current) return
    
    let cancelled = false
    
    const loadSceneAssets = async () => {
      try {
        const result = await assetCacheManager.loadSceneAssets(
          currentScene, 
          [],
          (progress: AssetLoadProgress) => {
            if (!cancelled) {
              setAssetsProgress(progress.percentage)
              setProgress(prev => ({
                ...prev,
                loadedAssets: progress.loadedAssets,
                totalAssets: progress.totalAssets,
                currentSizeMB: progress.currentSizeMB,
                totalSizeMB: progress.totalSizeMB,
                currentAsset: progress.currentAsset,
              }))
            }
          }
        )
        
        if (!cancelled) {
          hasLoadedAssetsOnce.current = true
          setSceneAssetsLoaded(true)
          setAssetsProgress(100)
          setProgress(prev => ({ ...prev, currentAsset: undefined }))
          console.log(`🎮 Scene assets loaded: ${result.cached} cached, ${result.downloaded} downloaded, ${result.failed} failed (${result.totalSizeMB.toFixed(2)} MB)`)
        }
      } catch (error) {
        if (!cancelled) {
          hasLoadedAssetsOnce.current = true
          console.error('❌ Scene assets loading failed:', error)
          // Don't fail completely, mark as complete
          setSceneAssetsLoaded(true)
          setAssetsProgress(100)
        }
      }
    }
    
    loadSceneAssets()
    return () => { cancelled = true }
  }, [mounted, isInitialized, currentScene])

  // Step 3: Background loading of remaining assets
  useEffect(() => {
    if (!mounted || !isInitialized || !sceneAssetsLoaded) return
    
    let cancelled = false
    
    const loadBackgroundAssets = async () => {
      try {
        console.log('🔄 Starting background asset loading...')
        
        const sceneGroups = assetCacheManager.getAssetGroupsForScene(currentScene)
        const result = await assetCacheManager.loadSceneAssets(
          undefined,
          sceneGroups,
          (progress: AssetLoadProgress) => {
            if (!cancelled) {
              console.log(`🔄 Background: ${progress.currentAsset} (${progress.loadedAssets}/${progress.totalAssets})`)
            }
          }
        )
        
        if (!cancelled) {
          console.log(`🔄 Background loading complete: ${result.cached} cached, ${result.downloaded} downloaded, ${result.failed} failed`)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ Background loading error (non-critical):', error)
        }
      }
    }
    
    loadBackgroundAssets()
    return () => { cancelled = true }
  }, [mounted, isInitialized, sceneAssetsLoaded])

  return {
    manifest: assetCacheManager.getManifest(),
    serviceWorkerRegistration: assetCacheManager.isServiceWorkerActive() ? {} as ServiceWorkerRegistration : null,
    sceneAssetsLoaded,
    progress,
    status,
  }
}

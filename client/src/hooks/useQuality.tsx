import { useMemo } from 'react'
import { useSettings } from './SettingsContext'
import { PCFShadowMap, PCFSoftShadowMap, BasicShadowMap, ShadowMapType } from 'three'

// Quality presets
export enum QualityPreset {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

// Define the quality configuration type
export interface QualityConfig {
  // Renderer settings
  shadowMapEnabled: boolean
  shadowMapType: ShadowMapType
  shadowMapSize: number
  
  // Resolution settings
  resolutionScale: number
  
  // Grass settings
  grassCount: number
  grassSegments: number
  
  // Water settings
  reflectionsEnabled: boolean
  reflectionQuality: number
  waterEffects: boolean
  
  // Particle settings
  particlesMultiplier: number


  //InteractibleScene settings
  sceneShiftEnabled: boolean
  blurEnabled: boolean
  
  // Post-processing
  postProcessingEnabled: boolean
}

// Define quality configurations for each preset
const qualityConfigs: Record<QualityPreset, QualityConfig> = {
  [QualityPreset.Low]: {
    // Renderer
    shadowMapEnabled: false,
    shadowMapType: PCFShadowMap,
    shadowMapSize: 1024,
    
    // Resolution
    resolutionScale: 0.5,
    
    // Grass
    grassCount: 6 * 5, // Reduced by 50%
    grassSegments: 4,
    
    // Water
    reflectionsEnabled: false,
    reflectionQuality: 0.5,
    waterEffects: false,
    
    // Particles
    particlesMultiplier: 0.5,

    // Scene
    sceneShiftEnabled: false,
    blurEnabled: false,

    // Post-processing
    postProcessingEnabled: false
  },
  
  [QualityPreset.Medium]: {
    // Renderer
    shadowMapEnabled: true,
    shadowMapType: PCFSoftShadowMap,
    shadowMapSize: 2048,
    
    // Resolution
    resolutionScale: 1.0,
    
    // Grass
    grassCount: 24 * 5, // 75% of high
    grassSegments: 5,
    
    // Water
    reflectionsEnabled: true,
    reflectionQuality: 0.7,
    waterEffects: true,
    
    // Particles
    particlesMultiplier: 0.8,

    // Scene
    sceneShiftEnabled: true,
    blurEnabled: false,

    // Post-processing
    postProcessingEnabled: false
  },
  
  [QualityPreset.High]: {
    // Renderer
    shadowMapEnabled: true,
    shadowMapType: PCFSoftShadowMap,
    shadowMapSize: 8192,
    
    // Resolution
    resolutionScale: 1.0,
    
    // Grass
    grassCount: 32 * 5, // Full
    grassSegments: 6,
    
    // Water
    reflectionsEnabled: true,
    reflectionQuality: 1.0,
    waterEffects: true,
    
    // Particles
    particlesMultiplier: 1.0,

    // Scene
    sceneShiftEnabled: true,
    blurEnabled: true,

    // Post-processing
    postProcessingEnabled: true
  }
}

/**
 * Hook to manage quality settings
 */
export const useQuality = () => {
  const { settings } = useSettings()
  
  // Convert string quality setting to enum
  const currentQualityPreset = useMemo(() => {
    return (settings.quality as QualityPreset) || QualityPreset.High
  }, [settings.quality])
  
  // Get the current quality configuration based on preset
  const qualityConfig = useMemo(() => {
    return qualityConfigs[currentQualityPreset] || qualityConfigs[QualityPreset.High]
  }, [currentQualityPreset])
  
  return {
    currentQualityPreset,
    qualityConfig,
    
    // Export these for ease of use
    QualityPreset
  }
}

// Helper function to get description of quality presets
export const getQualityDescription = (qualityPreset: string): string => {
  switch (qualityPreset) {
    case QualityPreset.Low:
      return 'Low: Better performance, simplified graphics'
    case QualityPreset.Medium:
      return 'Medium: Balanced performance and visual quality'
    case QualityPreset.High:
      return 'High: Best visual quality, may affect performance'
    default:
      return 'Unknown quality preset'
  }
} 
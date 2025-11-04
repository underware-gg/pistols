import React, { ReactNode, useMemo, useEffect, useState } from 'react'
import { useAssetSetup } from '/src/hooks/useAssetSetup'
import { DojoStatus } from '@underware/pistols-sdk/dojo'
import StoreSync from '/src/stores/sync/StoreSync'

interface AssetSetupWrapperProps {
  children: ReactNode
}

// Helper to update CSS variables
function updateLoadingVars(progress: number, message: string, mbData: string) {
  document.documentElement.style.setProperty('--loading-progress', `${progress}%`)
  document.documentElement.style.setProperty('--loading-message', `"${message}"`)
  document.documentElement.style.setProperty('--loading-mb-data', `"${mbData}"`)
}

const loadingMessages = [
  "Loading the saloon doors...",
  "Polishing pistols and preparing cards...",
  "Setting up the dueling grounds...",
  "Gathering the town folk...",
  "Preparing the tavern atmosphere...",
  "Loading ammunition and honor...",
  "Collecting bounty information...",
  "Reading wanted posters...",
  "Gathering duel records...",
  "Loading sheriff reports...",
  "Syncing with the frontier database...",
  "Preparing challenger data...",
]

export default function AssetSetupWrapper({ children }: AssetSetupWrapperProps) {
  const assetSetup = useAssetSetup()
  const [allowGameRender, setAllowGameRender] = useState(false)

  const progressBucket = Math.floor(assetSetup.progress.percentage / 20);

  const loadingMessage = useMemo(() => {
    return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  }, [progressBucket])
  
  const detailsText = useMemo(() => {
    if (assetSetup.progress.currentSizeMB !== undefined && assetSetup.progress.totalSizeMB !== undefined) {
      return `(${assetSetup.progress.currentSizeMB.toFixed(1)}/${assetSetup.progress.totalSizeMB.toFixed(1)}MB)`
    }
    return ''
  }, [assetSetup.progress.currentSizeMB, assetSetup.progress.totalSizeMB])

  useEffect(() => {
    if (!assetSetup.status.isReady || assetSetup.status.isLoading) {
      updateLoadingVars(Math.round(assetSetup.progress.percentage), loadingMessage, detailsText)
    } else {
      updateLoadingVars(100, 'Ready! Loading game...', '')
    }
  }, [assetSetup.progress.percentage, loadingMessage, detailsText, assetSetup.status.isReady, assetSetup.status.isLoading])  
  
  // Dispatch loading-complete event after 400ms when ready
  useEffect(() => {
    if (assetSetup.status.isReady && !assetSetup.status.isLoading) {
      // First: wait for CSS transition, then hide screen
      setTimeout(() => {
        setAllowGameRender(true);
      }, 300);

      const hideTimer = setTimeout(() => {
        window.dispatchEvent(new Event('loading-complete'))
      }, 700)
      
      return () => clearTimeout(hideTimer)
    }
  }, [assetSetup.status.isReady, assetSetup.status.isLoading])

  // Asset loading error
  if (assetSetup.status.isError) {
    return (
      <div className="asset-setup-wrapper error-screen">
        <DojoStatus message={assetSetup.status.errorMessage || 'The saloon doors are jammed! Try again, partner.'} />
      </div>
    )
  }

  // Don't render game until loading complete AND screen is hidden
  if (!assetSetup.status.isReady || assetSetup.status.isLoading || !allowGameRender) {
    return (
      <>
        {/* Data loading component - runs during loading (except at gate) */}
        <StoreSync />
      </>
    )
  }

  // Loading screen hidden - now render heavy game components
  return (
    <>
      <StoreSync />
      {children}
    </>
  )
} 
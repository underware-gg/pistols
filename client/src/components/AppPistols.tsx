import React, { useMemo } from 'react'
import { ThreeJsProvider } from '@/hooks/ThreeJsContext'
import { GameplayProvider } from '@/hooks/GameplayContext'
import App, { AppProps } from '@/components/App'

export default function AppPistols({
  backgroundImage = null,
  children,
}: AppProps) {
  return (
    <App backgroundImage={backgroundImage}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
        </GameplayProvider>
      </ThreeJsProvider>
    </App>
  )
}

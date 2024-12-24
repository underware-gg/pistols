import React, { useMemo } from 'react'
import { ThreeJsProvider } from '/src/hooks/ThreeJsContext'
import { GameplayProvider } from '/src/hooks/GameplayContext'
import App, { AppProps } from '/src/components/App'

export default function AppGame({
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

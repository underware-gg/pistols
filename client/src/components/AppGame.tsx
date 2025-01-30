import React from 'react'
import { ThreeJsProvider } from '/src/hooks/ThreeJsContext'
import { GameplayProvider } from '/src/hooks/GameplayContext'
import AppDojo, { AppDojoProps } from '/src/components/AppDojo'

export default function AppGame({
  backgroundImage,
  networkId,
  autoConnect,
  children,
}: AppDojoProps) {
  return (
    <AppDojo networkId={networkId} backgroundImage={backgroundImage} autoConnect={autoConnect}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
        </GameplayProvider>
      </ThreeJsProvider>
    </AppDojo>
  )
}

import React from 'react'
import { ThreeJsProvider } from '/src/hooks/ThreeJsContext'
import { GameplayProvider } from '/src/hooks/GameplayContext'
import AppDojo, { AppDojoProps } from '/src/components/AppDojo'

export default function AppGame({
  backgroundImage,
  chainId,
  children,
}: AppDojoProps) {
  return (
    <AppDojo chainId={chainId} backgroundImage={backgroundImage}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
        </GameplayProvider>
      </ThreeJsProvider>
    </AppDojo>
  )
}

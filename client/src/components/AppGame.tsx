import React from 'react'
import { ThreeJsProvider } from '/src/hooks/ThreeJsContext'
import { GameplayProvider } from '/src/hooks/GameplayContext'
import AppDojo, { AppDojoProps } from '/src/components/AppDojo'

export default function AppGame({
  title,
  subtitle,
  backgroundImage,
  networkId,
  autoConnect,
  children,
}: AppDojoProps) {
  return (
    <AppDojo title={title} subtitle={subtitle} networkId={networkId} backgroundImage={backgroundImage} autoConnect={autoConnect}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
        </GameplayProvider>
      </ThreeJsProvider>
    </AppDojo>
  )
}

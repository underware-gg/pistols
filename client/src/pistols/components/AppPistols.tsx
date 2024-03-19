import React from 'react'
import { ThreeJsProvider } from '@/pistols/hooks/ThreeJsContext'
import { GameplayProvider } from '@/pistols/hooks/GameplayContext'
import ErrorModal from '@/pistols/components/ErrorModal'
import AppDojo from '@/lib/dojo/AppDojo'

export default function AppPistols({
  title = null,
  backgroundImage = null,
  children,
}) {
  const headerData = {
    title: title ?? 'Pistols at 10 Blocks',
  }
  return (
    <AppDojo headerData={headerData} backgroundImage={backgroundImage}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
          <ErrorModal />
        </GameplayProvider>
      </ThreeJsProvider>
    </AppDojo>
  )
}

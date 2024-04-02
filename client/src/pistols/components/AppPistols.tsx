import React from 'react'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
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
    <AppDojo headerData={headerData} backgroundImage={backgroundImage}
      chains={[CHAIN_ID.LOCAL_KATANA, CHAIN_ID.PISTOLS_SLOT, CHAIN_ID.DOJO_REALMS_WORLD]}
    >
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
          <ErrorModal />
        </GameplayProvider>
      </ThreeJsProvider>
    </AppDojo>
  )
}

import React from 'react'
import { ThreeJsProvider } from '@/pistols/hooks/ThreeJsContext'
import { GameplayProvider } from '@/pistols/hooks/GameplayContext'
import { makeDojoAppConfig } from '@/games/pistols/config'
import { HeaderData } from '@/lib/ui/AppHeader'
import App, { AppProps } from '@/lib/ui/App'
import ErrorModal from '@/pistols/components/ErrorModal'
import Dojo from '@/lib/dojo/Dojo'

export default function AppPistols({
  headerData = null,
  backgroundImage = null,
  children,
}: AppProps) {
  const _headerData: HeaderData = {
    title: 'Pistols at 10 Blocks',
    ...headerData,
  }
  
  return (
    <App headerData={_headerData} backgroundImage={backgroundImage}>
      <ThreeJsProvider>
        <GameplayProvider>
          <Dojo dojoAppConfig={makeDojoAppConfig()}>
            {children}
            <ErrorModal />
          </Dojo>
        </GameplayProvider>
      </ThreeJsProvider>
    </App>
  )
}

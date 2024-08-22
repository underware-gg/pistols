import React, { useMemo } from 'react'
import { ThreeJsProvider } from '@/pistols/hooks/ThreeJsContext'
import { GameplayProvider } from '@/pistols/hooks/GameplayContext'
import { HeaderData } from '@/lib/ui/AppHeader'
import App, { AppProps } from '@/lib/ui/App'

export default function AppPistols({
  headerData = null,
  backgroundImage = null,
  children,
}: AppProps) {
  const _headerData: HeaderData = useMemo(() => ({
    title: 'Pistols at 10 Blocks',
    ...headerData,
  }), [headerData])
  return (
    <App headerData={_headerData} backgroundImage={backgroundImage}>
      <ThreeJsProvider>
        <GameplayProvider>
          {children}
        </GameplayProvider>
      </ThreeJsProvider>
    </App>
  )
}

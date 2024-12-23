import React, { useMemo } from 'react'
import { ThreeJsProvider } from '@/hooks/ThreeJsContext'
import { GameplayProvider } from '@/hooks/GameplayContext'
import { HeaderData } from '@/components/AppHeader'
import App, { AppProps } from '@/components/App'

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

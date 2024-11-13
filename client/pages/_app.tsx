import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import '/styles/cards.scss'
import React, { useMemo } from 'react'
import { SettingsProvider } from '@/pistols/hooks/SettingsContext'
import { PistolsProvider } from '@/pistols/hooks/PistolsContext'
// import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
// import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import { makeDojoAppConfig } from '@/games/pistols/config'
import ErrorModal from '@/pistols/components/modals/ErrorModal'
import Dojo from '@/lib/dojo/Dojo'

function _app({ Component, pageProps }) {
  const dojoAppConfig = useMemo(() => makeDojoAppConfig(), [])
  return (
    <SettingsProvider>
      <PistolsProvider>
        <Dojo dojoAppConfig={dojoAppConfig}>
          <Component {...pageProps} />
          <Modals />
        </Dojo>
      </PistolsProvider>
    </SettingsProvider>
  )
}

function Modals() {
  // const { connectOpener } = usePistolsContext()
  return (
    <>
      <ErrorModal />
      {/* <StarknetConnectModal opener={connectOpener} /> */}
    </>
  )
}

export default _app

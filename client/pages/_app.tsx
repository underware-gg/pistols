import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import React from 'react'
import { SettingsProvider } from '@/pistols/hooks/SettingsContext'
import { PistolsProvider } from '@/pistols/hooks/PistolsContext'
// import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
// import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import { makeDojoAppConfig } from '@/games/pistols/config'
import ErrorModal from '@/pistols/components/ErrorModal'
import Dojo from '@/lib/dojo/Dojo'

function _app({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <PistolsProvider>
        <Dojo dojoAppConfig={makeDojoAppConfig()}>
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

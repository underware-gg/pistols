import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import '/styles/cards.scss'
import React, { useMemo } from 'react'
import { SettingsProvider } from '@/pistols/hooks/SettingsContext'
import { PistolsProvider } from '@/pistols/hooks/PistolsContext'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import { Dojo } from '@underware_gg/pistols-sdk/dojo'
import ErrorModal from '@/pistols/components/modals/ErrorModal'

function _app({ Component, pageProps }) {
  const dojoAppConfig = useMemo(() => makeDojoAppConfig(), [])
  return (
    <SettingsProvider>
      <PistolsProvider>
        <Dojo dojoAppConfig={dojoAppConfig}>
          <Component {...pageProps} />
          <ErrorModal />
        </Dojo>
      </PistolsProvider>
    </SettingsProvider>
  )
}

export default _app

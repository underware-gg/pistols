import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import React from 'react'
import { PistolsProvider } from '@/pistols/hooks/PistolsContext'
import { SettingsProvider } from '@/pistols/hooks/SettingsContext'

function _app({ Component, pageProps }) {
  return (
    <PistolsProvider>
      <SettingsProvider>
        <Component {...pageProps} />
      </SettingsProvider>
    </PistolsProvider>
  )
}

export default _app

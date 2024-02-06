import React, { useState } from 'react'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { DojoProvider } from '@/dojo/DojoContext'
import { setup } from '@/dojo/setup'
import { GameplayProvider } from '@/pistols/hooks/GameplayContext'
import App from '@/pistols/components/App'
import { DojoStatus } from './account/DojoStatus'


export default function AppDojo({
  title=null,
  backgroundImage = null,
  children,
}) {
  return (
    <App title={title} backgroundImage={backgroundImage}>
      <DojoSetup>
        {children}
      </DojoSetup>
    </App>
  );
}

function DojoSetup({ children }) {
  const [setupResult, setSetupResult] = useState(null)

  useEffectOnce(() => {
    let _mounted = true
    const _setup = async () => {
      const result = await setup()
      if (_mounted) {
        setSetupResult(result)
      }
    }
    _setup()
    return () => {
      _mounted = false
    }
  }, [])

  if (!setupResult) {
    return (
      <>
        <h1 className='TitleCase'>loading up...</h1>
        <h5><DojoStatus /></h5>
      </>
    )
  }

  return (
    <DojoProvider value={setupResult}>
      <GameplayProvider>
        {children}
      </GameplayProvider>
    </DojoProvider>
  );
}

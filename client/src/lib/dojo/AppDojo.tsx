import React, { ReactNode, useState } from 'react'
import { useEffectOnce } from '@/lib/hooks/useEffectOnce'
import { isChainIdSupported } from '@/lib/dojo/setup/config'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { StarknetProvider } from '@/lib/dojo/StarknetProvider'
import { useDojoChains } from '@/lib/dojo/hooks/useDojoChains'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { HeaderData } from '@/lib/ui/AppHeader'
import App from '@/lib/ui/App'

// TODO: Move into lib or pass as prop
import { DojoProvider } from '@/dojo/DojoContext'
import { SetupResult, setup } from '@/dojo/setup'
import manifest from '../../manifest.json'

export default function AppDojo({
  headerData = {},
  backgroundImage = null,
  chains,
  children,
}: {
  headerData?: HeaderData
  backgroundImage?: string
  chains: CHAIN_ID[],
  children: ReactNode
}) {
  return (
    <App headerData={headerData} backgroundImage={backgroundImage}>
      <Providers supportedChainIds={chains}>
        {children}
      </Providers>
    </App>
  );
}

function Providers({
  supportedChainIds,
  children,
}: {
  supportedChainIds: CHAIN_ID[],
  children: ReactNode
}) {
  const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID ?? (
    process.env.NODE_ENV === 'development' ? CHAIN_ID.LOCAL_KATANA
      : supportedChainIds[0]
  )) as CHAIN_ID

  const lastSelectedChainId = (typeof window !== 'undefined' ? window?.localStorage?.getItem('lastSelectedChainId') : undefined) as CHAIN_ID

  const intialChainId = isChainIdSupported(lastSelectedChainId) ? lastSelectedChainId : defaultChainId

  const { selectedChainConfig, selectedChainId, selectChainId, isKatana, chains } = useDojoChains(intialChainId, supportedChainIds);

  const [setupResult, setSetupResult] = useState<SetupResult>(null)

  useEffectOnce(() => {
    let _mounted = true
    const _setup = async () => {
      const result = await setup(selectedChainConfig)
      console.log('CHAIN SETUP OK')
      if (_mounted) {
        setSetupResult(result)
      }
    }
    if (!selectedChainConfig) {
      throw `Invlaid config for chain Id [${selectedChainId}]`
    }
    setSetupResult(null)
    _setup()
    return () => {
      _mounted = false
    }
  }, [selectedChainConfig, selectedChainId])

  if (!setupResult) {
    return (
      <>
        <h1 className='TitleCase'>Loading Up...</h1>
        <h5><DojoStatus /></h5>
      </>
    )
  }

  return (
    <StarknetProvider dojoChainConfig={selectedChainConfig} chains={chains}>
      <DojoProvider value={setupResult}>
        {children}
      </DojoProvider>
    </StarknetProvider>
  );
}

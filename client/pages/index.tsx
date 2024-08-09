import React, { useMemo } from 'react'
import Background from '@/pistols/components/Background'
import Gate, { CurrentChain } from '@/pistols/components/Gate'
import App from '@/lib/ui/App'
import { HeaderData } from '@/lib/ui/AppHeader'

export default function IndexPage() {
  const headerData: HeaderData = useMemo(() => ({
    title: 'Pistols at 10 Blocks',
  }), [])
  return (
    <App headerData={headerData}>
      <Background className='BackgroundGate'>
        <Gate />
        <CurrentChain />
      </Background>
    </App>
  )
}

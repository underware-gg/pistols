import React, { useMemo } from 'react'
import Background from '@/components/Background'
// import Gate from '@/pistols/components/ScGate'
import App from '@/components/App'
import { HeaderData } from '@/components/AppHeader'

export default function IndexPage() {
  const headerData: HeaderData = useMemo(() => ({
    title: 'Pistols at 10 Blocks',
  }), [])
  return (
    <App headerData={headerData}>
      <Background className='BackgroundSplash'>
        {/* <Gate /> */}
      </Background>
    </App>
  )
}

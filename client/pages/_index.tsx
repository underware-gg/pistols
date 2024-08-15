import React, { useMemo } from 'react'
import Background from '@/pistols/components/Background'
// import Gate from '@/pistols/components/ScGate'
import App from '@/lib/ui/App'
import { HeaderData } from '@/lib/ui/AppHeader'

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

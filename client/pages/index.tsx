import React from 'react'
import Link from 'next/link'
import { Image } from 'semantic-ui-react'
import App from '@/pistols/components/App'
// import SplashArt from '@/components/SplashArt';

export default function IndexPage() {

  return (
    <App>

      <Link href='/gate'>
        <Image className='Logo' src='/images/logo.png' />
      </Link>

      {/* <SplashArt /> */}

      {/* <div className='Spacer20' /> */}
      {/* <h2><button onClick={() => { location.href = '/manor' }}>Enter The Manor at Kurnkunor</button></h2> */}

      {/* <div className='Spacer20' /> */}
      {/* <h2><button onClick={() => { location.href = '/editor/' }}>BITMAP EDITOR</button></h2> */}


      <div className='Spacer20' />

      <div className='AlignCenter'>
        <h3>
          <a href='https://lootunder.world/pistols'>Pistols at 10 Blocks</a>
        </h3>
        
        by <a href='https://lootunder.world'>Team Underworld</a>
        <br />
        <a href='https://x.com/LootUnderworld'>@LootUnderworld</a>
      </div>

    </App>
  );
}

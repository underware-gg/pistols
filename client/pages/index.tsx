import React from 'react'
import Link from 'next/link'
import { Image } from 'semantic-ui-react'
import App from '@/pistols/components/App'
// import SplashArt from '@/components/SplashArt';

export default function IndexPage() {

  return (
    <App backgroundImage={'/images/bg_duellists_1.jpg'} className='BackgroundFit'>

      {/* <Link href='/gate'>
        <Image className='Logo' src='/images/logo.png' />
      </Link> */}

      {/* <SplashArt /> */}


      <div className='Spacer20' />

      <div className='AlignCenter'>

        <Link href='/gate'>
          <h1>Pistols at 10 Blocks</h1>
        </Link>

        <br />
        <hr />
        
        by <a href='https://lootunder.world'>Team Underworld</a>
        <br />
        <a href='https://x.com/LootUnderworld'>@LootUnderworld</a>
      </div>

    </App>
  );
}

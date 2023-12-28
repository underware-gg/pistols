import React from 'react'
import Link from 'next/link'
import App from '@/pistols/components/App'
import Background from '@/pistols/components/Background';
// import SplashArt from '@/components/SplashArt';

export default function IndexPage() {

  return (
    // <App backgroundImage={'/images/bg_duellists_1.jpg'} className='AppBackgroundFit'>
    <App>
      <Background className='BackgroundSplash'>

        <div className='AlignCenter'>

          <Link href='/gate'>
            <h1>Pistols at 10 Blocks</h1>
          </Link>

          <hr />

          by <a href='https://lootunder.world'>Team Underworld</a>
          <br />
          <a href='https://x.com/LootUnderworld'>@LootUnderworld</a>

          <div className='Spacer20' />
          <div className='Spacer20' />
          <div className='Spacer20' />
          <div className='Spacer20' />
          <div className='Spacer20' />
          <div className='Spacer20' />
          <div className='Spacer20' />

        </div>

      </Background>
    </App>
  );
}

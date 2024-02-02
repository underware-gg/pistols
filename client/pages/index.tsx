import React from 'react'
import Link from 'next/link'
import App from '@/pistols/components/App'
import Background from '@/pistols/components/Background'
import Logo from '@/pistols/components/Logo'

export default function IndexPage() {
  return (
    <App>
      <Background className='BackgroundSplash'>
        <div className='AlignCenter'>

          <Link href='/gate'>
            <Logo />
          </Link>

          <div className='Spacer20' />

          <Link href='/gate'>
            <h1 className='TitleCase'>Pistols at 10 Blocks</h1>
          </Link>

          <hr />

          <h5>
            <span className='Black'>by</span> <a href='https://lootunder.world'>Team Underworld</a>
          </h5>
          <h5>
            <a href='https://x.com/LootUnderworld'>@LootUnderworld</a>
          </h5>

          <div style={{ height: '5vh' }}>&nbsp;</div>

        </div>
      </Background>
    </App>
  );
}

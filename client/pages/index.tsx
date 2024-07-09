import React from 'react'
import Link from 'next/link'
import App from '@/lib/ui/App'
import Background from '@/pistols/components/Background'
import Logo from '@/pistols/components/Logo'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'

export default function IndexPage() {
  const { playerId } = usePlayerId()
  return (
    <App>
      <Background className='BackgroundSplash'>
        <div className='AlignCenter'>

          <Link href='https://pistols.underware.gg/gate'>
            <Logo />
          </Link>

          <div className='Spacer20' />

          <Link href='https://pistols.underware.gg/gate'>
            <h1 className='TitleCase'>Pistols at 10 Blocks</h1>
          </Link>

          <hr />

          <h5>
            an [<a href='https://x.com/LootUnderworld'>Underworld</a>] game
          </h5>
          <h5>
            <span>by</span> [<a href='https://underware.gg'>Underware</a>]
          </h5>

          <div style={{ height: '5vh' }}>&nbsp;</div>

        </div>
      </Background>
    </App>
  );
}

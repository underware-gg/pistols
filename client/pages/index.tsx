import React from 'react'
import App from '@/lib/ui/App'
import Background from '@/pistols/components/Background'
import Logo from '@/pistols/components/Logo'
import { Button } from 'semantic-ui-react'

export default function IndexPage() {
  return (
    <App>
      <Background className='BackgroundSplash'>
        <div className='AlignCenter'>
          <Logo />
          <div className='Spacer20' />
          <h1 className='TitleCase'>Pistols at 10 Blocks</h1>
          <hr />
          <h5>
            an [<a href='https://x.com/LootUnderworld'>Underworld</a>] game
          </h5>
          <h5>
            <span>by</span> [<a href='https://underware.gg'>Underware</a>]
          </h5>
          <div className='Spacer20' />
          <Button
            as='a'
            href='./gate'
            target='_blank'
          >
            Enter Tavern
          </Button>
          <div style={{ height: '5vh' }}>&nbsp;</div>
        </div>
      </Background>
    </App>
  );
}

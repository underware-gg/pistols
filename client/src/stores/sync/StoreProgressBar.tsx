import { useEffect } from 'react'
import { Button, Progress } from 'semantic-ui-react'
import { usePlayerOnlineSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, useDelay, useUserHasInteracted } from '@underware/pistols-sdk/utils/hooks'
import { useStoreLoadingProgress } from '../progressStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function StoreProgressBar() {
  const { progress, finished } = useStoreLoadingProgress()
  if (finished) return <></>
  return (
    <div style={{ position: 'absolute', bottom: '0', left: 'calc(50%-100px)', height: '5px', zIndex: 10000 }}>
      <Progress percent={progress * 100} indicating style={{ width: '200px', height: '5px' }} warning inverted />
    </div>
  )
}

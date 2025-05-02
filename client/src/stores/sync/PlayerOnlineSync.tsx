import { useEffect } from 'react'
import { Button } from 'semantic-ui-react'
import { usePlayerOnlineSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, useDelay, useUserHasInteracted } from '@underware/pistols-sdk/utils/hooks'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerOnlineSync() {
  const { userHasInteracted } = useUserHasInteracted()

  // get a tick every 30 seconds
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 50)
  useEffect(() => {
    updateTimestamp()
  }, [])

  // wait for page to load
  const waited = useDelay(true, 3000)

  // publisher
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(waited ? clientSeconds : 0)

  useEffect(() => {
    if (publish && clientSeconds > 0 && userHasInteracted && waited && !isPublishing) {
      publish()
    }
  }, [publish, clientSeconds, userHasInteracted, waited])

  return (<></>)
}

export function PublishOnlineStatusButton() {
  const { clientSeconds } = useClientTimestamp(true)
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(clientSeconds)
  return (<Button className='AbsoluteBottom' disabled={isPublishing} style={{ zIndex: 1000 }} onClick={publish}>Publish Online Status</Button>)
}

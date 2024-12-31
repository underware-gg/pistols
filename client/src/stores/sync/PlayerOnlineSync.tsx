import { useEffect } from 'react'
import { Button } from 'semantic-ui-react'
import { usePlayerOnlineSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, useUserHasInteracted } from '@underware_gg/pistols-sdk/utils'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerOnlineSync() {
  // get a tick every 30 seconds
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 30)
  useEffect(() => {
    updateTimestamp()
  }, [])

  const { publish, isPublishing } = usePlayerOnlineSignedMessage(clientSeconds)

  const { userHasInteracted } = useUserHasInteracted()

  useEffect(() => {
    if (publish && clientSeconds > 0 && !isPublishing && userHasInteracted) {
      publish()
    }
  }, [publish, clientSeconds, userHasInteracted])

  return (<></>)
}

export function PublishOnlineStatusButton() {
  const { clientSeconds } = useClientTimestamp(true)
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(clientSeconds)
  return (<Button className='AbsoluteBottom' disabled={isPublishing} style={{ zIndex: 1000 }} onClick={publish}>Publish Online Status</Button>)
}

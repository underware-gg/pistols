import { useEffect } from 'react'
import { Button } from 'semantic-ui-react'
import { usePlayerOnlineSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, useUserHasInteracted } from '@underware/pistols-sdk/utils/hooks'
import { useStoreLoadingProgress } from '/src/stores/progressStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerOnlineSync() {
  const { userHasInteracted } = useUserHasInteracted()
  const { finished } = useStoreLoadingProgress()

  // get a tick periodically
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 50)
  useEffect(() => {
    updateTimestamp()
  }, [])

  // publisher
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(finished ? clientSeconds : 0, false)

  useEffect(() => {
    if (publish && clientSeconds > 0 && userHasInteracted && finished && !isPublishing) {
      // publish()
    }
  }, [publish, clientSeconds, userHasInteracted, finished])

  return (<></>)
}

export function PublishOnlineStatusButton() {
  const { clientSeconds } = useClientTimestamp(true)
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(clientSeconds, false)
  return (<Button className='AbsoluteBottom' disabled={isPublishing} style={{ zIndex: 1000 }} onClick={publish}>Publish Online Status</Button>)
}

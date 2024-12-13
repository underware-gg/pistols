import { useEffect } from 'react'
import { Button } from 'semantic-ui-react'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { usePlayerOnlineSignedMessage } from '@/pistols/hooks/useSignedMessages'


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

  useEffect(() => {
    if (publish && clientSeconds > 0) {
      // TODO: enable this...
      // publish()
    }
  }, [publish, clientSeconds])

  return (<></>)
}

export function PublishOnlineStatusButton() {
  const { publish, isPublishing } = usePlayerOnlineSignedMessage()
  return (<Button className='AbsoluteBottom' disabled={isPublishing} style={{ zIndex: 1000 }} onClick={publish}>Publish Online Status</Button>)
}

import { useEffect, useMemo, useState } from 'react'
import { Button } from 'semantic-ui-react'
import { usePlayerOnlineSignedMessage } from '/src/hooks/useSignedMessages'
import { useClientTimestamp, useUserHasInteracted } from '@underware/pistols-sdk/utils/hooks'
import { useStoreLoadingProgress } from '/src/stores/progressStore'
import * as ENV from '/src/utils/env'

//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerOnlineSync({
  verbose = false,
}: {
  verbose?: boolean
}) {
  // conditions to start publishing
  const { userHasInteracted } = useUserHasInteracted();
  const { finished } = useStoreLoadingProgress();
  const canPublish = useMemo(() => (ENV.PUBLISH_ONLINE_STATUS && userHasInteracted && finished), [userHasInteracted, finished]);

  // publisher
  const [newTimestamp, setNewTimestamp] = useState(0);
  const { clientTimestamp, updateTimestamp } = useClientTimestamp({ autoUpdate: true, updateSeconds: 10 });
  const { publish, isPublishing, isError, lastTimestamp } = usePlayerOnlineSignedMessage(newTimestamp, false);
  useEffect(() => {
    // sync client with last timestamp
    updateTimestamp();
  }, [lastTimestamp])

  // current player online stimestamp
  const secondsSinceLastSeen = useMemo(() => (
    (lastTimestamp && clientTimestamp) ? Math.max(0, Math.floor((clientTimestamp - lastTimestamp))) : 0
  ), [clientTimestamp, lastTimestamp]);
  useEffect(() => {
    // isError stops auto publishing...
    if (canPublish && !isPublishing && !isError && (lastTimestamp === undefined || secondsSinceLastSeen >= 50)) {
      setNewTimestamp(clientTimestamp);
    } else {
      setNewTimestamp(0);
    }
  }, [canPublish, isPublishing, isError, clientTimestamp, lastTimestamp, secondsSinceLastSeen])

  useEffect(() => {
    if (publish && newTimestamp > 0) {
      publish();
      setNewTimestamp(0);
    }
  }, [publish, newTimestamp])

  // useMemo(() => {
  //   console.log(`PlayerOnlineSync(${canPublish}) =>`, newTimestamp, secondsSinceLastSeen, '>', canPublish, isPublishing, isError, lastTimestamp);
  // }, [newTimestamp, secondsSinceLastSeen, canPublish, isPublishing, isError, lastTimestamp]);

  return (<></>);
}


//
// for testing purposes
//
export function PublishOnlineStatusButton({
  absolute = true,
  available = true,
}: {
  absolute?: boolean
  available?: boolean
}) {
  const { clientSeconds } = useClientTimestamp({ autoUpdate: true })
  const { publish, isPublishing } = usePlayerOnlineSignedMessage(clientSeconds, available);
  const label = (available === true ? 'Publish Online (Available)' : 'Publish Online (Unavailable)');
  return (
    <Button
      className={absolute ? 'AbsoluteBottom' : ''}
      disabled={isPublishing}
      style={{ zIndex: 1000 }}
      onClick={publish}
      size='small'
    >
      {label}
    </Button>
  );
}

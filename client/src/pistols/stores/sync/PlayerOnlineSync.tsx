import { useEffect } from 'react'
import { Account } from 'starknet'
import { useSdkPublishSignedMessage } from '@/lib/dojo/hooks/useSdkSignedMessage'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { useAccount } from '@starknet-react/core'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerOnlineSync() {
  // get a tick every 30 seconds
  const { clientSeconds, updateTimestamp } = useClientTimestamp(true, 30)
  useEffect(() => {
    updateTimestamp()
  }, [])

  const { account } = useAccount()
  const { publish } = useSdkPublishSignedMessage(
    'pistols-PlayerOnline', {
      address: account?.address,
      timestamp: Math.floor(clientSeconds),
    }, account as Account)

  useEffect(() => {
    if (publish && clientSeconds > 0) {
      // publish()
    }
  }, [publish, clientSeconds])

  // return (<Button className='AbsoluteBottom' style={{ zIndex: 1000 }} onClick={publish}>Publish Online Status</Button>)

  return (<></>)
}

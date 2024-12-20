import { useMemo } from 'react'
import { AccountInterface, StarknetDomain, TypedData } from 'starknet'
import { createTypedMessage, getMessageHash, getTypeHash } from 'src/utils/starknet_sign'
import { chainIdToString } from 'src/utils/starknet'

//---------------------------------
// Create TypedData from messages
//
export type UseTypedMessageResult = {
  typedMessage: TypedData
  typeHash: string
  messageHash: string
}
export const useTypedMessage = ({
  account,
  starknetDomain,
  messages,
}: {
    account: AccountInterface
  starknetDomain: StarknetDomain
  messages: any
}): UseTypedMessageResult => {
  const typedMessage = useMemo(() => (createTypedMessage({
    starknetDomain,
    messages,
  })), [starknetDomain, messages])
  const typeHash = useMemo(() => ((account && typedMessage) ? getTypeHash(typedMessage, typedMessage.primaryType) : null), [account, typedMessage])
  const messageHash = useMemo(() => ((account && typedMessage) ? getMessageHash(typedMessage, account.address) : null), [account, typedMessage])
  return {
    typedMessage,
    typeHash,
    messageHash,
  }
}


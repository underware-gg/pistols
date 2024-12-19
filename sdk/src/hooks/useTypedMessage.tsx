import { useMemo } from 'react'
import { AccountInterface, StarknetDomain, TypedData } from 'starknet'
import { chainIdToString, createTypedMessage, getMessageHash, getTypeHash } from '../utils'

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


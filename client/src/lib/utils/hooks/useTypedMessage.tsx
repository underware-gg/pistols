import { useMemo } from 'react'
import { AccountInterface, TypedData } from 'starknet'
import { createTypedMessage, getMessageHash, getTypeHash, Revision } from '@/lib/utils/starknet_sign'
import { chainIdToString, feltToString } from '@/lib/utils/starknet'

//---------------------------------
// Create TypedData from messages
//
export type UseTypedMessageResult = {
  typedMessage: TypedData
  typeHash: string
  messageHash: string
}
export const useTypedMessage = ({
  revision,
  messages,
  chainId,
  account,
}: {
  revision: Revision
  messages: any
  chainId: bigint | string
  account: AccountInterface
}): UseTypedMessageResult => {
  const typedMessage = useMemo(() => (createTypedMessage({
    revision,
    chainId: chainIdToString(chainId),
    messages,
  })), [revision, chainId, messages])
  const typeHash = useMemo(() => (account ? getTypeHash(typedMessage, typedMessage.primaryType) : null), [account, typedMessage])
  const messageHash = useMemo(() => (account ? getMessageHash(typedMessage, account.address) : null), [account, typedMessage])
  return {
    typedMessage,
    typeHash,
    messageHash,
  }
}


import { useEffect, useMemo, useState } from 'react'
import { AccountInterface, ArraySignatureType, Signature, TypedData, typedData } from 'starknet'
import { useSignTypedData } from '@starknet-react/core'
import { createTypedMessage, getMessageHash, getTypeHash, Revision, splitSignature } from '@/lib/utils/starknet_sign'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { bigintEquals } from '@/lib/utils/types'

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
  chainId?: bigint | string
  account?: AccountInterface
}): UseTypedMessageResult => {
  const typedMessage = useMemo(() => (createTypedMessage({
    revision,
    chainId: chainId ? (typeof chainId === 'string' ? chainId : feltToString(chainId)) : undefined,
    messages,
  })), [revision, chainId, messages])
  const typeHash = useMemo(() => (account ? getTypeHash(typedMessage, typedMessage.primaryType) : null), [typedMessage])
  const messageHash = useMemo(() => (account ? getMessageHash(typedMessage, account.address) : null), [account, typedMessage])
  return {
    typedMessage,
    typeHash,
    messageHash,
  }
}

//---------------------------------
// Sign TypedData
//
export type UseSignTypedMessageResult = {
  sign: (args?: Partial<TypedData>) => void
  signAsync: (args?: Partial<TypedData>) => Promise<Signature>
  isSigning: boolean
  // isPending: boolean
  // isSuccess: boolean
  // isError: boolean
  // isIdle: boolean
  rawSignature: ArraySignatureType
  signaturePair: bigint[]
}
export const useSignTypedMessage = (typedMessage: TypedData): UseSignTypedMessageResult => {
  const SSS = useSignTypedData({ params: typedMessage })
  const { data, signTypedData, signTypedDataAsync, isPending, isSuccess, isError, isIdle } = SSS
  // console.log(`SIGN:`, isPending, isSuccess, isError, isIdle, data )
  const signaturePair = useMemo(() => splitSignature(data), [data])
  return {
    sign: signTypedData,
    signAsync: signTypedDataAsync,
    isSigning: isPending,
    // isPending, isSuccess, isError, isIdle,
    rawSignature: data as ArraySignatureType,
    signaturePair,
  }
}

//---------------------------------
// Verify typed message off-chain
//
export type UseVerifyMessagesResult = {
  isVerifying: boolean
  isVerified: boolean
  formatted: string
}
const useVerifyMessages = (
  account: AccountInterface,
  typedMessage: TypedData,
  signature: Signature,
  verifyAsync: () => Promise<boolean>
): UseVerifyMessagesResult => {
  const [isVerifying, setisVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean>(undefined)
  useEffect(() => {
    const _verify = async () => {
      try {
        // console.warn(`verifyMessage off-chain...`, signature)
        const verified = await verifyAsync()
        setIsVerified(verified)
      } catch (e) {
        console.warn(`useVerifyMessages() ERROR:`, e)
        setIsVerified(false)
      }
      setisVerifying(false)
    }
    setIsVerified(undefined)
    if (account && typedMessage && signature && !isVerifying) {
      setisVerifying(true)
      _verify()
    }
  }, [account, typedMessage, signature])
  const formatted = useMemo(() => (isVerifying ? '...' : isVerified === undefined ? '' : isVerified ? 'true' : 'false'), [isVerifying, isVerified])
  return {
    isVerifying,
    isVerified,
    formatted,
  }
}


//---------------------------------
// Verify typed message off-chain
//
export const useVerifyMessagesOffChain = (
  account: AccountInterface,
  typedMessage: TypedData,
  signature: Signature,
): UseVerifyMessagesResult => {
  return useVerifyMessages(account, typedMessage, signature, async () => {
    if (!signature) {
      return false
    }
    if (splitSignature(signature).length != 0) {
      return await account.verifyMessage(typedMessage, signature)
    }
    console.warn(`useVerifyMessagesOffChain() invalid signature`, signature)
    return false
  })
}


//---------------------------------
// Verify typed message on-chain
//
// based on:
// https://github.com/cartridge-gg/controller/blob/main/examples/starknet-react-next/src/components/SignMessage.tsx#L60-L71
//
export const useVerifyMessagesOnChain = (
  account: AccountInterface,
  typedMessage: TypedData,
  signature: ArraySignatureType,
): UseVerifyMessagesResult => {
  return useVerifyMessages(account, typedMessage, signature, async () => {
    // console.log(`useVerifyMessagesOnChain()...`)
    const res = await account.callContract(
      {
        contractAddress: account.address,
        entrypoint: 'is_valid_signature',
        calldata: [
          typedData.getMessageHash(typedMessage, account.address),
          signature.length,
          ...signature,
        ],
      },
      'pending',
    )
    // Braavos retunds: { result: string[] }
    //@ts-ignore
    const result = res?.[0] ?? res?.result?.[0] ?? null;
    const verified = bigintEquals(result, stringToFelt('VALID'))
    // console.log(`useVerifyMessagesOnChain():`, res, result, bigintToHex(stringToFelt('VALID')), verified)
    return verified
  })
}

import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { apiVerifyControllerSignature } from 'src/api/verify'
import { isPositiveBigint } from 'src/utils/misc/types'
import { feltToString } from 'src/utils/starknet/starknet'


export const useVerifyControllerSignatureApi = (
  serverUrl: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
  fromAccount?: string,
) => {
  const { address, account, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isValid, setIsValid] = useState<boolean>();

  useEffect(() => {
    let _mounted = true
    const _verify = async () => {
      setIsLoading(true);
      setIsValid(undefined);
      try {
        const res = await apiVerifyControllerSignature(
          serverUrl,
          fromAccount || address,
          feltToString(chainId),
          messageHash,
          signature,
        )
        if (_mounted) {
          setIsLoading(false);
          setIsValid(res);
        }
      } catch (e) {
        console.error(e)
        if (_mounted) {
          setIsLoading(false);
          setIsValid(false);
        }
      }
    }
    if (account && isPositiveBigint(messageHash) && signature?.length > 0) {
      _verify()
    }
    return () => {
      _mounted = false
    }
  }, [account, messageHash, signature])

  return {
    isLoading,
    isValid,
  }
}


import { useEffect, useState } from 'react'
import { BigNumberish, StarknetDomain } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { apiGenerateControllerSalt } from 'src/api/salt'
import { isPositiveBigint } from 'src/utils/misc/types'

export const useApiGenerateControllerSalt = (
  serverUrl: string,
  starknetDomain: StarknetDomain,
  messageHash: BigNumberish,
  signature: BigNumberish[],
  fromAccount?: string,
) => {
  const { address, account, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isError, setIsError] = useState<boolean>();
  const [salt, setSalt] = useState<bigint | undefined>();

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      setIsLoading(true);
      setIsError(undefined);
      try {
        const result = await apiGenerateControllerSalt(
          serverUrl,
          fromAccount || address,
          starknetDomain,
          messageHash,
          signature,
        )
        if (_mounted) {
          setIsLoading(false);
          if (isPositiveBigint(result)) { 
            setIsError(false);
            setSalt(result);
          } else {
            setIsError(true);
          }
        }
      } catch (e) {
        console.error(e)
        if (_mounted) {
          setIsLoading(false);
          setIsError(true);
        }
      }
    }
    setSalt(undefined);
    if (account && isPositiveBigint(messageHash) && signature?.length > 0) {
      _fetch()
    }
    return () => {
      _mounted = false
    }
  }, [account, messageHash, signature])

  return {
    isLoading,
    isError,
    salt,
  }
}


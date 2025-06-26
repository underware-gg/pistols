import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { isPositiveBigint } from 'src/utils/misc/types'
import { feltToString } from 'src/starknet/starknet'
import { apiAutoReveal } from 'src/api/reveal'

export const useApiAutoReveal = (
  serverUrl: string,
  duelId: BigNumberish,
  enabled: boolean,
) => {
  const { chainId } = useAccount();
  const [isRevealing, setIsRevealing] = useState<boolean>();
  const [isRevealed, setIsRevealed] = useState<boolean>();

  useEffect(() => {
    let _mounted = true
    const _reveal = async () => {
      setIsRevealing(true);
      try {
        const res = await apiAutoReveal(
          serverUrl,
          duelId,
          feltToString(chainId),
        )
        if (_mounted) {
          setIsRevealing(false);
          setIsRevealed(res);
        }
      } catch (e) {
        console.error(e)
        if (_mounted) {
          setIsRevealing(false);
          setIsRevealed(false);
        }
      }
    }
    setIsRevealed(undefined);
    if (isPositiveBigint(duelId) && enabled) {
      _reveal()
    }
    return () => {
      _mounted = false
    }
  }, [chainId, duelId, enabled])

  return {
    isRevealing,
    isRevealed,
  }
}

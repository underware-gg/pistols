import React, { useMemo } from 'react'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { VStack } from '../ui/Stack'
import useSWR from 'swr'

const textFetcher = (url: string) => fetch(url).then((res) => res.text())

export const useToriiStatus = () => {
  const { selectedChainConfig } = useSelectedChain()
  const { data, error, isLoading } = useSWR(selectedChainConfig.toriiUrl, textFetcher)
  // data: string = {"service":"torii","success":true}
  // console.log(`torii:`, data, data, error, isLoading)

  const isSuccess = useMemo(() => {
    if (error || !data) return false
    try {
      const _data = JSON.parse(data)
      return _data?.success ?? false
    } catch {
      return false
    }
  }, [data, error])

  return {
    toriiIsLoading: isLoading,
    toriiIsOk: isSuccess,
    toriiIsError: !isLoading && !isSuccess,
  }
}

export const useKatanaStatus = () => {
  const { selectedChainConfig } = useSelectedChain()
  const { data, error, isLoading } = useSWR(selectedChainConfig.rpcUrl, textFetcher)
  // data: string = {"health":true}
  // console.log(`torii:`, data, data, error, isLoading)

  const isSuccess = useMemo(() => {
    if (error || !data) return false
    try {
      const _data = JSON.parse(data)
      return _data?.health ?? false
    } catch {
      return false
    }
  }, [data, error])

  return {
    katanaIsLoading: isLoading,
    katanaIsOk: isSuccess,
    katanaIsError: !isLoading && !isSuccess,
  }
}

//---------------
// Portraits
//

export function DojoStatus({
  message = 'Loading Dojo...',
}) {
  return (
    <div className='Overlay FillParent'>
      <VStack>
        <h1 className='TitleCase'>{message}</h1>
      </VStack>
    </div>
  )
}

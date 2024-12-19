import React, { useMemo } from 'react'
import useSWR from 'swr'
import { useSelectedChain } from 'src/dojo/hooks/useChain'

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
      <h1 className='TitleCase'>{message}</h1>
    </div>
  )
}

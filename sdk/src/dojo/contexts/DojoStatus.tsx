import React, { useMemo } from 'react'
import useSWR from 'swr'
import { useStarknetContext } from 'src/dojo/contexts/StarknetProvider'

const textFetcher = (url: string) => fetch(url).then((res) => res.text())

export const useToriiStatus = () => {
  const { selectedNetworkConfig } = useStarknetContext()
  const { data, error, isLoading } = useSWR(selectedNetworkConfig.toriiUrl, textFetcher)
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
  const { selectedNetworkConfig } = useStarknetContext()
  const { data, error, isLoading } = useSWR(selectedNetworkConfig.rpcUrl, textFetcher)
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

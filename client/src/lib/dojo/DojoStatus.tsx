import React from 'react'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { VStack } from '../ui/Stack'
import useSWR from 'swr'

const textFetcher = (url: string) => fetch(url).then((res) => res.text())

export const useDojoStatus = () => {
  const { selectedChainConfig } = useSelectedChain()

  const { data, error, isLoading } = useSWR(selectedChainConfig.toriiUrl, textFetcher)
  // data: string = {"service":"torii","success":true}
  // console.log(`torii:`, data, error, isLoading)

  const isError = error ?? (data?.startsWith('Deployment does not exist')) ?? false

  return {
    // isConnected: (!error && !isLoading),
    isError,
  }
}

//---------------
// Portraits
//

export function DojoStatus({
  message = 'Loading Dojo...',
}) {
  const { isError } = useDojoStatus()
  // const { disconnect } = useDisconnect()
  return (
    <VStack>
      <h1 className='TitleCase'>{message}</h1>
      <h5 className='TitleCase Negative'>
        {isError && <>chain is unavailable</>}
      </h5>
      {/* <h5 className='TitleCase Important Anchor' onClick={() => disconnect()}>
        {isError && <>disconnect</>}
      </h5> */}
    </VStack>
  )
}

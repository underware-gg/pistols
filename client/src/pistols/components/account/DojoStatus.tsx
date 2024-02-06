import React, { useMemo } from 'react'
import useSWR from 'swr'
const textFetcher = (url: string) => fetch(url).then((res) => res.text())


export const useDojoStatus = () => {
  // data: string = {"service":"torii","success":true}
  const { data, error, isLoading } = useSWR(process.env.NEXT_PUBLIC_TORII, textFetcher)
  // console.log(`torii:`, data, error, isLoading)

  const isError = error ?? (data?.startsWith('Deployment doesnt exist')) ?? false

  return {
    // isConnected: (!error && !isLoading),
    isError,
  }
}

//---------------
// Portraits
//

export function DojoStatus({
  label = '',
}) {
  const { isError } = useDojoStatus()
  return (
    <>
      {/* {isConnected && <span className='Important TitleCase'>connected</span>} */}
      {isError && <span className='Negative TitleCase'>down, refresh later</span>}
    </>
  )
}

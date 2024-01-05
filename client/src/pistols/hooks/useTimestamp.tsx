import { useEffect, useState } from "react"
import { useDojoSystemCalls } from '@/dojo/DojoContext'
import { useEffectOnce } from "@/pistols/hooks/useEffectOnce"

export const useClientTimestamp = (autoUpdate: boolean = false) => {
  const [clientTimestamp, setClientTimestamp] = useState(0)

  const _getTimestamp = () => (Math.floor(new Date().getTime() / 1000))

  useEffect(() => {
    let _mounted = true
    let _timeout = null
    // initialize
    setClientTimestamp(_getTimestamp())
    // auto updates
    if (autoUpdate) {
      _timeout = setInterval(() => {
        if (_mounted) {
          setClientTimestamp(_getTimestamp())
        }
      }, 1000)
    }
    return () => {
      _mounted = false
      clearTimeout(_timeout)
    }
  }, [])

  return {
    clientTimestamp
  }
}

export const useContractTimestamp = () => {
  const { get_timestamp } = useDojoSystemCalls()
  const [isLoading, setIsLoading] = useState(null)
  const [timestamp, setTimestamp] = useState(null)

  useEffectOnce(() => {
    let _mounted = true
    const _fetch = async () => {
      const _timestamp = await get_timestamp()
      if (_mounted && _timestamp) {
        setTimestamp(_timestamp)
        setIsLoading(false)
      }
    }
    setTimestamp(null)
    setIsLoading(true)
    _fetch()
    return () => {
      _mounted = false
    }
  }, [])

  return {
    timestamp,
    isLoading,
  }
}


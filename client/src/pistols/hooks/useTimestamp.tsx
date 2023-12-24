import { useState } from "react"
import { useDojoSystemCalls } from '@/dojo/DojoContext'
import { useEffectOnce } from "@/pistols/hooks/useEffectOnce"

export const useSystemTimestamp = () => {
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

export const useTimestampCountdown = () => {
  const { timestamp } = useSystemTimestamp()
  // TODO: create countdown loop
  return timestamp
}


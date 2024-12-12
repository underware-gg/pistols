import { useCallback, useEffect, useState } from 'react'
import { formatTimestampLocal } from '@/lib/utils/timestamp'

export const useClientTimestamp = (autoUpdate: boolean = false, updateSeconds: number = 1) => {
  const [clientDate, setClientDate] = useState(new Date(0))
  const [clientMillis, setClientMillis] = useState(0)
  const [clientSeconds, setClientSeconds] = useState(0.0)
  const [updateCounter, setUpdateCounter] = useState(0)

  const _update = () => {
    const now = new Date()
    setClientDate(now)
    setClientMillis(Math.floor(now.getTime()))
    setClientSeconds(now.getTime() / 1000)
  }

  useEffect(() => {
    let _mounted = true
    let _interval = null
    // initialize
    _update()
    // auto updates
    if (autoUpdate) {
      _interval = setInterval(() => {
        if (_mounted) _update()
      }, (updateSeconds * 1000))
    }
    return () => {
      _mounted = false
      clearInterval(_interval)
    }
  }, [autoUpdate, updateSeconds, updateCounter])

  const updateTimestamp = useCallback(() => {
    // force 
    setUpdateCounter(updateCounter + 1)
  }, [updateCounter])

  // useEffect(() => console.log('useClientTimestamp():', clientSeconds, formatTimestampLocal(clientSeconds)), [clientSeconds])

  return {
    clientDate,
    clientMillis,
    clientSeconds,
    updateTimestamp,
  }
}

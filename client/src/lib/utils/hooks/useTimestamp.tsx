import { useCallback, useEffect, useState } from 'react'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { formatTimestampLocal } from '@/lib/utils/timestamp'

export const useClientTimestamp = (autoUpdate: boolean = false, updateSeconds: number = 1) => {
  const [clientDate, setClientDate] = useState(new Date(0))
  const [clientMillis, setClientMillis] = useState(0)
  const [clientSeconds, setClientSeconds] = useState(0.0)

  // force update
  const [forceUpdate, setForceUpdate] = useState(0)
  const updateTimestamp = useCallback(() => {
    setForceUpdate(forceUpdate + 1)
  }, [forceUpdate])

  // avoid starting timer twice on strict mode
  const mounted = useMounted()

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
    if (mounted) {
      _update()
      // auto updates
      if (autoUpdate) {
        _interval = setInterval(() => {
          if (_mounted) _update()
        }, (updateSeconds * 1000))
      }
    }
    return () => {
      _mounted = false
      clearInterval(_interval)
    }
  }, [mounted, autoUpdate, updateSeconds, forceUpdate])

  // useEffect(() => console.log('useClientTimestamp():', clientSeconds, formatTimestampLocal(clientSeconds)), [clientSeconds])

  return {
    clientDate,
    clientMillis,
    clientSeconds,
    updateTimestamp,
  }
}

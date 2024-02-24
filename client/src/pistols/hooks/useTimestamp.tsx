import { useEffect, useState } from 'react'

export const useClientTimestamp = (autoUpdate: boolean = false) => {
  const [clientTimestamp, setClientTimestamp] = useState(0)

  const _getTimestamp = () => (Math.floor(new Date().getTime() / 1000))

  useEffect(() => {
    let _mounted = true
    let _interval = null
    // initialize
    setClientTimestamp(_getTimestamp())
    // auto updates
    if (autoUpdate) {
      _interval = setInterval(() => {
        if (_mounted) {
          setClientTimestamp(_getTimestamp())
        }
      }, 1000)
    }
    return () => {
      _mounted = false
      clearInterval(_interval)
    }
  }, [])

  return {
    clientTimestamp
  }
}


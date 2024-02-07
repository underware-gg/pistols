import { useEffect, useState } from "react"

const _navigatorHasBeenActive = () => (navigator?.userActivation?.hasBeenActive)

export const useUserHasInteracted = (autoUpdate: boolean = true) => {
  const [userHasInteracted, setUserHasInteracted] = useState(false)

  useEffect(() => {
    let _mounted = true
    let _interval = null
    if (_navigatorHasBeenActive()) {
      setUserHasInteracted(true)
    } else if (autoUpdate) {
      _interval = setInterval(() => {
        if (_navigatorHasBeenActive()) {
          if (_mounted) {
            setUserHasInteracted(true)
          }
          clearInterval(_interval)
        }
      }, 100)
    }
    return () => {
      _mounted = false
      clearInterval(_interval)
    }
  }, [])

  return {
    userHasInteracted
  }
}


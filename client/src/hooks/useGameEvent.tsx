import { useState } from 'react'
import { useEffectOnce } from '@underware_gg/pistols-sdk/utils'
import { emitter } from '/src/three/game'

export const useGameEvent = (eventName: string, defaultValue: any = null) => {
  const [value, setValue] = useState(defaultValue)
  const [timestamp, setTimestamp] = useState(0)

  useEffectOnce(() => {
    let _mounted = true

    const _callback = (v) => {
      if (_mounted) {
        setValue(v)
        setTimestamp(Date.now())
      }
    }

    emitter.on(eventName, _callback);

    return () => {
      _mounted = false
      emitter.off(eventName, _callback)
    }

  }, [])

  return {
    value,
    timestamp, // used to update hooks on repeating events
  }
}

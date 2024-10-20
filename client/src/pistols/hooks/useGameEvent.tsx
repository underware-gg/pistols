import { useState } from 'react'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { emitter } from '@/pistols/three/game'

export const useGameEvent = (eventName: string, defaultValue: any = null) => {
  const [value, setValue] = useState(defaultValue)

  useEffectOnce(() => {
    let _mounted = true

    const _callback = (v) => {
      if (_mounted) {
        setValue(v)
      }
    }

    emitter.on(eventName, _callback);

    return () => {
      _mounted = false
      emitter.off(eventName, _callback)
    }

  }, [])
  return value
}
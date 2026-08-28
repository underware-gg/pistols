import { useCallback, useEffect, useState } from 'react'
import { formatTimestampLocal } from 'src/utils/misc/timestamp'
import { useMounted } from 'src/utils/hooks/useMounted'

export const useClientTimestamp = ({
  autoUpdate = false,
  updateSeconds = 1,
  enabled = true,
}: {
  autoUpdate?: boolean
  updateSeconds?: number
  enabled?: boolean
} = {}) => {
  const [clientDate, setClientDate] = useState(new Date(0))
  const [clientMillis, setClientMillis] = useState(0)
  const [clientSeconds, setClientSeconds] = useState(0.0)

  // force update
  const [forceUpdate, setForceUpdate] = useState(0)
  const updateTimestamp = useCallback(() => {
    setForceUpdate((current) => current + 1)
  }, [])

  // avoid starting timer twice on strict mode
  const mounted = useMounted()

  const _update = (reset: boolean = false) => {
    const now = reset ? new Date(0) : new Date();
    setClientDate(now);
    setClientMillis(Math.floor(now.getTime()));
    setClientSeconds(now.getTime() / 1000);
  }

  useEffect(() => {
    let _mounted = true;
    let _interval = undefined;
    // initialize
    if (!enabled) {
      // reset timestamp
      // A clock. The value is wall-time, not derivable from props or state, and the
      // interval below has to live in an effect regardless.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      _update(true);
    } else {
      // get current timestamp
      _update();
      // auto updates
      if (mounted && autoUpdate && updateSeconds > 0) {
        _interval = setInterval(() => {
          if (_mounted) _update()
        }, (updateSeconds * 1000))
      }
    }
    // dismount: clear auto updates, if enabled
    return () => {
      _mounted = false
      clearInterval(_interval)
    }
  }, [mounted, autoUpdate, updateSeconds, forceUpdate, enabled])

  // useEffect(() => console.log('useClientTimestamp():', clientSeconds, formatTimestampLocal(clientSeconds)), [clientSeconds])

  return {
    clientDate,
    clientMillis,
    clientSeconds,
    clientTimestamp: Math.floor(clientSeconds),
    updateTimestamp,
  }
}

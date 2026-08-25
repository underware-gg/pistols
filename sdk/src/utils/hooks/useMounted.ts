import { useEffect, useState } from 'react'

// skip-a-frame
// useful to avoid double effects caused by reactStrictMode: true
export const useMounted = (onMount?: Function) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // Setting state in an effect IS this hook. It exists to skip a frame so callers
    // can avoid the double-invoked effects reactStrictMode causes. Deriving the value
    // instead would delete the hook's only purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    onMount?.()
  }, [])
  return mounted
}

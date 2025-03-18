import { useEffect, useState } from 'react'

// skip-a-frame
// useful to avoid double effects caused by reactStrictMode: true
export const useMounted = (onMount?: Function) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    onMount?.()
  }, [])
  return mounted
}

import { useEffect, useState } from 'react'

export const useClipboard = (autoUpdate: boolean = false) => {
  const [value, setValue] = useState('')

  const _getClipboard = async (): Promise<void> => {
    try {
      const _value = await navigator.clipboard.readText()
      setValue(_value)
    } catch {}
  }

  const [intervalId, setIntervalId] = useState(null)
  useEffect(() => {
    let _mounted = true
    // reset
    clearInterval(intervalId)
    setIntervalId(null)
    _getClipboard()
    // auto updates
    if (autoUpdate) {
      const _interval = setInterval(() => {
        if (_mounted) {
          _getClipboard()
        }
      }, 500)
      setIntervalId(_interval)
    }
    return () => {
      _mounted = false
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [autoUpdate])

  const copyToClipboard = async (newValue: string): Promise<void> => {
    await navigator.clipboard.writeText(newValue)
    await _getClipboard()
  }

  return {
    clipboard: value,
    copyToClipboard,
  }
}

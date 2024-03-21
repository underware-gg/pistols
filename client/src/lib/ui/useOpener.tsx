import { useCallback, useState } from 'react'

/** @description used to control a Modal open state */ 
export function useOpener(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false)

  const open = useCallback((openState = true) => {
    setIsOpen(openState)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(!isOpen)
  }, [])

  return {
    open,
    close,
    toggle,
    isOpen,
  }
}

export type Opener = ReturnType<typeof useOpener>

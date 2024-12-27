import { useCallback, useState } from 'react'

/** @description used to control a Modal open state */
export function useOpener(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false)
  const [props, setProps] = useState<any>({})

  const open = useCallback((props: any = {}) => {
    setIsOpen(true)
    setProps(props)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setProps({})
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(!isOpen)
  }, [])

  return {
    open,
    close,
    toggle,
    isOpen,
    props,
  }
}

export type Opener = ReturnType<typeof useOpener>

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { emitter } from '@underware/pistols-sdk/dojo'

export interface ElementPopupNotificationRef {
  show: (targetRef: React.RefObject<HTMLElement>, text: string, icon?: string) => void
}

export const showElementPopupNotification = (targetRef: React.RefObject<HTMLElement>, text: string, icon?: string) => {
  emitter.emit('show_notification', { targetRef, text, icon })
}

const ElementPopupNotification = forwardRef<ElementPopupNotificationRef, {}>((props, ref) => {
  const { aspectHeight } = useGameAspect()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [text, setText] = useState('')
  const [icon, setIcon] = useState<string | undefined>()

  useImperativeHandle(ref, () => ({
    show: (targetRef: React.RefObject<HTMLElement>, showText: string, showIcon?: string) => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect()
        
        setPosition({
          top: rect.top - aspectHeight(6),
          left: rect.left + rect.width / 2
        })
        setText(showText)
        setIcon(showIcon)
        setIsVisible(true)
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setIsVisible(false)
        }, 2000)
      }
    }
  }), [aspectHeight])

  if (!isVisible) return null

  return (
    <div 
      className="CopyNotification"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {icon} {text}
    </div>
  )
})

ElementPopupNotification.displayName = 'ElementPopupNotification'

export default ElementPopupNotification 
import React, { useEffect, useState } from 'react'
import { useGameAspect } from '/src/hooks/useGameAspect'

interface ElementPopupNotificationProps {
  show: boolean
  targetRef: React.RefObject<HTMLElement>
  text: string
  icon: string
}

const ElementPopupNotification: React.FC<ElementPopupNotificationProps> = ({ 
  show, 
  targetRef, 
  text,
  icon
}) => {
  const { aspectHeight } = useGameAspect()
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (show && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - aspectHeight(6),
        left: rect.left + rect.width / 2
      })
    }
  }, [show, targetRef, aspectHeight])

  if (!show) return null

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
}

export default ElementPopupNotification 
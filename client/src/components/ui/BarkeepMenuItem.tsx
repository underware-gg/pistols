import React from 'react'
import { Image } from 'semantic-ui-react'
import { useGameAspect } from '/src/hooks/useGameAspect'

interface BarkeepMenuItemProps {
  id: string
  label: string
  icon?: string
  shouldShowIcon?: boolean
  onClick: () => void
  index: number
}

export const BarkeepMenuItem: React.FC<BarkeepMenuItemProps> = ({
  id,
  label,
  icon,
  shouldShowIcon = false,
  onClick,
  index,
}) => {
  const { aspectWidth } = useGameAspect()

  return (
    <div
      onClick={onClick}
      className='BarkeepMenuItemButton'
    >
      <span className='BarkeepMenuItemIndex'>
        {index}.
      </span>
      <span className='BarkeepMenuItemLabel'>
        {label}
      </span>
      {icon && shouldShowIcon && (
        <Image 
          src={icon} 
          style={{ 
            position: 'absolute',
            top: aspectWidth(2.5),
            right: aspectWidth(0.5),
            width: aspectWidth(3.2),
            height: aspectWidth(3.2),
            marginLeft: aspectWidth(1.2),
            marginTop: aspectWidth(-1.4),
            rotate: '10deg',
            transition: 'all 0.2s ease',
            filter: 'drop-shadow(0 2px 8px #FFD700) drop-shadow(0 0 8px #fff8dc) drop-shadow(0 0 4px #2d1a00)'
          }} 
        />
      )}
    </div>
  )
} 
import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { usePlayer, useRingsOfOwner } from '/src/stores/playerStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'

// Stamp types based on current implementation
export type StampType = 'Blocked' | 'Team' | 'Gold' | 'Silver' | 'Lead'

// Stamp sizes based on current CSS classes
export type StampSize = 'ProfileSmall' | 'ProfileLarge' | 'DuelSmall' | 'DuelProfile' | 'DuelLarge'

// Stamp positions based on current CSS classes
export type StampPosition = 'Left' | 'Right'

interface StampImageProps {
  playerAddress?: BigNumberish
  stampType?: StampType
  size: StampSize
  position: StampPosition
  className?: string
  style?: React.CSSProperties
  forceShow?: boolean
}

const getStampClass = (isBlocked: boolean, isTeamMember: boolean, topRingType: constants.RingType | null): StampType => {
  if (isBlocked) return 'Blocked'
  if (isTeamMember) return 'Team'
  if (topRingType === constants.RingType.GoldSignetRing) return 'Gold'
  if (topRingType === constants.RingType.SilverSignetRing) return 'Silver'
  if (topRingType === constants.RingType.LeadSignetRing) return 'Lead'
  return undefined
}

export const StampImage: React.FC<StampImageProps> = ({
  playerAddress,
  stampType,
  size,
  position,
  className = '',
  style = {},
  forceShow = false,
}) => {
  const { isBlocked, isTeamMember, activeSignetRing } = usePlayer(playerAddress)
  
  const hasStamp = useMemo(() => {
    if (forceShow || stampType) return true
    return isBlocked || isTeamMember || activeSignetRing !== null
  }, [forceShow, stampType, isBlocked, isTeamMember, activeSignetRing])
  
  const stampClass = useMemo(() => {
    if (stampType) return stampType
    return getStampClass(isBlocked, isTeamMember, activeSignetRing)
  }, [stampType, isBlocked, isTeamMember, activeSignetRing])
  
  const cssClasses = useMemo(() => {
    const classes = [
      'StampOverlay',
      position,
      size,
      stampClass,
      'NoMouse',
      'NoDrag',
      className
    ].filter(Boolean).join(' ')
    
    return classes
  }, [stampClass, size, position, className])
  
  const finalStyle = useMemo(() => ({
    position: 'absolute' as const,
    ...style,
  }), [style])

  if (!hasStamp) return null
  
  return (
    <div 
      className={cssClasses}
      style={finalStyle}
    />
  )
}

// Helper hook to check if a player has a stamp (useful for conditional rendering)
export const useHasStamp = (playerAddress: BigNumberish) => {
  const { isBlocked, isTeamMember, activeSignetRing } = usePlayer(playerAddress)
  
  return useMemo(() => {
    return isBlocked || isTeamMember || activeSignetRing !== null
  }, [isBlocked, isTeamMember, activeSignetRing])
}

// Helper hook to get stamp type for a player
export const useStampType = (playerAddress: BigNumberish): StampType | null => {
  const { isBlocked, isTeamMember, activeSignetRing } = usePlayer(playerAddress)
  
  return useMemo(() => {
    if (!isBlocked && !isTeamMember && activeSignetRing === null) return null
    return getStampClass(isBlocked, isTeamMember, activeSignetRing)
  }, [isBlocked, isTeamMember, activeSignetRing])
}

export default StampImage

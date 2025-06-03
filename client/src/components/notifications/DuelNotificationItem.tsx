import React, { useMemo, useEffect, useState } from 'react'
import { useNotifications, type Notification } from '/src/stores/notificationStore'
import { PlayerLink, ChallengeLink } from '/src/components/Links'
import { Image } from 'semantic-ui-react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuel } from '/src/hooks/useDuel'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'

interface DuelNotificationItemProps {
  notification: Notification
  onAction?: () => void
  className?: string
  style?: React.CSSProperties
  showRequiresUserAction?: boolean
  canShow?: boolean
  onShow?: () => void
}

export const DuelNotificationItem: React.FC<DuelNotificationItemProps> = ({
  notification,
  onAction,
  className = '',
  style = {},
  showRequiresUserAction = false,
  canShow = false,
  onShow
}) => {
  const { aspectWidth } = useGameAspect()
  const { duelId, requiresAction, state, type, timestamp } = notification
  const { challenge, turnA, turnB, completedStagesA, completedStagesB } = useDuel(duelId)
  const { isMyAccount: isChallenger } = useIsMyAccount(challenge?.duelistAddressA)
  const { isMyAccount: isChallenged } = useIsMyAccount(challenge?.duelistAddressB)
  const { markAsRead } = useNotifications()
  const [isHovered, setIsHovered] = useState(false)
  const { clientSeconds } = useClientTimestamp(true)

  const { title, message } = useMemo(() => {
    if (!challenge) return { 
      title: null, 
      message: null
    }

    const challengerAddress = challenge.duelistAddressA
    const challengedAddress = challenge.duelistAddressB
    const isOpponentTurnA = isChallenged && turnA
    const isOpponentTurnB = isChallenger && turnB
    const hasCommittedA = completedStagesA?.[0]
    const hasCommittedB = completedStagesB?.[0]
    const hasRevealedA = completedStagesA?.[1]
    const hasRevealedB = completedStagesB?.[1]

    switch (state) {
      case constants.ChallengeState.Awaiting:
        if (requiresAction && isChallenger) {
          return {
            title: 'Your Move - Commit Cards',
            message: <>It's your turn to commit your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /></>
          }
        }
        return {
          title: 'Waiting for Duel Acceptance',
          message: isChallenger 
            ? <>Waiting for <PlayerLink address={challengedAddress} /> to accept your <ChallengeLink duelId={duelId} /></>
            : <><PlayerLink address={challengerAddress} /> has challenged you to a <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.InProgress:
        // Handle commit phase
        if (!hasCommittedA || !hasCommittedB) {
          if (requiresAction) {
            return {
              title: 'Your Move - Commit Cards',
              message: <>It's your turn to commit your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /></>
            }
          } else if (isOpponentTurnA || isOpponentTurnB) {
            return {
              title: 'Waiting for Opponent',
              message: <>Waiting for <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /> to commit their moves in <ChallengeLink duelId={duelId} /></>
            }
          }
        }
        // Handle reveal phase
        if (hasCommittedA && hasCommittedB && (!hasRevealedA || !hasRevealedB)) {
          if (requiresAction) {
            return {
              title: 'Your Move - Reveal Cards',
              message: <>It's your turn to reveal your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /></>
            }
          } else if (isOpponentTurnA || isOpponentTurnB) {
            return {
              title: 'Waiting for Opponent',
              message: <>Waiting for <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /> to reveal their moves in <ChallengeLink duelId={duelId} /></>
            }
          }
        }
        // Fallback for other in-progress states
        return {
          title: 'Duel In Progress',
          message: isChallenger
            ? <><PlayerLink address={challengedAddress} /> has accepted your challenge in <ChallengeLink duelId={duelId} /></>
            : <>You've accepted <PlayerLink address={challengerAddress} />'s challenge in <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.Refused:
        return {
          title: 'Duel Refused',
          message: isChallenger
            ? <><PlayerLink address={challengedAddress} /> has refused your challenge in <ChallengeLink duelId={duelId} /></>
            : <>You've refused <PlayerLink address={challengerAddress} />'s challenge in <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.Withdrawn:
        return {
          title: 'Duel Withdrawn',
          message: isChallenger
            ? <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={challengedAddress} /> has been withdrawn</>
            : <> The <ChallengeLink duelId={duelId} /> from <PlayerLink address={challengerAddress} /> has been withdrawn</>
        }
      case constants.ChallengeState.Expired:
        return {
          title: 'Duel Expired',
          message: isChallenger
            ? <>Your challenge to <PlayerLink address={challengedAddress} /> in <ChallengeLink duelId={duelId} /> has expired</>
            : <>The challenge from <PlayerLink address={challengerAddress} /> in <ChallengeLink duelId={duelId} /> has expired</>
        }
      case constants.ChallengeState.Resolved:
        if (requiresAction) {
          return {
            title: 'Duel Ended - Action Required',
            message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /> has been resolved. Click to see the result!</>
          }
        }
        return {
          title: 'Duel Resolved',
          message: <>Your duel with <PlayerLink address={challengerAddress} /> in <ChallengeLink duelId={duelId} /> has been resolved</>
        }
      case constants.ChallengeState.Draw:
        if (requiresAction) {
          return {
            title: 'Duel Ended - Action Required',
            message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isChallenger ? challengedAddress : challengerAddress} /> has been resolved. Click to see the result!</>
          }
        }
        return {
          title: 'Duel Draw',
          message: <>Your duel with <PlayerLink address={challengerAddress} /> in <ChallengeLink duelId={duelId} /> ended in a draw</>
        }
      default:
        return {
          title: 'Duel Update',
          message: <>Duel <ChallengeLink duelId={duelId} /> state updated to {state}</>
        }
    }
  }, [challenge, state, isChallenger, isChallenged, duelId, turnA, turnB, completedStagesA, completedStagesB, requiresAction])

  const timeAgo = useMemo(() => {
    const secondsAgo = clientSeconds - timestamp
    if (secondsAgo < 60) return 'just now'
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
    return `${Math.floor(secondsAgo / 86400)}d ago`
  }, [clientSeconds, timestamp])

  useEffect(() => {
    if (canShow && onShow && challenge && notification) {
      if (!notification.isDisplayed && title && message) {
        onShow()
      }
    }
  }, [canShow, onShow, challenge, notification, title, message])

  const handleClick = (e: React.MouseEvent) => {
    if (onAction && duelId) {
      e.stopPropagation()
      onAction()
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (!notification.isRead && showRequiresUserAction) {
      markAsRead(notification.duelId)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const showActionIndicator = showRequiresUserAction && requiresAction
  const showReadIndicator = showRequiresUserAction && !notification.isRead

  return (
    <div 
      className={`DuelNotificationItem ${showActionIndicator ? 'RequiresAction' : ''}`}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showReadIndicator && (
        <Image 
          src='/images/ui/notification_exclamation.png'
          style={{ 
            position: 'absolute',
            top: aspectWidth(0.4),
            right: aspectWidth(0.4),
            width: aspectWidth(2.5),
            height: aspectWidth(2.5),
            opacity: isHovered ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      <div className='DuelNotificationTitle'>
        {title}
      </div>

      <div className='DuelNotificationDivider' />

      <div className='DuelNotificationMessage'>
        {message}
        <div className='DuelNotificationTimestamp'>
          {timeAgo}
        </div>
      </div>
    </div>
  )
} 
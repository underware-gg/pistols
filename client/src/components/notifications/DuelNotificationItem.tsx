import React, { useMemo, useEffect, useState } from 'react'
import { useNotifications, type Notification } from '/src/stores/notificationStore'
import { PlayerLink, ChallengeLink } from '/src/components/Links'
import { Image } from 'semantic-ui-react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { DuelStage, useDuel } from '/src/hooks/useDuel'
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
  const { isMyAccount: isMeA } = useIsMyAccount(challenge?.duelistAddressA)
  const { isMyAccount: isMeB } = useIsMyAccount(challenge?.duelistAddressB)
  const { markAsRead } = useNotifications()
  const [isHovered, setIsHovered] = useState(false)
  const { clientSeconds } = useClientTimestamp(true)

  const { title, message } = useMemo(() => {
    if (!challenge) return { 
      title: null, 
      message: null
    }

    if (!isMeA && !isMeB) return {
      title: null,
      message: null
    }

    const duelistAddressA = challenge.duelistAddressA
    const duelistAddressB = challenge.duelistAddressB
    const isOpponentTurn = (!isMeA && turnA) || (!isMeB && turnB)
    const hasCommittedA = completedStagesA?.[DuelStage.Round1Commit]
    const hasCommittedB = completedStagesB?.[DuelStage.Round1Commit]
    const hasRevealedA = completedStagesA?.[DuelStage.Round1Reveal]
    const hasRevealedB = completedStagesB?.[DuelStage.Round1Reveal]

    switch (state) {
      case constants.ChallengeState.Awaiting:
        if (requiresAction && isMeA) {
          return {
            title: 'Your Move - Commit Cards',
            message: <>It's your turn to commit your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={duelistAddressB} /></>
          }
        }
        return {
          title: 'Waiting for Duel Acceptance',
          message: isMeA 
            ? <>Waiting for <PlayerLink address={duelistAddressB} /> to accept your <ChallengeLink duelId={duelId} /></>
            : <><PlayerLink address={duelistAddressA} /> has challenged you to a <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.InProgress:
        // Handle commit phase
        if (!hasCommittedA || !hasCommittedB) {
          if (requiresAction) {
            return {
              title: 'Your Move - Commit Cards',
              message: <>It's your turn to commit your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /></>
            }
          } else if (isOpponentTurn) {
            return {
              title: 'Waiting for Opponent',
              message: <>Waiting for <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /> to commit their moves in <ChallengeLink duelId={duelId} /></>
            }
          }
        }
        // Handle reveal phase
        if (hasCommittedA && hasCommittedB && (!hasRevealedA || !hasRevealedB)) {
          if (requiresAction) {
            return {
              title: 'Your Move - Reveal Cards',
              message: <>It's your turn to reveal your moves in <ChallengeLink duelId={duelId} /> against <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /></>
            }
          } else if (isOpponentTurn) {
            return {
              title: 'Waiting for Opponent',
              message: <>Waiting for <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /> to reveal their moves in <ChallengeLink duelId={duelId} /></>
            }
          }
        }
        // Fallback for other in-progress states
        return {
          title: 'Duel In Progress',
          message: isMeA
            ? <><PlayerLink address={duelistAddressB} /> has accepted your <ChallengeLink duelId={duelId} /></>
            : <>You've accepted <PlayerLink address={duelistAddressA} />'s <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.Refused:
        return {
          title: 'Duel Refused',
          message: isMeA
            ? <><PlayerLink address={duelistAddressB} /> has refused your <ChallengeLink duelId={duelId} /></>
            : <>You've refused <PlayerLink address={duelistAddressA} />'s <ChallengeLink duelId={duelId} /></>
        }
      case constants.ChallengeState.Withdrawn:
        return {
          title: 'Duel Withdrawn',
          message: isMeA
            ? <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={duelistAddressB} /> has been withdrawn</>
            : <> The <ChallengeLink duelId={duelId} /> from <PlayerLink address={duelistAddressA} /> has been withdrawn</>
        }
      case constants.ChallengeState.Expired:
        return {
          title: 'Duel Expired',
          message: isMeA
            ? <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={duelistAddressB} /> has expired</>
            : <>The <ChallengeLink duelId={duelId} /> from <PlayerLink address={duelistAddressA} /> has expired</>
        }
      case constants.ChallengeState.Resolved:
        if (requiresAction) {
          return {
            title: 'Duel Ended - Action Required',
            message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /> has been resolved. Click to see the result!</>
          }
        }
        return {
          title: 'Duel Resolved',
          message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} />  has been resolved</>
        }
      case constants.ChallengeState.Draw:
        if (requiresAction) {
          return {
            title: 'Duel Ended - Action Required',
            message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /> has been resolved. Click to see the result!</>
          }
        }
        return {
          title: 'Duel Draw',
          message: <>Your <ChallengeLink duelId={duelId} /> with <PlayerLink address={isMeA ? duelistAddressB : duelistAddressA} /> ended in a draw</>
        }
      default:
        return {
          title: 'Duel Update',
          message: <><ChallengeLink duelId={duelId} /> state updated to {state}</>
        }
    }
  }, [challenge, state, isMeA, isMeB, duelId, turnA, turnB, completedStagesA, completedStagesB, requiresAction])

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
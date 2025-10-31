import React, { useState, useEffect, useMemo } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useConnectedController } from '@underware/pistols-sdk/dojo'
import { useElizaMessage } from '/src/utils/eliza'
import AnimatedText from '/src/components/ui/AnimatedText'
import { useNotifications } from '/src/stores/notificationStore'
import { DuelNotificationItem } from '/src/components/notifications/DuelNotificationItem'
import { BarkeepMenuItem } from '/src/components/ui/BarkeepMenuItem'
import { SceneName } from '/src/data/assets'
import DuelTutorialOverlay from '../ui/duel/DuelTutorialOverlay'
import { Opener } from '/src/hooks/useOpener'
import { useAccount } from '@starknet-react/core'

type ModalStage = 'intro' | 'menu' | 'notifications'

export default function BarkeepModal() {
  const { barkeepModalOpener } = usePistolsContext()
  const isOpen = useMemo(() => (barkeepModalOpener.isOpen), [barkeepModalOpener.isOpen])
  return <>{isOpen && <_BarkeepModal opener={barkeepModalOpener} />}</>
}

function _BarkeepModal({ opener }: { opener: Opener }) {  
  const { dispatchSetScene } = usePistolsScene()
  const { tutorialOpener, tavernRingsOpener, dispatchSelectDuel } = usePistolsContext()
  
  const { sortedNotifications, hasUnreadNotifications, markAllAsRead } = useNotifications()
  const { address } = useAccount()

  const [stage, setStage] = useState<ModalStage>(opener.props.initialStage ?? 'intro')
  const [displayText, setDisplayText] = useState('')

  // const { username, name } = useConnectedController()
  // const { sendMessage, responses } = useElizaMessage(username, name)

  const openNotifications = () => {
    setStage('notifications')
    setDisplayText(
      sortedNotifications.length > 0
        ? 'Here ya go, ya filthy animal. Don\'t make me regret this...'
        : 'Go play some duels, you scum, before bothering me with your empty woes!'
    )
  }

  useEffect(() => {
    if (opener.isOpen) {
      if (opener.props.initialStage === 'notifications') {
        openNotifications()
      } else {
        const introTexts = [
          'What do you want, you filthy mortal?',
          'Are ye here for a drink or something else?',
          'Another weakling looking for trouble...',
          'Make it quick, I\'ve got better things to do than serve the likes of you.'
        ]
        const randomText = introTexts[Math.floor(Math.random() * introTexts.length)]
        setTimeout(() => {
          setDisplayText(randomText)
          setStage('menu')
        }, 100)
      }
    } else {
      setDisplayText('')
      setStage('intro')
    }
  }, [opener.isOpen, opener.props.initialStage])

  if (!opener.isOpen) return null

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag'>
      <div className={`TempBarkeepTalkBalloon Relative ${stage === 'notifications' ? 'Notifications' : 'Menu'} ${ stage === 'notifications' && sortedNotifications.length === 0 ? 'NoNotifications' : ''}`}>
        <div className='BarkeepModalContainer'>
          <AnimatedText text={displayText} delayPerCharacter={30} />
          
          {stage === 'menu' && (
            <div className='BarkeepMenuContainer'>
              <BarkeepMenuItem
                id="notifications"
                label="Show me my notifications"
                icon="/images/ui/notification_exclamation.png"
                shouldShowIcon={hasUnreadNotifications}
                onClick={() => {
                  openNotifications()
                }}
                index={1}
              />
              <BarkeepMenuItem
                id="card packs"
                label="I want to get more duelists"
                onClick={() => {
                  dispatchSetScene(SceneName.CardPacks)
                }}
                index={2}
              />
              <BarkeepMenuItem
                id="tutorial"
                label="I want to learn how to duel"
                onClick={() => {
                  tutorialOpener.open()
                }}
                index={3}
              />
              <BarkeepMenuItem
                id="rings"
                label="Got anything for me?"
                onClick={() => {
                  tavernRingsOpener.open()
                  opener.close()
                }}
                index={4}
              />
            </div>
          )}

          {stage === 'notifications' && sortedNotifications.length > 0 && (
            <div className="NotificationScrollContainer">
              {sortedNotifications.map((notification, index) => (
                <div 
                  key={notification.duelId.toString()}
                  className="NotificationItemContainer"
                >
                  <DuelNotificationItem
                    notifications={[notification]}
                    onAction={() => {
                      dispatchSelectDuel(notification.duelId)
                    }}
                    style={{animationDelay: `${index * 0.1}s`}}
                    showRequiresUserAction={true}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="BarkeepButtonContainer">
            {hasUnreadNotifications && stage === 'notifications' && sortedNotifications.length > 0 && (
              <button
                onClick={() => {
                  markAllAsRead(address)
                }}
                className="BarkeepDialogButton"
              >
                Mark all as read
              </button>
            )}
            
            <button
              onClick={() => {
                if (stage === 'notifications') {
                  setStage('menu')
                  setDisplayText('What else do you want?')
                } else {
                  opener.close()
                }
              }}
              className="BarkeepDialogButton"
            >
              {stage === 'notifications' ? 'Back' : 'Exit'}
            </button>
          </div>
        </div>
      </div>

      <DuelTutorialOverlay opener={tutorialOpener} />
    </div>
  )
}

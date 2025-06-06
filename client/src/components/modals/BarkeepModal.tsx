import React, { useState, useEffect } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useConnectedController } from '@underware/pistols-sdk/dojo'
import { useElizaMessage } from '/src/utils/eliza'
import AnimatedText from '/src/components/ui/AnimatedText'
import { useNotifications } from '/src/stores/notificationStore'
import { DuelNotificationItem } from '/src/components/notifications/DuelNotificationItem'
import { BarkeepMenuItem } from '/src/components/ui/BarkeepMenuItem'
import { SceneName } from '/src/data/assets'
import DuelTutorialOverlay from '../ui/duel/DuelTutorialOverlay'

type ModalStage = 'intro' | 'menu' | 'notifications'

interface BarkeepModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialStage?: ModalStage
}

export default function BarkeepModal({ open, setOpen, initialStage = 'intro' }: BarkeepModalProps) {  
  const { dispatchSetScene } = usePistolsScene()
  const { tutorialOpener, dispatchSelectDuel } = usePistolsContext()
  
  const { notifications, hasUnreadNotifications } = useNotifications()
  
  const [stage, setStage] = useState<ModalStage>(initialStage)
  const [displayText, setDisplayText] = useState('')

  // const { username, name } = useConnectedController()
  // const { sendMessage, responses } = useElizaMessage(username, name)

  useEffect(() => {
    if (open) {
      if (initialStage === 'notifications') {
        setStage('notifications')
        setDisplayText('Here ya go, ya filthy animal. Don\'t make me regret this...')
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
  }, [open, initialStage])

  if (!open) return null

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag'>
      <div className='TempBarkeepTalkBalloon Relative'>
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
                  setStage('notifications')
                  setDisplayText('Here ya go, ya filthy animal. Don\'t make me regret this...')
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
            </div>
          )}

          {stage === 'notifications' && (
            <div className="NotificationScrollContainer">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.duelId.toString()}
                  className="NotificationItemContainer"
                >
                  <DuelNotificationItem
                    notification={notification}
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
          
          <button
            onClick={() => {
              if (stage === 'notifications') {
                setStage('menu')
                setDisplayText('What else do you want?')
              } else {
                setOpen(false)
              }
            }}
            className="BarkeepDialogButton"
          >
            {stage === 'notifications' ? 'Back' : 'Exit'}
          </button>
        </div>
      </div>

      <DuelTutorialOverlay opener={tutorialOpener} />
    </div>
  )
}

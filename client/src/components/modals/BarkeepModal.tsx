import React, { useState, useEffect } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useConnectedController } from '@underware/pistols-sdk/dojo'
import { useElizaMessage } from '/src/utils/eliza'
import AnimatedText from '/src/components/ui/AnimatedText'

export default function BarkeepModal({ open, setOpen }) {
  const { dispatchSetScene } = usePistolsScene()
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const { username, name } = useConnectedController()
  const { sendMessage, responses } = useElizaMessage(username, name)

  useEffect(() => {
    if (responses && responses.length > 0) {
      setDisplayText(responses[0])
    }
  }, [responses])

  useEffect(() => {
    setTimeout(() => {
      if (open) {
        setDisplayText('Get lost, mortal. I\'m not serving weaklings today. Come back when you\'ve got some real guts... or never.')
      } else {
        setDisplayText('')
      }
    }, 200)
  }, [open])

  if (!open) return null

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag'>
      <div className='TempBarkeepTalkBalloon Relative'>
        <AnimatedText text={displayText} delayPerCharacter={30} />
      </div>

      <div className='DialogOptionsContainer'>
        <div className='DialogGradient' />
        <div className='DialogDivider' />
        <div className='DialogOptionsWrapper YesMouse'>
          {/* <div className='DialogOptionsTitle'>Choose what to do:</div> */}
          {/* <input
              type="text"
              className="DialogInput DialogInput"
              placeholder="Type your message..."
              disabled={isAnimating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAnimating) {
                  sendMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            /> */}
            <button
              onClick={() => setOpen(false)}
              className="DialogButton"
            >
              Exit
            </button>
        </div>
      </div>
    </div>
  )
}

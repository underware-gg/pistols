import React, { useState, useEffect } from 'react'
import { Image } from 'semantic-ui-react'
import { SceneName, usePistolsScene } from '../../hooks/PistolsContext'
import { useControllerUser } from '@/lib/dojo/hooks/useController'
import { useElizaMessage } from '@/pistols/utils/eliza'

export default function BarkeepModal({ open, setOpen }) {
  const { dispatchSetScene } = usePistolsScene()
  const [currentDialog, setCurrentDialog] = useState('initial')
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const { username } = useControllerUser()
  const { sendMessage, responses } = useElizaMessage("Fortuna")

  useEffect(() => {
    if (responses && responses.length > 0) {
      animateText(responses[0]) // Animate the first response string
    }
  }, [responses])

  useEffect(() => {
    if (open) {
      animateText('Looking for trouble? Or just a drink?')
    }
  }, [open])

  const animateText = async (text) => {
    if (!text) return // Guard against undefined/null text
    
    setIsAnimating(true)
    setDisplayText('')
    
    const characters = text.split('')
    for (const char of characters) {
      await new Promise(resolve => setTimeout(resolve, 30))
      setDisplayText(prev => prev + char)
    }
    
    setIsAnimating(false)
  }

  if (!open) return null

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag'>
      <div className='TempBarkeepTalkBalloon Relative'>
        {displayText}
      </div>

      <div className='DialogOptionsContainer'>
        <div className='DialogGradient' />
        <div className='DialogDivider' />
        <div className='DialogOptionsWrapper YesMouse'>
          {/* <div className='DialogOptionsTitle'>Choose what to do:</div> */}
          
          <input
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
            />
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

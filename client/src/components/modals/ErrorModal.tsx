import React, { useEffect, useState, useRef } from 'react'
import { Modal, Icon, Grid } from 'semantic-ui-react'
import { useDojoEmitterEvent } from '@underware/pistols-sdk/dojo'
import { ActionButton } from '/src/components/ui/Buttons'
import BugReportModal from '/src/components/modals/BugReportModal'
import { useGameAspect } from '/src/hooks/useGameAspect'
import ElementPopupNotification from '../ui/ElementPopupNotification'
import { usePistolsContext } from '/src/hooks/PistolsContext'


const extractSimplifiedError = (errorText: string): string => {
  if (!errorText) return 'Unknown error'
  
  const failureReasonMatch = errorText.match(/failure reason:\s*\((.*)\)\./is)
  if (failureReasonMatch) {
    const failureContent = failureReasonMatch[1]
    
    const parts = failureContent.split(/\),\s*/)
    
    if (parts.length >= 3) {
      let thirdElement = parts[2].trim()
      
      if (!thirdElement.endsWith(')')) {
        thirdElement += ')'
      }
      
      const quotedMatch = thirdElement.match(/\('([^']+)'\)/i)
      
      if (quotedMatch && quotedMatch[1]) {
        const extracted = quotedMatch[1].trim()
        if (extracted && extracted.length > 0) {
          return extracted
        }
      }
    }
  }
  
  const lines = errorText.split('\n')
  const firstLine = lines[0]?.trim()
  if (firstLine && firstLine.length < 100) {
    return firstLine
  }
  
  return 'Transaction failed - see details for more info'
}

const Row = Grid.Row
const Col = Grid.Column

export default function ErrorModal() {
  const { aspectWidth } = useGameAspect()
  const { errorModalOpener, bugReportOpener } = usePistolsContext()

  const [isExpanded, setIsExpanded] = useState(false)
  const [copyNotification, setCopyNotification] = useState(false)

  const copyButtonRef = useRef<HTMLDivElement>(null)

  const { value: eventData, timestamp } = useDojoEmitterEvent('transaction_error', null)
  
  useEffect(() => {
    if (eventData) {
      errorModalOpener.open()
      setIsExpanded(false)
    }
  }, [eventData, timestamp])

  const handleClose = () => {
    errorModalOpener.close()
    setIsExpanded(false)
  }

  const handleReportClick = () => {
    bugReportOpener.open()
  }

  const simplifiedError = extractSimplifiedError(eventData?.reason)
  const fullError = eventData?.reason || ''

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  return (
    <>
      <Modal
        size={null}
        onClose={handleClose}
        open={errorModalOpener.isOpen}
      >
        <Modal.Header>
          Transaction {eventData?.status}
        </Modal.Header>
        
        <Modal.Content>
          <div className={`ErrorAccordion ${isExpanded ? 'Expanded' : ''}`}>
            <div 
              className={`ErrorHeader ${isExpanded ? 'Expanded' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <h2 className="Important" style={{ margin: 0, flex: 1 }}>
                {simplifiedError}
              </h2>
              <Icon 
                name="chevron down"
                className={`ErrorArrow ${isExpanded ? 'Expanded' : ''}`}
              />
            </div>

            <div className={`ErrorContent ${isExpanded ? 'Expanded' : ''}`}>
              <div className="ErrorDetails">
                <div className="CopyButtonWrapper">
                  <div 
                    ref={copyButtonRef}
                    className="CopyButton"
                    onClick={() => copyToClipboard(fullError)}
                  >
                    <Icon name="copy" style={{ marginRight: aspectWidth(0.15) }} />
                    <span style={{ fontSize: aspectWidth(0.8), fontWeight: '500' }}>Copy</span>
                  </div>
                  </div>
                  
                  <span className="TechnicalLabel">Technical Details</span>
                <div className="ErrorText Code Negative">
                  {fullError}
                </div>
              </div>
            </div>
          </div>


        </Modal.Content>
        
        <Modal.Actions className='NoPadding'>
          <Grid className='FillParent Padded' textAlign='center'>
            <Row columns='equal'>
              <Col>
                <ActionButton
                  large
                  fill
                  label='Close'
                  onClick={handleClose}
                />
              </Col>
              <Col>
                <ActionButton
                  large
                  fill
                  important
                  label='Report to Us'
                  onClick={handleReportClick}
                />
              </Col>
            </Row>
          </Grid>
        </Modal.Actions>
      </Modal>

      <ElementPopupNotification show={copyNotification} targetRef={copyButtonRef} text="Copied to clipboard!" icon="📋" />

      <BugReportModal
        opener={bugReportOpener}
        initialError={fullError}
        initialTitle={simplifiedError}
      />
    </>
  )
}

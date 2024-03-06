import React, { useEffect, useState } from 'react'
import { Modal } from 'semantic-ui-react'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { ActionButton } from '@/pistols/components/ui/Buttons'

export default function ErrorModal() {
  const [isOpen, setIsOpen] = useState(null)

  const eventData = useGameEvent('transaction_error', null)
  useEffect(() => {
    if (eventData) {
      setIsOpen(true)
    }
  }, [eventData])

  return (
    <Modal
      size={null}
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header>
        Transaction {eventData?.status}
      </Modal.Header>
      <Modal.Content className='Code Negative'>
        {eventData?.reason}
      </Modal.Content>
      <Modal.Actions>
        <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
      </Modal.Actions>
    </Modal>
  )
}

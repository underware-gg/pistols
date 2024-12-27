import React, { useEffect, useState } from 'react'
import { Modal } from 'semantic-ui-react'
import { useDojoEmitterEvent } from '@underware_gg/pistols-sdk/dojo'
import { ActionButton } from '/src/components/ui/Buttons'

export default function ErrorModal() {
  const [isOpen, setIsOpen] = useState(null)

  const { value: eventData, timestamp } = useDojoEmitterEvent('transaction_error', null)
  useEffect(() => {
    if (eventData) {
      setIsOpen(true)
    }
  }, [eventData, timestamp])

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
      <Modal.Actions className='NoPadding'>
        <ActionButton large fill label='Close' onClick={() => setIsOpen(false)} />
      </Modal.Actions>
    </Modal>
  )
}

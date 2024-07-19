import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Modal, Icon } from 'semantic-ui-react'
import { useSettings } from '../hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePact } from '@/pistols/hooks/usePact'
import { useDuelistOwner } from '@/pistols/hooks/useTokenDuelist'
import { useIsMyDuelist, useIsYou } from '@/pistols/hooks/useIsMyDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTableByDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { IconClick } from '@/lib/ui/Icons'
import { Opener } from '@/lib/ui/useOpener'
import { useMounted } from '@/lib/utils/hooks/useMounted'

const Row = Grid.Row
const Col = Grid.Column

export default function AnonModal({
  opener,
}: {
  opener: Opener
}) {
  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

  //
  // Select
  const [walletAddress, setWalletAddres] = useState('')
  useEffect(() => {
    if (opener.isOpen) setWalletAddres('')
  }, [opener.isOpen])


  const { dispatchDuelistId, tableId } = useSettings()
  const hasPact = false


  return (
    <Modal
      size={'small'}
      // dimmer='inverted'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen}
    >
      <Modal.Header>
        <Grid>
          <Row columns={'equal'}>
            <Col textAlign='left'>
              Challenge a Wallet
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image className='Relative'>
        <ProfilePic profilePic={0} duelistId={0} anon />
        <Modal.Description className='FillParent'>
          {/* <div className='DuelistModalDescription'>
            <ProfileDescription duelistId={selectedDuelistId} tableId={tableId} displayBalance displayStats />
            <div className='Spacer10' />
            <div className='TableInModal'>
              <ChallengeTableByDuelist duelistId={selectedDuelistId} compact tableId={tableId} />
            </div>
          </div> */}
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton fill disabled={!hasPact} label='Challenge for a Duel!' onClick={() => dispatchDuelistId(walletAddress)} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

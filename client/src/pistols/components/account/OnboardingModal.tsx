import React, { useCallback, useEffect } from 'react'
import { Modal, Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useCanMintDuelist, useDuelistBalanceOf, useDuelistIndexOfOwner, useDuelistOfOwnerByIndex } from '@/pistols/hooks/useTokenDuelist'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { OnboardingProfile } from '@/pistols/components/account/OnboardingProfile'
import { AddressShort } from '@/lib/ui/AddressShort'
import { Opener } from '@/lib/ui/useOpener'

const Row = Grid.Row
const Col = Grid.Column

export default function OnboardingModal({
  opener,
}: {
  opener: Opener
}) {
  const { address } = useAccount()
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistIndex } = useDuelistIndexOfOwner(address, duelistId)
  const { duelistId: prevDuelistId } = useDuelistOfOwnerByIndex(address, duelistIndex - 1)
  const { duelistId: nextDuelistId } = useDuelistOfOwnerByIndex(address, duelistIndex + 1)

  // const { accountMenuKey, accountMenuItems, dispatchSetAccountMenu } = usePistolsContext()

  useEffect(() => {
    if (opener.isOpen) {
      // dispatchSetAccountMenu(AccountMenuKey.Profile)
    }
  }, [opener.isOpen])

  const _deployNew = () => {
    dispatchDuelistId(0n)
    // dispatchSetAccountMenu(AccountMenuKey.Profile)
  }

  // watch new mints
  const { canMint } = useCanMintDuelist(address)
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { duelistId: lastDuelistId } = useDuelistOfOwnerByIndex(address, duelistBalance - 1)
  useEffect(() => {
    if (lastDuelistId) {
      dispatchDuelistId(lastDuelistId)
    }
  }, [lastDuelistId])

  const canGoPrev = Boolean(prevDuelistId)
  const canGoNext = Boolean(nextDuelistId)
  const gotoPrevAccount = useCallback(() => (canGoPrev ? dispatchDuelistId(prevDuelistId) : null), [canGoPrev, dispatchDuelistId])
  const gotoNextAccount = useCallback(() => (canGoNext ? dispatchDuelistId(nextDuelistId) : null), [canGoNext, dispatchDuelistId])

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={11} textAlign='left'>
              Duelist
              #{duelistId ? Number(duelistId) : '?'}
            </Col>
            <Col width={5} textAlign='right'>
              <AddressShort address={address} ifExists />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>

      <Modal.Content className='ModalText OnboardingModal'>
        <OnboardingProfile />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Deploy New' disabled={!canMint} onClick={() => _deployNew()} />
            </Col>
            <Col>
              <ActionButton fill label='Previous' disabled={!canGoPrev} onClick={() => gotoPrevAccount()} />
            </Col>
            <Col>
              <ActionButton fill label='Next' disabled={!canGoNext} onClick={() => gotoNextAccount()} />
            </Col>
            <Col>
              <ActionButton important fill disabled={!duelistId} label={'Duel!'} onClick={() => opener.close()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

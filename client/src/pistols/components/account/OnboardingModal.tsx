import React, { useCallback, useEffect } from 'react'
import { Modal, Tab, TabPane, Grid, Menu } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { IconChecked, IconClick, IconWarning } from '@/lib/ui/Icons'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
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
  const { dispatchDuelistId } = useSettings()

  const { accountMenuKey, accountMenuItems, accountIndex, dispatchSetAccountMenu, dispatchSetAccountIndex} = usePistolsContext()
  const tabIndex = accountMenuItems.findIndex(k => (k == accountMenuKey))

  const { name } = useDuelist(address)
  const isProfiled = Boolean(name)

  useEffect(() => {
    if (opener.isOpen) {
      dispatchSetAccountMenu(AccountMenuKey.Profile)
    }
  }, [opener.isOpen])

  const _deployNew = () => {
    dispatchDuelistId(0n)
    dispatchSetAccountIndex(nextAccountIndex)
    dispatchSetAccountMenu(AccountMenuKey.Profile)
  }

  const canGoPrev = (accountIndex > 1)
  const canGoNext = (accountIndex < nextAccountIndex - 1)
  const gotoPrevAccount = useCallback(() => (canGoPrev ? dispatchSetAccountIndex(accountIndex - 1) : null), [canGoPrev, dispatchSetAccountIndex])
  const gotoNextAccount = useCallback(() => (canGoNext ? dispatchSetAccountIndex(accountIndex + 1) : null), [canGoNext, dispatchSetAccountIndex])

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
              {' '}
              <IconClick important name='angle double left' size='small' disabled={!canGoPrev} onClick={() => gotoPrevAccount()} />
              {' '}
              #{accountIndex}
              {' '}
              <IconClick important name='angle double right' size='small' disabled={!canGoNext} onClick={() => gotoNextAccount()} />
            </Col>
            <Col width={5} textAlign='right'>
              <AddressShort address={address} ifExists />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>

      <Modal.Content className='ModalText OnboardingModal'>
        <Tab activeIndex={tabIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={[
          {
            menuItem: (
              <Menu.Item key='Profile' onClick={() => dispatchSetAccountMenu(AccountMenuKey.Profile)}>
                Profile&nbsp;{isProfiled ? <IconChecked /> : <IconWarning />}
              </Menu.Item>
            ),
            render: () => (
              <TabPane attached className='NoPadding'>
                <OnboardingProfile />
              </TabPane>
            )
          },
        ]} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Deploy New' onClick={() => _deployNew()} />
            </Col>
            <Col></Col>
            {/* <Col>
              <ActionButton fill label='Previous' disabled={!canGoPrev} onClick={() => gotoPrevAccount()} />
            </Col> */}
            {/* <Col>
              <ActionButton fill label='Next' disabled={!canGoNext} onClick={() => gotoNextAccount()} />
            </Col> */}
            <Col>
              <ActionButton important fill disabled={!_canContinue[accountMenuKey]} label={_nextLabel[accountMenuKey]} onClick={() => _continue()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

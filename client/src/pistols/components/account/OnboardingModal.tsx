import React, { useCallback, useEffect } from 'react'
import { Modal, Tab, TabPane, Grid, Menu } from 'semantic-ui-react'
import { useBurnerAccount, useBurnerDeployment, useBurners } from '@/lib/dojo/hooks/useBurnerAccount'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { IconChecked, IconClick, IconWarning } from '@/lib/ui/Icons'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { OnboardingDeploy } from '@/pistols/components/account/OnboardingDeploy'
import { OnboardingFund } from '@/pistols/components/account/OnboardingFund'
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
  const { masterAccount } = useDojoAccount()
  const { nextAccountIndex } = useBurners(masterAccount.address)

  const { accountMenuKey, accountMenuItems, accountIndex, dispatchSetAccountMenu, dispatchSetAccountIndex} = usePistolsContext()
  const tabIndex = accountMenuItems.findIndex(k => (k == accountMenuKey))

  const { isImported, isFunded, address } = useBurnerAccount(accountIndex)
  const { isDeployed } = useBurnerDeployment(address)
  const isGoodToUse = (isDeployed && isImported)

  const { name } = useDuelist(address)
  const isProfiled = Boolean(name)

  useEffect(() => {
    if (opener.isOpen) {
      dispatchSetAccountMenu(
        !isGoodToUse ? AccountMenuKey.Deploy
          : !isFunded ? AccountMenuKey.Fund
            : AccountMenuKey.Profile
      )
    }
  }, [opener.isOpen])

  const _canContinue = {
    [AccountMenuKey.Deploy]: isImported,
    [AccountMenuKey.Fund]: isImported,
    [AccountMenuKey.Profile]: isProfiled,
  }
  const _nextLabel = {
    [AccountMenuKey.Deploy]: 'Fund...',
    [AccountMenuKey.Fund]: 'Profile...',
    [AccountMenuKey.Profile]: 'Done!',
  }

  const _continue = () => {
    if (accountMenuKey == AccountMenuKey.Deploy) dispatchSetAccountMenu(AccountMenuKey.Fund)
    else if (accountMenuKey == AccountMenuKey.Fund) dispatchSetAccountMenu(AccountMenuKey.Profile)
    else opener.close()
  }

  const _deployNew = () => {
    dispatchSetAccountIndex(nextAccountIndex)
    dispatchSetAccountMenu(AccountMenuKey.Deploy)
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
              <Menu.Item key='Deploy' onClick={() => dispatchSetAccountMenu(AccountMenuKey.Deploy)}>
                Deploy&nbsp;{isImported ? <IconChecked /> : <IconWarning />}
              </Menu.Item>
            ),
            render: () => (
              <TabPane attached className='NoPadding'>
                <OnboardingDeploy />
              </TabPane>
            )
          },
          {
            menuItem: (
              <Menu.Item key='Fund' onClick={() => dispatchSetAccountMenu(AccountMenuKey.Fund)}>
                Fund&nbsp;{isFunded ? <IconChecked /> : <IconWarning />}
              </Menu.Item>
            ),
            render: () => (
              <TabPane attached className='NoPadding'>
                <OnboardingFund disabled={!isGoodToUse} />
              </TabPane>
            )
          },
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

import React, { useEffect } from 'react'
import { Modal, Tab, TabPane, Grid, Menu } from 'semantic-ui-react'
import { useBurnerAccount } from '@/lib/wallet/useBurnerAccount'
import { IconChecked, IconWarning } from '@/lib/ui/Icons'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { OnboardingDeploy } from '@/pistols/components/account/OnboardingDeploy'
import { OnboardingFund } from '@/pistols/components/account/OnboardingFund'
import { OnboardingProfile } from '@/pistols/components/account/OnboardingProfile'
import { Opener } from '@/lib/ui/useOpener'
import { AddressShort } from '@/lib/ui/AddressShort'

const Row = Grid.Row
const Col = Grid.Column

export default function OnboardingModal({
  opener,
}: {
  opener: Opener
}) {
  const { accountMenuKey, accountMenuItems, accountIndex, dispatchSetAccountMenu } = usePistolsContext()
  const tabIndex = accountMenuItems.findIndex(k => (k == accountMenuKey))

  const { isDeployed, isImported, isFunded, isProfiled, address } = useBurnerAccount(accountIndex)

  useEffect(() => {
    if (opener.isOpen) {
      dispatchSetAccountMenu(
        (!isDeployed || !isImported) ? AccountMenuKey.Deploy
          : !isFunded ? AccountMenuKey.Fund
            : AccountMenuKey.Profile
      )
    }
  }, [opener.isOpen])

  const _canContinue = {
    [AccountMenuKey.Deploy]: isImported,
    [AccountMenuKey.Fund]: true,
    [AccountMenuKey.Profile]: isProfiled,
  }
  const _nextLabel = {
    [AccountMenuKey.Deploy]: 'Fund...',
    [AccountMenuKey.Fund]: 'Profile...',
    [AccountMenuKey.Profile]: 'Duel!',
  }

  const _continue = () => {
    if (accountMenuKey == AccountMenuKey.Deploy) dispatchSetAccountMenu(AccountMenuKey.Fund)
    else if (accountMenuKey == AccountMenuKey.Fund) dispatchSetAccountMenu(AccountMenuKey.Profile)
    else opener.close()
  }

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={10} textAlign='left'>
              Duelist Account #{accountIndex}
            </Col>
            <Col width={6} textAlign='right'>
              <AddressShort address={address} />
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
                <OnboardingFund isDeployed={isDeployed} />
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
              <ActionButton fill disabled={true} label='Deploy New' onClick={() => { }} />
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>
            <Col>
              <ActionButton attention fill disabled={!_canContinue[accountMenuKey]} label={_nextLabel[accountMenuKey]} onClick={() => _continue()} />
            </Col>

          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

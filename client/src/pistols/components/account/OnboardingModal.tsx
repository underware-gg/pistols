import React, { useMemo } from 'react'
import { Modal, Tab, TabPane, Grid, Icon, Menu } from 'semantic-ui-react'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { OnboardingDeploy } from '@/pistols/components/account/OnboardingDeploy'
import { OnboardingFund } from '@/pistols/components/account/OnboardingFund'
import { OnboardingProfile } from '@/pistols/components/account/OnboardingProfile'
import { IconChecked, IconWarning } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export default function OnboardingModal({
  opener,
}: {
  opener: Opener
}) {
  const { accountMenuKey, accountMenuItems, accountIndex, dispatchSetAccountMenu } = usePistolsContext()
  const tabIndex = accountMenuItems.findIndex(k => (k == accountMenuKey))

  const isDeployed = true
  const isFunded = false
  const isProfiled = false

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        Duelist Account #{accountIndex}
      </Modal.Header>

      <Modal.Content className='ModalText OnboardingModal'>
        <Tab activeIndex={tabIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={[
          {
            menuItem: (
              <Menu.Item key='Deploy' onClick={() => dispatchSetAccountMenu(AccountMenuKey.Deploy)}>
                Deploy&nbsp;{isDeployed ? <IconChecked /> : <IconWarning />}
              </Menu.Item>
            ),
            render: () => (
              <TabPane attached>
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
              <TabPane attached>
                <OnboardingFund />
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
              <TabPane attached>
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
              <ActionButton fill label='Deploy / Restore' onClick={() => { }} />
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>

          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}


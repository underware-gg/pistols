import React, { useMemo } from 'react'
import { Grid, Icon, Modal } from 'semantic-ui-react'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { OnboardingDeploy } from '@/pistols/components/account/OnboardingDeploy'
import { OnboardingFund } from '@/pistols/components/account/OnboardingFund'
import { OnboardingProfile } from '@/pistols/components/account/OnboardingProfile'

const Row = Grid.Row
const Col = Grid.Column

export default function OnboardingModal({
  opener,
}: {
  opener: Opener
}) {
  const { accountMenuKey } = usePistolsContext()

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='small'
    >
      <Modal.Header>
        <Grid className='FillParent NoPadding'>
          <Row columns='equal' textAlign='center'>
            <PhaseTitle label='Deploy' phase={AccountMenuKey.Deploy} checked={true} />
            <PhaseTitle label='Fund' phase={AccountMenuKey.Fund} checked={false} />
            <PhaseTitle label='Profile' phase={AccountMenuKey.Profile} checked={false} />
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content className='ModalText OnboardingModal'>
        {accountMenuKey == AccountMenuKey.Deploy && <OnboardingDeploy />}
        {accountMenuKey == AccountMenuKey.Fund && <OnboardingFund />}
        {accountMenuKey == AccountMenuKey.Profile && <OnboardingProfile />}
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

function PhaseTitle({
  label,
  phase,
  checked = false,
}) {
  const { accountMenuKey, dispatchSetAccountMenu } = usePistolsContext()
  const disabled = useMemo(() => (accountMenuKey != phase), [accountMenuKey])
  let classNames = ['Anchor']
  if (disabled) classNames.push('Inactive')
  return (
    <Col>
      <span className={classNames.join(' ')} onClick={() => dispatchSetAccountMenu(phase)}>
        {label}
        {' '}
        {checked && <Icon name='check' color='green' />}
        {!checked && <Icon name='warning' color='orange' />}
      </span>
    </Col>
  )
}


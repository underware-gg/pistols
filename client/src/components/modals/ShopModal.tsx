import React, { useEffect, useState } from 'react'
import { Modal, Grid, Image } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'
import { useCalcFeePack, useCanPurchase } from '/src/hooks/usePistolsContractCalls'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { SceneName } from '/src/data/assets'
import { Opener } from '/src/hooks/useOpener'
import { Divider } from '/src/components/ui/Divider'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistEditModal({
  opener,
}: {
  opener: Opener
}) {
  const { packType } = opener.props

  const { account, address } = useAccount()

  // Detect new mints
  const { duelistIds } = useDuelistsOfPlayer()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchDuelistId } = useSettings()
  const [duelistCountBeforeMint, setDuelistCountBeforeMint] = useState<number>(null)

  useEffect(() => {
    // minted new! go to Game...
    if (opener.isOpen &&
      duelistCountBeforeMint != null &&
      duelistCountBeforeMint != duelistIds.length
    ) {
      dispatchDuelistId(duelistIds.at(duelistCountBeforeMint))
      dispatchSetScene(SceneName.Profile)
      opener.close()
    }
  }, [duelistCountBeforeMint, duelistIds.length])

  const { purchase } = useDojoSystemCalls()
  const { canPurchase } = useCanPurchase(packType)
  const { fee } = useCalcFeePack(packType)

  const canSubmit = (account && canPurchase && duelistCountBeforeMint != null)

  const _purchase = () => {
    if (canSubmit) {
      setDuelistCountBeforeMint(duelistIds.length ?? 0)
      purchase(account, packType)
    }
  }

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        Purchase
      </Modal.Header>

      <Modal.Content className='ModalText DuelistEditModal'>
        <Grid className='OnboardingProfile'>
          <Row textAlign='center' verticalAlign='top'>
            <Col width={5} textAlign='left' className='PaddedSides'>
              <Image src={`/tokens/${packType}.png`} />
            </Col>
            <Col width={9} textAlign='left' className='PaddedSides'>

              <h1>{packType}</h1>

              <Divider />

              <FeesToPay value={0} fee={fee} prefixed />
            </Col>
          </Row>
        </Grid>
      </Modal.Content>

      <Modal.Actions className='NoPadding'>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <BalanceRequiredButton
                fee={fee}
                disabled={!canSubmit}
                label='Purchase Pack'
                onClick={() => _purchase()}
              />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

import React, { useState } from 'react'
import { Modal, Grid, Image, ButtonGroup, Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useCalcFeePack, useCanPurchase } from '/src/hooks/usePistolsContractCalls'
import { usePacksOfPlayer } from '/src/hooks/useTokenPacks'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { Opener } from '/src/hooks/useOpener'
import { Divider } from '/src/components/ui/Divider'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { useGetPack } from '/src/stores/packStore'
import { bigintToDecimal } from '@underware_gg/pistols-sdk/utils'

const Row = Grid.Row
const Col = Grid.Column

export default function ShopModal({
  opener,
}: {
  opener: Opener
}) {
  const packType = opener.props.packType ?? constants.PackType.Unknown

  const { account } = useAccount()
  const [selectedPackId, setSelectedPackId] = useState(0n)

  const { pack_token } = useDojoSystemCalls()
  const { canPurchase } = useCanPurchase(packType)
  const { fee } = useCalcFeePack(packType)

  const canSubmit = (account && canPurchase)

  const _purchase = () => {
    if (canSubmit) {
      pack_token.purchase(account, packType)
    }
  }

  const _openPack = () => {
    if (selectedPackId) {
      pack_token.open(account, selectedPackId)
    }
  }

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='small'
    >
      <Modal.Header>
        Purchase
      </Modal.Header>

      <Modal.Content className='ModalText ShopModal'>
        <Grid className='OnboardingProfile'>
          <Row columns='equal' textAlign='center' verticalAlign='top'>
            <Col textAlign='left' className='PaddedSides'>
              <Image src={constants.PACK_TYPES[packType].image_url_closed} />
            </Col>
            <Col textAlign='left' className='PaddedSides'>

              <h1>{constants.PACK_TYPES[packType].name}</h1>
              <Divider />

              <FeesToPay value={0} fee={fee} prefixed />
            </Col>
            <Col>
              <h1>Your Packs</h1>
              <Divider />
              <div className='Scroller' style={{ height: '200px' }}>
                <PacksList selectedPackId={selectedPackId} setSelectedPackId={setSelectedPackId} />
              </div>
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
            <Col>
              <ActionButton large fill disabled={!selectedPackId} label={`Open Pack #${bigintToDecimal(selectedPackId)}`} onClick={() => _openPack()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}


//--------------------
// Tables list 
//
export function PacksList({
  selectedPackId,
  setSelectedPackId,
}: {
  selectedPackId: bigint
  setSelectedPackId: (packId: bigint) => void
}) {
  const { packIds } = usePacksOfPlayer()
  return (
    <ButtonGroup vertical className='FillWidth Padded'>
      {packIds.map(packId => (
        <PacksListItem key={packId}
          packId={packId}
          active={selectedPackId == packId}
          setSelectedPackId={setSelectedPackId}
        />
      ))}
    </ButtonGroup >
  )
}

function PacksListItem({
  packId,
  active,
  setSelectedPackId,
}: {
  packId: bigint
  active: boolean
  setSelectedPackId: (packId: bigint) => void
}) {
  const { packExists, packType, name, isOpen } = useGetPack(packId)
  return (
    <Button size='big'
      active={active}
      disabled={!packExists || isOpen}
      onClick={() => { setSelectedPackId(packId) }}
    >
      {name} #{bigintToDecimal(packId)}{isOpen ? ' (Opened)' : ''}
    </Button>
  )
}

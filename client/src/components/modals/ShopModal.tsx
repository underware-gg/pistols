import React, { useState } from 'react'
import { Modal, Grid, ButtonGroup, Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useCalcFeePack, useCanPurchase } from '/src/hooks/usePistolsContractCalls'
import { usePacksOfPlayer } from '/src/hooks/useTokenPacks'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { Opener } from '/src/hooks/useOpener'
import { Divider } from '/src/components/ui/Divider'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useGetPack, usePackType } from '/src/stores/packStore'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { CardPack } from '/src/components/ui/CardPack'

const Row = Grid.Row
const Col = Grid.Column

export default function ShopModal({
  opener,
}: {
  opener: Opener
}) {
  return <>{opener.isOpen && <_ShopModal opener={opener} />}</>
}

function _ShopModal({
  opener,
}: {
  opener: Opener
}) {
  const packType = opener.props.packType ?? constants.PackType.Unknown

  const { account, isConnected } = useAccount()
  const [selectedPackId, setSelectedPackId] = useState(0)

  const { pack_token } = useDojoSystemCalls()
  const { canPurchase } = useCanPurchase(packType)
  const { fee } = useCalcFeePack(packType)
  const { name: packName, imageUrlClosed, imageUrlOpen } = usePackType(packType)

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
            <Col textAlign='left' className='PaddedSides FillHeight'>
              {/* <Image src={imageUrlClosed} /> */}
              <CardPack isOpen={true} clickable={false} cardPackSize={6} maxTilt={30} packType={packType} />
            </Col>
            <Col textAlign='left' className='PaddedSides'>

              <h1>{packName}</h1>
              <Divider />

              <FeesToPay value={0} fee={fee} prefixed size='big' />
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
            {isConnected && <>
              <Col>
                <BalanceRequiredButton
                  fee={fee}
                  disabled={!canSubmit}
                  label='Purchase Pack'
                  onClick={() => _purchase()}
                />
              </Col>
              <Col>
                <ActionButton large fill disabled={!selectedPackId} label={selectedPackId ? `Open Pack #${bigintToDecimal(selectedPackId)}` : `Select Pack to Open`} onClick={() => _openPack()} />
              </Col>
            </>}
            {!isConnected && <>
              <Col>
                <ActionButton large fill disabled={true} label={`Unavailable to Guests`} onClick={() => {}} />
              </Col>
            </>}
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
  selectedPackId: number
  setSelectedPackId: (packId: number) => void
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
  packId: number
  active: boolean
  setSelectedPackId: (packId: number) => void
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

import React, { ReactNode, useEffect, useState } from 'react'
import { Grid, Modal, Breadcrumb, Icon } from 'semantic-ui-react'
import { useMounted, useStarkName, useStarkProfile, useValidateWalletAddressOrName } from '@underware_gg/pistols-sdk/hooks'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useControllerAccount, useChainConfig, ChainId } from '@underware_gg/pistols-sdk/dojo'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { usePact } from '/src/hooks/usePact'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ActionButton } from '/src/components/ui/Buttons'
import { FormInput } from '/src/components/ui/Form'
import { AddressShort } from '/src/components/ui/AddressShort'
import { Divider } from '/src/components/ui/Divider'
import { Opener } from '/src/hooks/useOpener'
import { STARKNET_ADDRESS_LENGTHS } from '@underware_gg/pistols-sdk/utils'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletFinderModal({
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
  const [inputAddress, setInputAddres] = useState('')
  useEffect(() => {
    if (opener.isOpen) setInputAddres('')
  }, [opener.isOpen])

  const { chainConfig } = useChainConfig(ChainId.SN_MAINNET)
  
  const { validatedAddress, isStarknetAddress, isEthereumAddress } = useValidateWalletAddressOrName(inputAddress, chainConfig.rpcUrl)
  const { isDeployed, isControllerAccount, isKatanaAccount } = useControllerAccount(validatedAddress)
  const { isMyAccount, myAcountAddress } = useIsMyAccount(validatedAddress)
  const canSubmit = (isStarknetAddress && !isMyAccount && (isControllerAccount || isKatanaAccount))

  const { starkName } = useStarkName(isStarknetAddress ? validatedAddress : null, chainConfig.rpcUrl)
  const { name: profileName, profilePicture: starkProfilePic } = useStarkProfile(isStarknetAddress ? validatedAddress : null, chainConfig.rpcUrl)

  const { tableId } = useSettings()
  const { dispatchSelectDuel, dispatchChallengingDuelistId } = usePistolsContext()
  const { hasPact, pactDuelId } = usePact(tableId, myAcountAddress, validatedAddress)

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
        <ProfilePic profilePic={0} duelistId={0} anon profilePicUrl={starkProfilePic} />
        <Modal.Description className='FormAnonDescription'>
          <Grid className='FillWidth' >
            <Row columns={'equal'}>
              <Col>
                <FormInput
                  label='Wallet Address or Starknet ID'
                  placeholder={'Address or Starknet ID'}
                  value={inputAddress}
                  setValue={setInputAddres}
                  maxLength={STARKNET_ADDRESS_LENGTHS[0]}
                  code={true}
                  disabled={false}
                />

                <Divider />
                <div className='ModalText'>
                  {isStarknetAddress ? <Checked checked={true}>Starknet Address: <span className='Important'><AddressShort address={validatedAddress} /></span></Checked>
                    : isEthereumAddress ? <Checked checked={false}>Ethereum wallets not supported yet</Checked>
                      : <Checked loading>Enter a valid address or ID</Checked>
                  }

                  {(starkName || profileName) &&<>
                    <br />
                    <Checked checked={true}>Starknet Name: <span className='Important'>{starkName ?? profileName}</span></Checked>
                  </>}

                  <br />
                  {isControllerAccount ? <Checked checked={true}>Controller Account</Checked>
                    : isKatanaAccount ? <Checked checked={true}>Katana Account</Checked>
                      : (isStarknetAddress && isDeployed === false) ? <Checked checked={false}>Undeployed Account</Checked>
                        : isStarknetAddress ? <Checked checked={false}>Unsupported Account</Checked>
                          : <></>
                  }
                </div>

              </Col>
            </Row>
          </Grid>


        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              {isMyAccount ? <ActionButton large fill disabled={true} label='Challenge yourself?' onClick={() => { }} />
                : hasPact ? <ActionButton large fill important label='Existing Challenge' onClick={() => dispatchSelectDuel(pactDuelId)} />
                  : <ActionButton large fill important disabled={!canSubmit} label='Challenge for a Duel!' onClick={() => dispatchChallengingDuelistId(validatedAddress)} />
              }
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

function Checked({
  loading,
  checked,
  children,
}: {
  loading?: boolean
  checked?: boolean
  children: ReactNode
}) {

  return (
    <Breadcrumb size='huge'>
      {loading && <Icon name='spinner' loading />}
      {checked == true && <Icon name='check' color='green' />}
      {checked == false && <Icon name='dont' color='red' />}
      <Breadcrumb.Divider icon={null} />
      <Breadcrumb.Section>{children}</Breadcrumb.Section>
    </Breadcrumb>
  )
}

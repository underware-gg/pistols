import React, { useEffect, useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useValidateWalletAddress } from '@/lib/utils/hooks/useValidateWalletAddress'
import { useIsMyAccount } from '@/pistols/hooks/useIsMyDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { FormInput } from '@/pistols/components/ui/Form'
import { AddressShort } from '@/lib/ui/AddressShort'
import { Divider } from '@/lib/ui/Divider'
import { Opener } from '@/lib/ui/useOpener'
import { STARKNET_ADDRESS_LENGTHS } from '@/lib/utils/starknet'

const Row = Grid.Row
const Col = Grid.Column

export default function AnonModal({
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

  const { validatedAddress, isStarknetAddress, isEthereumAddress } = useValidateWalletAddress(inputAddress)
  const isYou = useIsMyAccount(validatedAddress)
  const canSubmit = (isStarknetAddress && !isYou)

  const { dispatchChallengingDuelistId } = usePistolsContext()
  const hasPact = false


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
        <ProfilePic profilePic={0} duelistId={0} anon />
        <Modal.Description className='FormAnonDescription'>
          <Grid className='FillWidth' >
            <Row columns={'equal'}>
              <Col>
                <FormInput
                  label='Wallet Address or Starknet ID'
                  placeholder={'0x... or name.start'}
                  value={inputAddress}
                  setValue={setInputAddres}
                  maxLength={STARKNET_ADDRESS_LENGTHS[1]}
                  code={true}
                  disabled={false}
                />

                <Divider />
                <div className='ModalText'>

                  {isStarknetAddress ?
                    <>Starknet Address:
                      <br />
                      <AddressShort address={validatedAddress} />
                      <h5 className='Important'>(only Controller accounts supported ATM)</h5>
                    </>
                    : isEthereumAddress ? <div>Ethereum wallets not supported yet</div>
                      : <span className='Inactive'>Need a valid address...</span>
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
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              {isYou ?
                <ActionButton fill disabled={true} label='Challenge yourself?' onClick={() => {}} />
                : <ActionButton fill disabled={!isStarknetAddress} label='Challenge for a Duel!' onClick={() => dispatchChallengingDuelistId(validatedAddress)} />
              }
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

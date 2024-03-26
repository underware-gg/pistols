import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Grid, Input, Modal } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useAccount, useSignTypedData } from '@starknet-react/core'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { feltToString, pedersen } from '@/lib/utils/starknet'
import { ArraySignatureType, typedData } from 'starknet'
import { AddressShort } from '@/lib/ui/AddressShort'
import { add } from '@tweenjs/tween.js'
import { bigintEquals } from '@/lib/utils/types'
import { deriveKeyPairFromSeed, BurnerKeyPair } from '@dojoengine/create-burner'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountSetupModal({
  opener,
}: {
  opener: Opener
}) {
  const { account, isMasterAccount } = useDojoAccount()
  const router = useRouter()

  useEffect(() => {
  }, [opener.isOpen])


  return (
    <Modal
      // size='small'
      // dimmer='inverted'
      onClose={() => opener.close()}
      // onOpen={() => setIsChallenging(false)}
      open={opener.isOpen}
    >
      <Modal.Header>
        Create
      </Modal.Header>
      <Modal.Content className='ModalText'>
        <DeployWallet />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='New Duelist' onClick={() => { }} />
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

function PhaseButton({}) {
  return (
    <div className='' style={{ width: '200px', height: '200px' }}>
      😳
    </div>
  )
}


function DeployWallet({
}) {
  const { account, isConnected, chainId } = useAccount()
  const { walletSig, dispatchSetSig } = usePistolsContext()

  //
  // reset sig if wallet account changes
  useEffect(() => {
    if (account?.address && walletSig?.sig && !bigintEquals(account?.address, walletSig.address)) {
      dispatchSetSig(0n, 0n)
    }
  }, [account, walletSig])

  //
  // sign deployer message and store on PistolsContext
  const messages: Messages = { game: 'PISTOLS_AT_10_BLOCKS', purpose: 'DUELIST_ACCOUNT' }
  const typedMessage = useMemo(() => (createTypedMessage({
    chainId: chainId ? feltToString(chainId) : undefined,
    messages,
  })), [chainId, messages])
  const { data, signTypedData, isPending } = useSignTypedData(typedMessage)
  const signature = useMemo(() => (data as ArraySignatureType ?? null), [data])
  useEffect(() => {
    if (account && signature) {
      dispatchSetSig(account.address, pedersen(signature[0], signature[1]))
    }
  }, [account, signature])

  //
  // derive account address from current walletSig
  const [accountIndex, setAccountIndex] = useState(0)
  const [accountAddress, setAccountAddress] = useState(0n)

  useEffect(() => {
    if (walletSig?.sig) {
      const keyPair: BurnerKeyPair = deriveKeyPairFromSeed(walletSig.sig, accountIndex)
      setAccountAddress(BigInt(keyPair.pubKey))
    } else {
      setAccountAddress(0n)
    }
  }, [walletSig, accountIndex])


  return (
    <div>
      Connected wallet: <AddressShort address={account?.address ?? 0n} />
      <br />
      Signature: {walletSig.sig ? <AddressShort copyLink={false} address={walletSig.sig} post='(secret!)' /> : <Button onClick={() => signTypedData()} compact>Sign</Button>}
      <br />
      Account index: <span className='h5'>#{accountIndex}</span>
      <span className='Anchor Important' onClick={() => (setAccountIndex(accountIndex > 0 ? accountIndex - 1 : accountIndex))}> ◀ </span>
      <span className='Anchor Important' onClick={() => (setAccountIndex(accountIndex + 1))}> ▶ </span>
      <br />
      Account address: <AddressShort address={accountAddress ?? 0n} />

    </div>
  )
}


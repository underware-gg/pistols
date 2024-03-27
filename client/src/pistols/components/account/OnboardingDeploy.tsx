import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Grid, Icon, Input, Modal, Segment, Step } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useAccount, useSignTypedData } from '@starknet-react/core'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { feltToString, pedersen } from '@/lib/utils/starknet'
import { ArraySignatureType, typedData } from 'starknet'
import { AddressShort } from '@/lib/ui/AddressShort'
import { add } from '@tweenjs/tween.js'
import { bigintEquals } from '@/lib/utils/types'
import { deriveKeyPairFromSeed, BurnerKeyPair } from '@dojoengine/create-burner'
import { VStack, VStackRow } from '@/lib/ui/Stack'

const Row = Grid.Row
const Col = Grid.Column

enum DeployPhase {
  None,
  Connect,
  Sign,
  Deploy,
  Restore,
}

export function OnboardingDeploy({
}) {
  const { account, isConnected, chainId } = useAccount()
  const { walletSig, hasSigned, dispatchSetSig, connectOpener } = usePistolsContext()

  //
  // reset sig if wallet account changes
  useEffect(() => {
    if (account?.address && hasSigned && !bigintEquals(account?.address, walletSig.address)) {
      dispatchSetSig(0n, 0n)
    }
  }, [account, hasSigned, walletSig])

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
  const [accountIndex, setAccountIndex] = useState(1)
  const [accountAddress, setAccountAddress] = useState(0n)

  useEffect(() => {
    if (hasSigned) {
      const keyPair: BurnerKeyPair = deriveKeyPairFromSeed(walletSig.sig, accountIndex)
      setAccountAddress(BigInt(keyPair.pubKey))
    } else {
      setAccountAddress(0n)
    }
  }, [hasSigned, walletSig, accountIndex])

  const isDeployed = false
  const isStored = false
  const isDone = (isDeployed && isStored)

  const stepNumber = useMemo(() => (
    !isConnected ? DeployPhase.Connect
      : !hasSigned ? DeployPhase.Sign
        : !isDeployed ? DeployPhase.Deploy
          : !isStored ? DeployPhase.Restore
            : DeployPhase.None
  ), [isConnected, hasSigned])

  return (
    <Grid>
      <Row columns={'equal'}>
        <Col>
          <Step.Group fluid vertical className='Unselectable'>
            <Step completed={isConnected} active={false && stepNumber == DeployPhase.Connect}>
              <Icon name='warning' color='orange' />
              <Step.Content className='TitleCase FillWidth90'>
                {isConnected ?
                  <span className='H3'>Connected wallet: <b><AddressShort address={account?.address ?? 0n} /></b></span>
                  : <ActionButton fill large onClick={() => connectOpener.open()} label='Connect Wallet' />
                }
              </Step.Content>
            </Step>

            <Step completed={hasSigned} active={false && stepNumber == DeployPhase.Sign}>
              <Icon name='warning' color='orange' />
              <Step.Content className='TitleCase FillWidth90'>
                {hasSigned ?
                  <span className='H3'>Secret: <b><AddressShort copyLink={false} address={walletSig.sig} /></b></span>
                  : <ActionButton fill large onClick={() => signTypedData()} label='Sign Message' />
                }
              </Step.Content>
            </Step>

            <Step>
              <Icon name='hashtag' />
              <Step.Content className='TitleCase'>
                {hasSigned ?
                  <span className='H3'>
                    Account ID: 
                    <span className='Anchor Important' onClick={() => (setAccountIndex(accountIndex > 1 ? accountIndex - 1 : accountIndex))}> ◀ </span>
                    <span className='H3'>#{accountIndex}</span>
                    <span className='Anchor Important' onClick={() => (setAccountIndex(accountIndex + 1))}> ▶ </span>
                  </span>
                  : <Step.Title>Account ID</Step.Title>
                }
                
                {/* <Step.Description>Enter billing information</Step.Description> */}
              </Step.Content>
            </Step>

            <Step>
              <Icon name='at' />
              <Step.Content className='TitleCase'>
                {accountAddress ?
                  <span className='H3'>Account address: <b><AddressShort address={accountAddress ?? 0n} /></b></span>
                  : <Step.Title>Account Address</Step.Title>
                }
                {/* <Step.Description>Enter billing information</Step.Description> */}
              </Step.Content>
            </Step>

            <Step completed={isDeployed} active={false && (stepNumber == DeployPhase.Deploy || stepNumber == DeployPhase.Restore)}>
              <Icon name='warning' color='orange' />
              <Step.Content className='TitleCase FillWidth90'>
                {stepNumber == DeployPhase.Deploy ? <ActionButton fill large onClick={() => {}} label='Deploy' />
                  : stepNumber == DeployPhase.Restore ? <ActionButton fill large onClick={() => { }} label='Restore' />
                    : isDone ? <span className='H3'>Account Deployed</span>
                      : <Step.Title>Deploy / Restore</Step.Title>
                }
              </Step.Content>
            </Step>
          </Step.Group>
        </Col>

      </Row>
    </Grid>
  )
}


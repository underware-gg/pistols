import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Grid, Step } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useAccount, useSignTypedData } from '@starknet-react/core'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { feltToString, pedersen } from '@/lib/utils/starknet'
import { ArraySignatureType } from 'starknet'
import { AddressShort } from '@/lib/ui/AddressShort'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { BurnerCreateOptions } from '@dojoengine/create-burner'
import { IconWarning } from '@/lib/ui/Icons'
import { useBurnerAccount, useBurnerContract } from '@/lib/wallet/useBurnerAccount'
import { TextLink } from '@/lib/ui/Links'

const Row = Grid.Row
const Col = Grid.Column

enum DeployPhase {
  None,     // 0
  Connect,  // 1
  Sign,     // 2
  Account,  // 3
  Deploy,   // 4
  Import,   // 5
  Done,     // 6
}

export function OnboardingDeploy({
}) {
  const { account, isConnected, chainId } = useAccount()
  const { walletSig, hasSigned, accountIndex, dispatchSetSig, dispatchSetAccountIndex, connectOpener } = usePistolsContext()
  const { create, generateAddressFromSeed } = useDojoAccount()

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
  const [accountAddress, setAccountAddress] = useState(0n)
  const { deployTx } = useBurnerContract(accountAddress)

  const createOptions = useMemo((): BurnerCreateOptions => ({
    secret: bigintToHex(walletSig.sig ?? 0n),
    index: accountIndex,
    metadata: { messages },
  }), [walletSig.sig, accountIndex, messages])

  useEffect(() => {
    if (hasSigned) {
      const address = generateAddressFromSeed(createOptions)
      setAccountAddress(BigInt(address))
    } else {
      setAccountAddress(0n)
    }
  }, [hasSigned, createOptions])

  //
  // Local burner
  const { isDeployed, isImported, address } = useBurnerAccount(accountIndex)

  const currentPhase = useMemo<DeployPhase>(() => (
    !isConnected ? DeployPhase.Connect
      : (!isDeployed && !hasSigned) ? DeployPhase.Sign
        : !isDeployed ? DeployPhase.Deploy
          : !isImported ? DeployPhase.Import
            : DeployPhase.Done
  ), [isConnected, hasSigned, isDeployed, isImported])

  return (
    <Grid className=''>
      <Row columns={'equal'}>
        <Col>
          <Step.Group fluid vertical className='Unselectable NoPadding NoBorder' style={{ border: '0 !important' }}>

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Connect} completed={isConnected}
              contentActive={<ActionButton fill large onClick={() => connectOpener.open()} label='Connect Wallet' />}
              contentCompleted={<span>Connected wallet: <b><AddressShort address={account?.address ?? 0n} important /></b></span>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Sign} completed={hasSigned}
              contentActive={<ActionButton fill large disabled={currentPhase != DeployPhase.Sign} onClick={() => signTypedData()} label='Sign Message' />}
              contentCompleted={<span>Signed Secret: <b><AddressShort copyLink={false} address={walletSig.sig} important /></b></span>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Account} completed={hasSigned || isDeployed}
              // contentActive={<>Account ID:&nbsp;<span className='H4'>#{accountIndex}</span></>}
              contentCompleted={
                <>
                  Account ID:&nbsp;
                  <TextLink disabled={!isDeployed || accountIndex <= 1} onClick={() => (dispatchSetAccountIndex(accountIndex - 1))}> ◀ </TextLink>
                  <span className='H4'>#{accountIndex}</span>
                  <TextLink disabled={!isDeployed} onClick={() => (dispatchSetAccountIndex(accountIndex + 1))}> ▶ </TextLink>
                </>
              }
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Account} completed={Boolean(address) || Boolean(accountAddress)}
              contentActive={<>Account Address</>}
              contentCompleted={<>Account address: <b><AddressShort address={address || accountAddress} important /></b></>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Deploy} completed={isDeployed}
              contentActive={<ActionButton fill large disabled={currentPhase != DeployPhase.Deploy} onClick={() => create(createOptions)} label='Deploy' />}
              contentCompleted={<>Account Deployed</>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Import} completed={isImported}
              contentActive={<ActionButton fill large disabled={currentPhase != DeployPhase.Import} onClick={() => { }} label='Import' />}
              contentCompleted={<>Account Imported</>}
            />

          </Step.Group>
        </Col>

      </Row>
    </Grid>
  )
}

function DeployStep({
  phase,
  currentPhase,
  completed,
  contentActive,
  contentCompleted,
}: {
    phase: DeployPhase
    currentPhase: DeployPhase
    completed: boolean
    contentActive?: ReactNode
    contentCompleted: ReactNode
}) {
  const _active = (currentPhase == phase)
  const _disabled = (currentPhase < phase)
  let classNames = ['H3', 'TitleCase', 'FillWidth80']
  if (_disabled) classNames.push('Disabled')
  return (
    <Step completed={completed} active={false && _active}>
      <IconWarning />
      <Step.Content className={classNames.join(' ')}>
        {!completed && (contentActive ?? contentCompleted)}
        {completed && contentCompleted}
      </Step.Content>
    </Step>
  )
}
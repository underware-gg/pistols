import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Step } from 'semantic-ui-react'
import { useAccount, useSignTypedData } from '@starknet-react/core'
import { useDojo, useDojoAccount } from '@/lib/dojo/DojoContext'
import { useBurnerAccount, useBurnerDeployment } from '@/lib/dojo/hooks/useBurnerAccount'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { Messages, createTypedMessage, getMessageHash, splitSignature } from '@/lib/utils/starknet_sign'
import { feltToString, pedersen } from '@/lib/utils/starknet'
import { AddressShort } from '@/lib/ui/AddressShort'
import { bigintEquals, bigintToHex, cleanDict } from '@/lib/utils/types'
import { BurnerCreateOptions } from '@dojoengine/create-burner'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { IconWarning } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

enum DeployPhase {
  None,     // 0
  Account,  // 1
  Connect,  // 2
  Sign,     // 3
  Deploy,   // 4
  // Import,   // 5
  Done,     // 6
}

export function OnboardingDeploy({
}) {
  const { account, isConnected, chainId } = useAccount()
  const { walletSig, hasSigned, accountIndex, dispatchSetSig, connectOpener } = usePistolsContext()
  const { generateAddressFromSeed } = useDojoAccount()

  //
  // reset sig if wallet account changes
  useEffect(() => {
    if (account?.address && hasSigned && !bigintEquals(account?.address, walletSig.address)) {
      dispatchSetSig(0n, 0n)
    }
  }, [account, hasSigned, walletSig])

  //
  // sign deployer message and store on PistolsContext
  const { playerId } = usePlayerId()
  const messages = useMemo<Messages>(() => cleanDict({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: 'DUELIST_ACCOUNT',
    player_id: playerId,
  }), [playerId])
  const typedMessage = useMemo(() => (createTypedMessage({
    chainId: chainId ? feltToString(chainId) : undefined,
    messages,
  })), [chainId, messages])
  const messageHash = useMemo(() => getMessageHash(typedMessage, account?.address), [messages, account])
  const { data, signTypedData, isPending } = useSignTypedData(typedMessage)
  const signature = useMemo(() => splitSignature(data), [data])
  useEffect(() => {
    if (account && signature.length > 0) {
      dispatchSetSig(account.address, pedersen(signature[0], signature[1]))
    }
  }, [account, signature])

  //
  // derive account address from current walletSig
  const [generatedAddress, setGeneratedAddress] = useState<bigint>(null)

  const createOptions = useMemo((): BurnerCreateOptions => ({
    secret: bigintToHex(walletSig.sig ?? 0n),
    index: accountIndex,
    metadata: { messages, messageHash },
  }), [walletSig.sig, accountIndex, messages])

  useEffect(() => {
    if (hasSigned) {
      const address = generateAddressFromSeed(createOptions)
      setGeneratedAddress(address ? BigInt(address) : null)
    } else {
      setGeneratedAddress(null)
    }
  }, [hasSigned, createOptions])

  //
  // Local burner
  const { isImported, address } = useBurnerAccount(accountIndex)
  const accountAddress = useMemo(() => (generatedAddress ?? address ?? 0n), [generatedAddress, address])
  const { isDeployed, isVerifying, isDeploying, deployOrRestore, deployError } = useBurnerDeployment(accountAddress, createOptions)
  const isGoodToUse = (isDeployed && isImported)

  //
  // Account creation phase
  const currentPhase = useMemo<DeployPhase>(() => (
    !isConnected ? DeployPhase.Connect
      : (!hasSigned && !isGoodToUse) ? DeployPhase.Sign
        : (!isGoodToUse) ? DeployPhase.Deploy
          : DeployPhase.Done
  ), [isConnected, hasSigned, isDeployed, isImported])


  return (
    <Grid className=''>
      <Row columns={'equal'}>
        <Col>
          <Step.Group fluid vertical className='Unselectable NoPadding NoBorder' style={{ border: '0 !important' }}>

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Account} completed={true}
              // contentActive={<>Account ID:&nbsp;<span className='H4'>#{accountIndex}</span></>}
              contentCompleted={<>Account ID: <span className='H4'>#{accountIndex}</span></>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Connect} completed={isConnected}
              contentActive={<ActionButton fill large onClick={() => connectOpener.open()} label='Connect Wallet' />}
              contentCompleted={<span>Connected wallet: <b><AddressShort address={account?.address ?? 0n} important /></b></span>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Sign} completed={hasSigned}
              contentActive={<ActionButton fill large disabled={currentPhase != DeployPhase.Sign} onClick={() => signTypedData()} label='Sign Message' />}
              // contentCompleted={<span>Signed Secret: <b><AddressShort copyLink={false} address={walletSig.sig} important /></b></span>}
              contentCompleted={<span>Signed Secret</span>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Account} completed={Boolean(accountAddress)}
              contentActive={<>Account Address</>}
              contentCompleted={<>Account address: <b><AddressShort address={accountAddress} important /></b></>}
            />

            <DeployStep currentPhase={currentPhase} phase={DeployPhase.Deploy} completed={isGoodToUse}
              contentActive={<ActionButton fill large disabled={currentPhase != DeployPhase.Deploy || isVerifying || isDeploying} onClick={() => deployOrRestore()} label={isVerifying ? 'Verifying...' : isDeploying ? 'Deploying...' : isDeployed ? 'Restore' : 'Deploy'} />}
              contentCompleted={<>Account Deployed</>}
            />

          </Step.Group>
        </Col>
      </Row>

      {deployError &&
        <Row columns={'equal'}>
          <Col className='Code Negative'>
            <Divider className='NoMargin'/>
            <p className='Padded'>
              {deployError}
            </p>
          </Col>
        </Row>
      }

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

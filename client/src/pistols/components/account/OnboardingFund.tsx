import React, { useState } from 'react'
import { Divider, Grid, Header, Icon, Input } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useBurnerAccount } from '@/lib/dojo/hooks/useBurnerAccount'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { LockedBalance, LordsBalance } from '@/pistols/components/account/LordsBalance'
import { LordsFaucet } from '@/pistols/components/account/LordsFaucet'
import { ActionButton } from '../ui/Buttons'
import { useLordsBalance } from '@/lib/dojo/hooks/useLordsBalance'
import { ethToWei } from '@/lib/utils/starknet'
import { isNumber } from '@/lib/utils/types'
import { useERC20Transfer } from '@/lib/utils/hooks/useERC20'
import { useLordsContract } from '@/lib/dojo/hooks/useLordsContract'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingFund({
  isDeployed = false,
}) {
  const { account } = useAccount()
  const { accountIndex } = usePistolsContext()
  const { address } = useBurnerAccount(accountIndex)

  const [deposit, setDeposit] = useState(true)

  const _rowStyle = { minHeight: '40px', width: '100%', padding: '5px' }

  return (
    <div className='Padded'>

      <h3>Account Balance</h3>
      <h3><LordsBalance address={account?.address} /></h3>
      <Divider hidden />
      {deposit &&
        <div style={_rowStyle}>
          <Deposit fromAddress={account?.address} toAddress={address} />
        </div>
      }
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Deposit from Account to Duelist' /> */}


      <Divider horizontal>
        <Header as='h2'>
          <Icon className='NoMargin Anchor' onClick={() => setDeposit(!deposit)}
            name={deposit ? 'arrow alternate circle down outline' : 'arrow alternate circle up outline'}
          />
        </Header>
      </Divider>

      <h3>Duelist Balance</h3>
      <h3><LordsBalance address={address} /> <LockedBalance address={address} clean /></h3>
      <Divider hidden />
      {!deposit &&
        <div style={_rowStyle}>
          <Withdraw fromAddress={address} toAddress={account?.address} />
        </div>
      }
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Withdraw from Duelist to Account' /> */}

    </div>
  )
}

function Deposit({
  fromAddress,
  toAddress,
}) {
  const [wei, setWei] = useState(0n)
  const { contractAddress } = useLordsContract()
  const { transferAsync, isPending } = useERC20Transfer(toAddress, contractAddress, wei)
  return (
    <DepositForm action='Deposit to Duelist'
      fromAddress={fromAddress}
      wei={wei}
      setWei={setWei}
      transfer={transferAsync}
      disabled={isPending}
    />
  )
}

function Withdraw({
  fromAddress,
  toAddress,
}) {
  const [wei, setWei] = useState(0n)
  // const { transferAsync, isPending, transactionHash } = useERC20Transfer(toAddress)
  const isPending = false
  return (
    <DepositForm action='Withdraw to Account'
      fromAddress={fromAddress}
      wei={wei}
      setWei={setWei}
      transfer={() => { }}
      disabled={isPending}
    />
  )
}


function DepositForm({
  fromAddress,
  action,
  wei,
  setWei,
  transfer,
  disabled,
}: {
  fromAddress: string
  wei: bigint
  action: string
  setWei: Function
  transfer: Function
  disabled: boolean
}) {
  const { balance: fromBalance } = useLordsBalance(fromAddress)

  const [inputValue, setInputValue] = useState('')

  const _setAmount = (value: string) => {
    if (isNumber(value) || value == '') {
      setInputValue(value)
      setWei(value ? ethToWei(parseInt(value)) : 0n)
    }
  }

  const _noFunds = (fromBalance == 0n || wei > fromBalance)
  const _canTransfer = (!disabled && Boolean(transfer) && wei > 0n && !_noFunds)

  return (
    <Grid className='NoPadding'>
      <Row columns={'equal'} className='NoPadding'>
        <Col>
          <Input fluid
            maxLength={7}
            placeholder={'Amount'}
            value={inputValue}
            disabled={disabled}
            onChange={(e) => _setAmount(e.target.value)}
          />
        </Col>
        <Col>
          <ActionButton fill attention disabled={!_canTransfer} onClick={() => transfer()} label={_noFunds ? 'No Funds' : action} />
        </Col>
      </Row>
    </Grid>
  )
}

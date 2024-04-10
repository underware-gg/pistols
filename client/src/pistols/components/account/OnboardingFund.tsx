import React, { useState } from 'react'
import { Divider, Grid, Header, Input } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useBurnerAccount } from '@/lib/dojo/hooks/useBurnerAccount'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useLordsBalance, useLordsContract } from '@/lib/dojo/hooks/useLords'
import { useDojoERC20Transfer } from '@/lib/dojo/hooks/useDojoERC20'
import { useERC20Transfer } from '@/lib/utils/hooks/useERC20'
import { LockedWagerBalance, LordsBalance } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { IconTransfer } from '@/lib/ui/Icons'
import { ethToWei } from '@/lib/utils/starknet'
import { isNumber } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'
import { coins } from '@/pistols/utils/constants'

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
      <span className='H3'><LordsBalance address={account?.address} big /></span>
      <Divider hidden />
      {deposit &&
        <div style={_rowStyle}>
          <Deposit fromAddress={account?.address} toAddress={address} disabled={!isDeployed} />
        </div>
      }
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Deposit from Account to Duelist' /> */}


      <Divider horizontal>
        <Header as='h2'>
          <IconTransfer rotated={deposit} setRotated={setDeposit} />
        </Header>
      </Divider>

      <h3>Duelist Balance</h3>
      <span className='H3'><LordsBalance address={address} big /></span> <LockedWagerBalance coin={coins.LORDS} address={address} clean />
      <Divider hidden />
      {!deposit &&
        <div style={_rowStyle}>
          <Withdraw fromAddress={address} toAddress={account?.address} disabled={!isDeployed} />
        </div>
      }
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Withdraw from Duelist to Account' /> */}

    </div>
  )
}

interface DepositProps {
  fromAddress: BigNumberish
  toAddress: BigNumberish
  disabled: boolean
}

function Deposit({
  fromAddress,
  toAddress,
  disabled,
}: DepositProps) {
  const [wei, setWei] = useState(0n)
  const { contractAddress } = useLordsContract()
  const { transfer, isPending } = useERC20Transfer(contractAddress, toAddress, wei)
  return (
    <DepositForm action='Deposit to Duelist'
      fromAddress={fromAddress}
      wei={wei}
      setWei={setWei}
      transfer={transfer}
      disabled={disabled || isPending}
    />
  )
}

function Withdraw({
  fromAddress,
  toAddress,
  disabled,
}: DepositProps) {
  const [wei, setWei] = useState(0n)
  const { contractAddress } = useLordsContract()
  const { transfer, isPending } = useDojoERC20Transfer(contractAddress, toAddress, wei)
  return (
    <DepositForm action='Withdraw to Account'
      fromAddress={fromAddress}
      wei={wei}
      setWei={setWei}
      transfer={transfer}
      disabled={disabled || isPending}
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
  fromAddress: BigNumberish
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
      <Row columns={'equal'} className='NoPadding' verticalAlign='middle'>
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

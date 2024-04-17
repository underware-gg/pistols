import React, { useState } from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useBurnerAccount } from '@/lib/dojo/hooks/useBurnerAccount'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useLordsBalance, useLordsContract } from '@/lib/dojo/hooks/useLords'
import { useDojoERC20Transfer } from '@/lib/dojo/hooks/useDojoERC20'
import { LockedWagerBalance, LordsBalance } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { LordsFaucet } from '@/pistols/components/account/LordsFaucet'
import { IconTransfer } from '@/lib/ui/Icons'
import { Divider } from '@/lib/ui/Divider'
import { ethToWei } from '@/lib/utils/starknet'
import { isNumber } from '@/lib/utils/types'
import { Account, BigNumberish } from 'starknet'
import { coins } from '@/pistols/utils/constants'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingFund({
  isDeployed = false,
}) {
  const { account } = useAccount()
  const { accountIndex } = usePistolsContext()
  const { account: burnerAccount, address } = useBurnerAccount(accountIndex)

  const [deposit, setDeposit] = useState(true)

  const _rowStyle = { minHeight: '40px', width: '100%', padding: '5px' }

  return (
    <div className='PaddedDouble'>

      <Grid>
        <Row columns='equal'>
          <Col>
            <h3>Account Balance</h3>
            <span className='H3'><LordsBalance address={account?.address} big /></span>
          </Col>
          <Col textAlign='right'>
            <LordsFaucet account={account} />
          </Col>
        </Row>
      </Grid>
      {deposit &&
        <div style={_rowStyle}>
          <Deposit fromAccount={account as Account} fromAddress={account?.address} toAddress={address} disabled={!isDeployed} action='Deposit to Duelist' />
        </div>
      }
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Deposit from Account to Duelist' /> */}


      <Divider as='h2' content={
        <IconTransfer rotated={deposit} setRotated={setDeposit} />
      } />

      <h3>Duelist Balance</h3>
      <span className='H3'><LordsBalance address={address} big /></span> <LockedWagerBalance coin={coins.LORDS} address={address} clean />
      {!deposit &&
        <div style={_rowStyle}>
          <Deposit fromAccount={burnerAccount} fromAddress={address} toAddress={account?.address} disabled={!isDeployed} action='Withdraw to Account' />
        </div>
      }
      {/* <LordsFaucet /> */}
      {/* <ActionButton fill disabled={!isDeployed} onClick={() => setDeposit(!deposit)} label='Withdraw from Duelist to Account' /> */}

    </div>
  )
}

interface DepositProps {
  fromAccount: Account,
  fromAddress: BigNumberish
  toAddress: BigNumberish
  action: string
  disabled: boolean
}

function Deposit({
  fromAccount,
  fromAddress,
  toAddress,
  action,
  disabled,
}: DepositProps) {
  const [wei, setWei] = useState(0n)
  const { contractAddress } = useLordsContract()
  const { transfer, isPending } = useDojoERC20Transfer(contractAddress, toAddress, wei, fromAccount)

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
          <ActionButton fill important disabled={!_canTransfer} onClick={() => transfer()} label={_noFunds ? 'No Funds' : action} />
        </Col>
      </Row>
    </Grid>
  )

}


// function DepositForm({
//   fromAddress,
//   action,
//   wei,
//   setWei,
//   transfer,
//   disabled,
// }: {
//   fromAddress: BigNumberish
//   wei: bigint
//   action: string
//   setWei: Function
//   transfer: Function
//   disabled: boolean
// }) {
//   const { balance: fromBalance } = useLordsBalance(fromAddress)

//   const [inputValue, setInputValue] = useState('')

//   const _setAmount = (value: string) => {
//     if (isNumber(value) || value == '') {
//       setInputValue(value)
//       setWei(value ? ethToWei(parseInt(value)) : 0n)
//     }
//   }

//   const _noFunds = (fromBalance == 0n || wei > fromBalance)
//   const _canTransfer = (!disabled && Boolean(transfer) && wei > 0n && !_noFunds)

//   return (
//     <Grid className='NoPadding'>
//       <Row columns={'equal'} className='NoPadding' verticalAlign='middle'>
//         <Col>
//           <Input fluid
//             maxLength={7}
//             placeholder={'Amount'}
//             value={inputValue}
//             disabled={disabled}
//             onChange={(e) => _setAmount(e.target.value)}
//           />
//         </Col>
//         <Col>
//           <ActionButton fill important disabled={!_canTransfer} onClick={() => transfer()} label={_noFunds ? 'No Funds' : action} />
//         </Col>
//       </Row>
//     </Grid>
//   )
// }

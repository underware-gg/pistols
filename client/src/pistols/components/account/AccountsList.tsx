import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Radio, Input } from 'semantic-ui-react'
import { useDojo, useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'

const Row = Grid.Row
const Col = Grid.Column

export function AccountsList() {
  const router = useRouter()
  const {
    account: { create, list, get, select, clear, account, isMasterAccount, isDeploying }
  } = useDojo()
  
  const rows = useMemo(() => {
    let result = []
    const burners = list()
    burners.forEach((burner, index) => {
      const isSelected = (burner.address == account.address)
      const key = `${burner.address}_${isSelected ? 1 : 0}`
      result.push(<AccountItem key={key} address={burner.address} index={index} isSelected={isSelected} select={select} />)
    })
    if (result.length == 0) {
      result.push(
        <Row key='empty' textAlign='center' columns={'equal'}>
          <Col>
            no accounts created
          </Col>
        </Row>
      )
    }
    return result
  }, [account?.address, isDeploying])

  const { isRegistered } = useDuelist(account.address)
  const canEnter = useMemo(() => (!isMasterAccount && !isDeploying && isRegistered), [isMasterAccount, isDeploying, isRegistered])

  return (
    <>
      <Grid className='Faded'>
        {rows}
        <Row textAlign='center' columns={'equal'}>
          <Col>
            <ActionButton disabled={isDeploying} onClick={() => create()} label='CREATE ACCOUNT' />
          </Col>
          <Col>
            <ActionButton disabled={isDeploying} onClick={() => clear()} label='DELETE ALL ACCOUNTS (refresh)' />
          </Col>
        </Row>
      </Grid>
      <br />
      <ActionButton large disabled={!canEnter} onClick={() => router.push('/tavern')} label='ENTER THE TAVERN' />
    </>
  )
}


function AccountItem({
  address,
  index,
  isSelected,
  select,
}) {
  const { register_duelist } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  // current name from Dojo
  const { name, isRegistered } = useDuelist(address)

  const defaultAccountName = useMemo(() => (`ACCOUNT-${index + 1}`), [index])
  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue), [name, inputValue])
  const canRegister = useMemo(() => (isSelected && account && address), [isSelected, address])

  const [profilePic, setProfilePic] = useState(0)

  // initialize
  useEffectOnce(() => {
    if (inputValue == null) {
      setInputValue(name ?? defaultAccountName)
    } else if (inputValue != name) {
      setInputValue(name)
    }
  }, [name, inputValue])

  const _register = () => {
    if (canRegister) {
      register_duelist(account, inputValue, profilePic)
    }
  }

  return (
    <Row>
      <Col width={1} textAlign='center'>
        <Radio checked={isSelected} onClick={() => select(address)} />
      </Col>
      <Col width={3} textAlign='center'>
        <AccountShort address={address} />
      </Col>
      <Col width={9}>
        <Input inverted fluid
          // icon='edit'
          label='burner'
          maxLength={30}
          placeholder={'UNREGISTER'}
          value={inputValue ?? ''}
          onChange={(e) => setInputValue(e.target.value)}
        // onFocus={() => select(address)}
        />
      </Col>
      <Col width={3}>
        {!isRegistered
          ? <ActionButton fill disabled={!canRegister || !inputIsValid} onClick={() => _register()} label='REGISTER' />
          : inputValue
            ? <ActionButton fill disabled={!canRegister || isUpdated || !inputIsValid} onClick={() => _register()} label={isUpdated ? 'OK' : 'UPDATE'} />
            : <ActionButton fill disabled={!canRegister || isUpdated} onClick={() => _register()} label='UNREGISTER' />
        }
      </Col>
    </Row>
  )
}

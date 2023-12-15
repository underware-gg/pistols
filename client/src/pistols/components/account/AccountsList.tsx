import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie'
import { Container, Grid, Radio, Input } from 'semantic-ui-react'
import { useDojo } from '@/dojo/DojoContext'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { accountNameCookieName } from '@/pistols/hooks/useAccountName'

const Row = Grid.Row
const Col = Grid.Column

export function AccountsList() {
  const router = useRouter()
  const {
    account: { create, list, get, select, clear, account, isMasterAccount, isDeploying }
  } = useDojo()
  // console.log(`LIST`, account.address)

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

  const canEnter = useMemo(() => (!isMasterAccount && !isDeploying), [isMasterAccount, isDeploying])

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
      <ActionButton large disabled={!canEnter} onClick={() => router.push('/manor')} label='ENTER THE TAVERN' />
    </>
  )
}


function AccountItem({
  address,
  index,
  isSelected,
  select,
}) {
  return (
    <Row>
      <Col width={1} textAlign='center'>
        <Radio checked={isSelected} onClick={() => select(address)} />
      </Col>
      <Col width={3} textAlign='center'>
        <AccountShort address={address} />
      </Col>
      <Col width={9}>
        <AccountName address={address} index={index} select={select} />
      </Col>
      <Col width={3}>
        <ActionButton disabled={true} onClick={() => { }} label='REGISTER' />
      </Col>
    </Row>
  )
}

function AccountName({
  address,
  index,
  select,
}) {
  const defaultAccountName = useMemo(() => (`ACCOUNT-${index + 1}`), [index])
  const cookieName = useMemo(() => accountNameCookieName(address), [address])

  const [cookies, setCookie] = useCookies([cookieName])

  const [inputValue, setInputValue] = useState(null)

  // initialize
  useEffect(() => {
    if (inputValue == null) {
      setInputValue(cookies[cookieName] ?? defaultAccountName)
    }
  }, [cookies[cookieName]])

  useEffect(() => {
    if (inputValue && cookies[cookieName] != inputValue) {
      setCookie(cookieName, inputValue)
    }
  }, [inputValue])

  return (
    <Input inverted fluid icon='edit' maxLength={30}
      placeholder={defaultAccountName}
      value={inputValue ?? ''}
      onChange={(e) => setInputValue(e.target.value)}
      // onFocus={() => select(address)}
    />
  )
}

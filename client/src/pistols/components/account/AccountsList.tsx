import React, { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Radio, Input } from 'semantic-ui-react'
import { useDojo, useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import useLocalStorageState from 'use-local-storage-state'

const Row = Grid.Row
const Col = Grid.Column

export function AccountsList() {
  const router = useRouter()
  const [burners] = useLocalStorageState('burners')
  const {
    account: { create, list, get, select, clear, account, isMasterAccount, isDeploying }
  } = useDojo()
  console.log(burners)
  
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
          <Col>no accounts created</Col>
        </Row>
      )
    }
    return result
  }, [account?.address, isDeploying, burners])

  const { isRegistered } = useDuelist(account.address)
  const canEnter = useMemo(() => (!isMasterAccount && !isDeploying && isRegistered), [isMasterAccount, isDeploying, isRegistered])

  return (
    <>
      <Grid className='Faded'>
        {rows}
        <Row textAlign='center' columns={'equal'}>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => create()} label='CREATE ACCOUNT' />
          </Col>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => clear()} label='DELETE ALL ACCOUNTS (+refresh)' />
          </Col>
        </Row>
      </Grid>
      <br />
      <ActionButton fill large disabled={!canEnter} onClick={() => router.push('/tavern')} label='ENTER THE TAVERN' />
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
  const inputRef = useRef(null)

  // current name from Dojo
  const { name, profilePic, isRegistered } = useDuelist(address)

  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : (Number(BigInt(address) % BigInt(parseInt(process.env.PROFILE_PIC_COUNT))) + 1)
    )
  }, [selectedProfilePic, profilePic])

  const defaultAccountName = useMemo(() => (`ACCOUNT-${index + 1}`), [index])
  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue && profilePic == _profilePic), [name, inputValue, profilePic, _profilePic])
  const canRegister = useMemo(() => (isSelected && account && address), [isSelected, address])
  // console.log(isUpdated, name, inputValue, profilePic, selectedProfilePic, _profilePic)

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
      register_duelist(account, inputValue, _profilePic)
    }
  }

  return (
    <Row textAlign='center' verticalAlign='middle'>
      <Col width={1}>
        <Radio checked={isSelected} onClick={() => select(address)} />
      </Col>
      <Col width={3}>
        <AccountShort address={address} />
      </Col>
      <Col width={1} className='NoPadding'>
        <ProfilePicSquareButton
          profilePic={_profilePic}
          onClick={() => setSelectedProfilePic(_profilePic < parseInt(process.env.PROFILE_PIC_COUNT) ? _profilePic + 1 : 1)}
          disabled={!isSelected}
        />
      </Col>
      <Col width={8}>
        <Input inverted fluid
          // icon='edit'
          label='burner'
          labelPosition='right'
          maxLength={31}
          placeholder={'PLAYER NAME'}
          value={inputValue ?? ''}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isSelected}
          ref={inputRef}
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

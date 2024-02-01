import React, { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Radio, Input, Divider } from 'semantic-ui-react'
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
        <Row key='empty' columns={'equal'} textAlign='center'>
          <Col>
            <h4>No accounts created</h4>
          </Col>
        </Row>
      )
    }
    return result
  }, [account?.address, isDeploying, burners])

  const { isRegistered } = useDuelist(account.address)
  const canEnter = useMemo(() => (!isMasterAccount && !isDeploying && isRegistered), [isMasterAccount, isDeploying, isRegistered])

  return (
    <>
      <Grid className='Faded FillWidth'>
        <Row columns={'equal'} textAlign='center'>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => create()} label='Create Account' />
          </Col>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => clear()} label='Delete All Accounts' />
          </Col>
        </Row>

        <Row columns={'equal'} className='Spacer10'>
          <Col></Col>
        </Row>

        {rows}

        <Row columns={'equal'} className='Spacer10'>
          <Col></Col>
        </Row>

        <Row columns={'equal'} textAlign='center'>
          <Col>
            <ActionButton fill large disabled={!canEnter} onClick={() => router.push('/tavern')} label='Enter The Tavern' />
          </Col>
        </Row>
      </Grid>
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
      <Col width={3} className='NoPadding'>
        <AccountShort address={address} copyLink={false} />
        <ProfilePicSquareButton
          profilePic={_profilePic}
          onClick={() => setSelectedProfilePic(_profilePic < parseInt(process.env.PROFILE_PIC_COUNT) ? _profilePic + 1 : 1)}
          disabled={!isSelected}
        />
      </Col>
      <Col width={12} textAlign='left'>
        <span className='FormLabel'>Duelist Name</span>
        <div className='Spacer5'/>
        <Input fluid
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
        <div className='Spacer5' />
        {!isRegistered
          ? <ActionButton fill disabled={!canRegister || !inputIsValid} onClick={() => _register()} label='Register' />
          : inputValue
            ? <ActionButton fill disabled={!canRegister || isUpdated || !inputIsValid} onClick={() => _register()} label={isUpdated ? 'Registered' : 'Update'} />
            : <ActionButton fill disabled={!canRegister || isUpdated} onClick={() => _register()} label='Unregister' />
        }
      </Col>
    </Row>
  )
}

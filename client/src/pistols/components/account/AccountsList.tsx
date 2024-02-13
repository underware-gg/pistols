import React, { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Radio, Input, Button, Icon } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
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
    create, list, get, select, clear, applyFromClipboard,
    account, isMasterAccount, masterAccount, isDeploying,
  } = useDojoAccount()
  const { dispatchSetMenu } = usePistolsContext()

  const rows = useMemo(() => {
    let result = []
    const burners = list()
    burners.forEach((burner, index) => {
      const isSelected = (burner.address == account.address)
      const key = `${burner.address}_${isSelected ? 1 : 0}`
      result.push(<AccountItem key={key}
        address={burner.address}
        index={index}
        isSelected={isSelected}
      />)
    })
    if (result.length == 0) {
      result.push(
        <Row key='empty' columns={'equal'} textAlign='center'>
          <Col>
            <h4 className='TitleCase Important'>Create a Duelist to Play</h4>
          </Col>
        </Row>
      )
    }
    return result
  }, [account?.address, isDeploying, burners])

  const _enter = (menuKey = MenuKey.Duelists) => {
    dispatchSetMenu(menuKey)
    router.push('/tavern')
  }
  const _enterAsGuest = () => {
    // select(masterAccount.address)
    _enter(MenuKey.LiveDuels)
  }

  const _clear = () => {
    clear()
    location.reload()
  }

  const { isRegistered } = useDuelist(account.address)
  const canEnter = useMemo(() => (!isMasterAccount && !isDeploying && isRegistered), [isMasterAccount, isDeploying, isRegistered])

  return (
    <>
      <Grid className='Faded FillWidth'>
        <Row columns={'equal'} textAlign='center'>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => create()} label='Create Duelist' />
          </Col>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => applyFromClipboard()} label={<>Import&nbsp;&nbsp;<Icon name='paste' size='small' /></>} />
          </Col>
          <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => _clear()} label='Delete All' />
          </Col>
          {/* <Col>
            <ActionButton fill disabled={isDeploying} onClick={() => applyFromClipboard()} label='Restore' />
          </Col> */}
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
            <ActionButton fill large attention={isRegistered} disabled={!canEnter} onClick={() => _enter()} label={!isRegistered ? 'Check In to Enter' : 'Enter The Tavern'} />
          </Col>
        </Row>

        <Row columns={'equal'} className='Spacer10'>
          <Col></Col>
        </Row>

        {isMasterAccount &&
          <Row columns={'equal'} textAlign='center'>
            <Col>
              <ActionButton fill large disabled={!isMasterAccount} onClick={() => _enterAsGuest()} label='Enter As Guest' />
            </Col>
          </Row>
        }
      </Grid>
    </>
  )
}


function AccountItem({
  address,
  index,
  isSelected,
}) {
  const { register_duelist } = useDojoSystemCalls()
  const { account, copyToClipboard, select, get } = useDojoAccount()
  const inputRef = useRef(null)

  const exists = true
  // const exists = useMemo(() => {
  //   try {
  //     const account = get(address)
  //     console.log(account, true)
  //   } catch {
  //     console.log(address, false)
  //     return false
  //   }
  //   console.log(address, true)
  //   return true
  // }, [address])

  // current name from Dojo
  const { name, profilePic, isRegistered } = useDuelist(address)

  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const _profilePicCount = parseInt(process.env.PROFILE_PIC_COUNT)
  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : (Number(BigInt(address) % BigInt(_profilePicCount)) + 1)
    )
  }, [selectedProfilePic, profilePic])

  const defaultAccountName = useMemo(() => (`ACCOUNT-${index + 1}`), [index])
  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue && profilePic == _profilePic), [name, inputValue, profilePic, _profilePic])
  const canEdit = useMemo(() => (exists && isSelected), [exists, isSelected])
  const canRegister = useMemo(() => (canEdit && account && address), [canEdit, account, address])
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

  const _export = () => {
    if (isSelected) {
      copyToClipboard()
    }
  }

  return (
    <Row textAlign='center' verticalAlign='middle'>
      <Col width={1}>
        <Radio checked={isSelected} onClick={() => select(address)} />
      </Col>
      <Col width={3} className='NoPadding'>
        <AccountShort address={address} copyLink={false} />
        <div className='Relative'>
          <ProfilePicSquareButton
            profilePic={_profilePic}
            onClick={() => select(address)}
            // disabled={!canEdit}
            dimmed={!canEdit}
          />
          {canEdit && <>
            <div className='ProfilePicLeftButton'
              onClick={() => setSelectedProfilePic(_profilePic > 1 ? _profilePic - 1 : _profilePicCount)}
            >◀</div>
            <div className='ProfilePicRightButton'
              onClick={() => setSelectedProfilePic(_profilePic < _profilePicCount ? _profilePic + 1 : 1)}
            >▶</div>
          </>}
        </div>
      </Col>
      <Col width={12} textAlign='left'>
        <span className='FormLabel TitleCase'>Duelist Name</span>
        <div className='Spacer5' />
        <Input fluid
          maxLength={31}
          placeholder={'Duelist Name'}
          value={inputValue ?? ''}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!canEdit}
          ref={inputRef}
        >
          <input />
          &nbsp;&nbsp;&nbsp;
          <Button type='submit' disabled={!canEdit} className='FillHeight' onClick={() => _export()}>Export&nbsp;&nbsp;<Icon name='copy' size='small' /></Button>
        </Input>
        <div className='Spacer5' />
        {!isRegistered
          ? <ActionButton fill disabled={!canRegister || !inputIsValid} onClick={() => _register()} label={exists?'Check In':'Duelist not Found'} />
          : inputValue
            ? <ActionButton fill disabled={!canRegister || isUpdated || !inputIsValid} onClick={() => _register()} label={isUpdated ? 'Checked In' : 'Update'} />
            : <ActionButton fill disabled={!canRegister || isUpdated} onClick={() => _register()} label='Unregister' />
        }
      </Col>
    </Row>
  )
}

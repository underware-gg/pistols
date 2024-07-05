import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useBurnerAccount } from '@/lib/dojo/hooks/useBurnerAccount'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { TextLink } from '@/lib/ui/Links'
import { IconClick } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingProfile({
}) {
  const { register_duelist } = useDojoSystemCalls()
  const { accountIndex } = usePistolsContext()
  const { address } = useBurnerAccount(accountIndex)
  const { account } = useDojoAccount()

  const { name, profilePic, isRegistered } = useDuelist(address)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : (Number(BigInt(address ?? 0n) % BigInt(PROFILE_PIC_COUNT)) + 1)
    )
  }, [selectedProfilePic, profilePic, address])

  const defaultAccountName = useMemo(() => (`Duelist #${accountIndex}`), [accountIndex])
  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue && profilePic == _profilePic), [name, inputValue, profilePic, _profilePic])
  const canRegister = useMemo(() => (inputIsValid && account && address), [inputIsValid, account, address])
  // console.log(isUpdated, name, inputValue, profilePic, selectedProfilePic, _profilePic)

  useEffect(() => {
    setInputValue(name ?? '')
  }, [name])

  const _register = () => {
    if (canRegister) {
      register_duelist(account, 0n, inputValue, _profilePic)
    }
  }

  return (
    <div className='Padded'>
      <Grid>
        <Row textAlign='center' verticalAlign='top'>
          <Col width={5} className='NoPadding'>
            <div>
              <ProfilePic profilePic={_profilePic} className='AutoHeight NoBorder' />
              <Grid columns={'equal'}>
                <Row className='H3'>
                  <Col>
                    <IconClick name='angle double left' size={null}
                      onClick={() => setSelectedProfilePic(_profilePic > 1 ? _profilePic - 1 : PROFILE_PIC_COUNT)}
                    />
                  </Col>
                  <Col>
                    <IconClick name='angle double right' size={null}
                      onClick={() => setSelectedProfilePic(_profilePic < PROFILE_PIC_COUNT ? _profilePic + 1 : 1)}
                    />
                  </Col>
                </Row>
              </Grid>
            </div>
          </Col>
          <Col width={11} textAlign='left' className='Padded'>
            <span className='FormLabel TitleCase'>Duelist Name</span>
            <div className='Spacer5' />
            <Input fluid
              maxLength={31}
              placeholder={defaultAccountName}
              value={inputValue ?? ''}
              disabled={!account || !address}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className='Spacer5' />
            <ActionButton important fill disabled={!canRegister || isUpdated || !inputIsValid} onClick={() => _register()} label={isUpdated ? 'Good!' : 'Check In'} />
          </Col>
        </Row>

      </Grid>
    </div>
  )
}


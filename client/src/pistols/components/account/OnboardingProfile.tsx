import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { IconClick } from '@/lib/ui/Icons'
import { useSettings } from '@/pistols/hooks/SettingsContext'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingProfile({
}) {
  const { update_duelist } = useDojoSystemCalls()
  const { accountIndex } = usePistolsContext()
  const { duelistId } = useSettings()
  const { account, address } = useAccount()

  const { name, profilePic, isRegistered } = useDuelist(duelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : (Number((BigInt(address ?? 0n) + BigInt(duelistId)) % BigInt(PROFILE_PIC_COUNT)) + 1)
    )
  }, [selectedProfilePic, profilePic, address])

  const defaultAccountName = useMemo(() => (`Duelist #${accountIndex}`), [accountIndex])
  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue && profilePic == _profilePic), [name, inputValue, profilePic, _profilePic])
  const canRegister = useMemo(() => (inputIsValid && duelistId && account), [inputIsValid, duelistId, account])
  // console.log(isUpdated, name, inputValue, profilePic, selectedProfilePic, _profilePic)

  useEffect(() => {
    setInputValue(name ?? '')
  }, [name])

  const _register = () => {
    if (canRegister) {
      update_duelist(account, duelistId, inputValue, 1, _profilePic.toString())
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


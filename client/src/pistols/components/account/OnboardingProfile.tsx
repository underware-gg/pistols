import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Input } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useDuelistBalanceOf } from '@/pistols/hooks/useTokenDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { IconClick } from '@/lib/ui/Icons'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { pedersen } from '@/lib/utils/starknet'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingProfile({
}) {
  const { mint_duelist, update_duelist } = useDojoSystemCalls()
  const { duelistId } = useSettings()
  const { account, address } = useAccount()

  const { name, profilePic } = useDuelist(duelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)
  const { duelistBalance } = useDuelistBalanceOf(address)

  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : Number(pedersen(address ?? 0, duelistBalance) % BigInt(PROFILE_PIC_COUNT)) + 1
    )
  }, [selectedProfilePic, profilePic, address, duelistBalance])

  const [inputValue, setInputValue] = useState(null)
  const inputIsValid = useMemo(() => (inputValue?.length >= 3), [inputValue])
  const isUpdated = useMemo(() => (name == inputValue && profilePic == _profilePic), [name, inputValue, profilePic, _profilePic])

  const isNew = !Boolean(duelistId)
  const canSubmit = (inputIsValid && account && !isUpdated)

  useEffect(() => {
    setInputValue(name ?? '')
  }, [name])

  const _submit = () => {
    if (canSubmit) {
      if (isNew) {
        mint_duelist(account, inputValue, 1, _profilePic.toString())
      } else {
        update_duelist(account, duelistId, inputValue, 1, _profilePic.toString())
      }
    }
  }

  const _submitLabel = isUpdated ? 'Duelist Updated' : isNew ? 'Mint New Duelist' : 'Update Duelist'

  return (
    <Grid className='OnboardingProfile'>
      <Row textAlign='center' verticalAlign='top'>
        <Col width={5} className='NoPadding'>
          <div>
            <ProfilePic profilePic={_profilePic} className='AutoHeight NoBorder' />
            <Grid columns={'equal'} className='NoPadding'>
              <Row className='H5'>
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
        <Col width={11} textAlign='left' className='PaddedSides'>
          <span className='FormLabel TitleCase'>Duelist Name</span>
          <div className='Spacer5' />
          <Input fluid
            maxLength={31}
            placeholder={'Duelist Name'}
            value={inputValue ?? ''}
            disabled={!account || !address}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className='Spacer5' />
          <ActionButton important fill disabled={!canSubmit} onClick={() => _submit()} label={_submitLabel} />
        </Col>
      </Row>

    </Grid>
  )
}


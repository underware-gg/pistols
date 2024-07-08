import React, { useEffect, useMemo, useState } from 'react'
import { Button, ButtonGroup, Grid, Input, Pagination } from 'semantic-ui-react'
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
import { Archetype, ArchetypeNames } from '@/pistols/utils/pistols'
import { ArchetypeIcon } from '../ui/PistolsIcon'
import { ProfileBadge } from './ProfileDescription'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingProfile({
}) {
  const { mint_duelist, update_duelist } = useDojoSystemCalls()
  const { duelistId } = useSettings()
  const { account, address } = useAccount()

  const { name, profilePic, archetypeName } = useDuelist(duelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)
  const { duelistBalance } = useDuelistBalanceOf(address)

  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : Number(pedersen(address ?? 0, duelistBalance) % BigInt(PROFILE_PIC_COUNT)) + 1
    )
  }, [selectedProfilePic, profilePic, address, duelistBalance])

  const [inputName, setInputName] = useState(null)
  const [inputArchetype, setInputArchetype] = useState(Archetype.Undefined)
  const inputIsValid = useMemo(() => (inputName?.length >= 3), [inputName])
  const isUpdated = useMemo(() => (name == inputName && profilePic == _profilePic), [name, inputName, profilePic, _profilePic])

  const isNew = !Boolean(duelistId)
  const canSubmit = (inputIsValid && account && !isUpdated)

  useEffect(() => {
    setInputName(name ?? '')
  }, [name])

  const _submit = () => {
    if (canSubmit) {
      if (isNew) {
        mint_duelist(account, inputName, 1, _profilePic.toString(), inputArchetype)
      } else {
        update_duelist(account, duelistId, inputName, 1, _profilePic.toString())
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
          <Input fluid
            maxLength={31}
            placeholder={'Duelist Name'}
            value={inputName ?? ''}
            disabled={!account || !address}
            onChange={(e) => setInputName(e.target.value)}
          />

          <div className='Spacer10' />
          <span className='FormLabel TitleCase'>Archetype: <b>{isNew ? ArchetypeNames[inputArchetype] : archetypeName}</b></span>
          {isNew &&
            <div>
              <Button icon toggle active={inputArchetype == Archetype.Undefined} onClick={() => setInputArchetype(Archetype.Undefined)}>
                <ArchetypeIcon size='big' />
              </Button>
              &nbsp;&nbsp;
              <Button icon toggle active={inputArchetype == Archetype.Villainous} onClick={() => setInputArchetype(Archetype.Villainous)}>
                <ArchetypeIcon villainous size='big' />
              </Button>
              &nbsp;&nbsp;
              <Button icon toggle active={inputArchetype == Archetype.Trickster} onClick={() => setInputArchetype(Archetype.Trickster)}>
                <ArchetypeIcon trickster size='big' />
              </Button>
              &nbsp;&nbsp;
              <Button icon toggle active={inputArchetype == Archetype.Honourable} onClick={() => setInputArchetype(Archetype.Honourable)}>
                <ArchetypeIcon honourable size='big' />
              </Button>
            </div>
          }
          {!isNew && <h3><ProfileBadge duelistId={duelistId} /></h3>}

          <div className='Spacer10' />
          <div className='Spacer10' />
          <div className='Spacer10' />
          <ActionButton important fill disabled={!canSubmit} onClick={() => _submit()} label={_submitLabel} />
        </Col>
      </Row>

    </Grid>
  )
}


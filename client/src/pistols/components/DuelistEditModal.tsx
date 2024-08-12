import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Grid } from 'semantic-ui-react'
import { pedersen } from '@/lib/utils/starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useDuelistBalanceOf, useDuelistOfOwnerByIndex } from '@/pistols/hooks/useTokenDuelist'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileBadge } from '@/pistols/components/account/ProfileDescription'
import { ArchetypeIcon } from '@/pistols/components/ui/PistolsIcon'
import { FormInput } from '@/pistols/components/ui/Form'
import { Archetype } from '@/games/pistols/generated/constants'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { ArchetypeNames } from '@/pistols/utils/pistols'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistEditModal({
  opener,
}: {
  opener: Opener
}) {
  const { account, address } = useAccount()
  const { duelistId, dispatchDuelistId } = useSettings()

  // watch new mints
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { duelistId: lastDuelistId } = useDuelistOfOwnerByIndex(address, duelistBalance - 1)
  useEffect(() => {
    if (lastDuelistId) {
      dispatchDuelistId(lastDuelistId)
    }
  }, [lastDuelistId])

  const { mint_duelist, update_duelist } = useDojoSystemCalls()

  const { name, profilePic, score: { archetypeName } } = useDuelist(duelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const randomPic = useMemo(() => (Number(pedersen(address ?? 0, duelistBalance) % BigInt(PROFILE_PIC_COUNT)) + 1), [address, duelistBalance])
  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : randomPic
    )
  }, [selectedProfilePic, profilePic, randomPic])

  const [inputName, setInputName] = useState(null)
  const [inputArchetype, setInputArchetype] = useState(Archetype.Undefined)
  const inputIsValid = useMemo(() => (inputName?.length >= 3), [inputName])
  const isUpdated = useMemo(() => (name == inputName && profilePic == _profilePic), [name, inputName, profilePic, _profilePic])

  const isNew = !Boolean(duelistId)
  const canSubmit = (inputIsValid && account && !isUpdated)

  useEffect(() => {
    setInputName(name ?? '')
    setSelectedProfilePic(profilePic ?? randomPic)
  }, [name, profilePic])

  const _submit = () => {
    if (canSubmit) {
      if (isNew) {
        mint_duelist(account, inputName, 1, _profilePic.toString(), inputArchetype)
      } else {
        update_duelist(account, duelistId, inputName, 1, _profilePic.toString())
      }
    }
  }

  const _submitLabel = isUpdated ? 'Duelist up-to-date' : isNew ? 'Mint New Duelist' : 'Update Duelist'

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        Duelist #{duelistId ? Number(duelistId) : '?'}
      </Modal.Header>

      <Modal.Content className='ModalText DuelistEditModal'>
        <Grid className='OnboardingProfile'>
          <Row textAlign='center' verticalAlign='top'>
            <Col width={1} verticalAlign='bottom'>
              <IconClick name='angle double left' size={'large'} important
                onClick={() => setSelectedProfilePic(_profilePic > 1 ? _profilePic - 1 : PROFILE_PIC_COUNT)}
              />
            </Col>
            <Col width={5} textAlign='left' className='PaddedSides'>
              <ProfilePic profilePic={_profilePic} className='AutoHeight NoBorder' />
            </Col>
            <Col width={1} verticalAlign='bottom'>
              <IconClick name='angle double right' size={'large'} important
                onClick={() => setSelectedProfilePic(_profilePic < PROFILE_PIC_COUNT ? _profilePic + 1 : 1)}
              />
            </Col>
            <Col width={9} textAlign='left' className='PaddedSides'>
              <FormInput
                label='Duelist Name'
                placeholder={'Duelist Name'}
                value={inputName}
                setValue={setInputName}
                maxLength={31}
                disabled={!account || !address}
              />

              <div className='Spacer10' />
              {isNew &&
                <div>
                  <Divider />
                  <Button icon toggle active={inputArchetype == Archetype.Undefined} onClick={() => setInputArchetype(Archetype.Undefined)}>
                    <ArchetypeIcon size={null} />
                  </Button>
                  &nbsp;&nbsp;
                  <Button icon toggle active={inputArchetype == Archetype.Villainous} onClick={() => setInputArchetype(Archetype.Villainous)}>
                    <ArchetypeIcon villainous size={null} />
                  </Button>
                  &nbsp;&nbsp;
                  <Button icon toggle active={inputArchetype == Archetype.Trickster} onClick={() => setInputArchetype(Archetype.Trickster)}>
                    <ArchetypeIcon trickster size={null} />
                  </Button>
                  &nbsp;&nbsp;
                  <Button icon toggle active={inputArchetype == Archetype.Honourable} onClick={() => setInputArchetype(Archetype.Honourable)}>
                    <ArchetypeIcon honourable size={null} />
                  </Button>
                  <div className='Spacer10' />
                  <span className='FormLabel TitleCase'>Archetype: <b>{ArchetypeNames[inputArchetype]}</b></span>
                </div>
              }
              {!isNew &&
                <div className='FormLabel TitleCase'>
                  <Divider />
                  <ProfileBadge duelistId={duelistId} />
                  {' '}
                  <b>{archetypeName}</b>
                </div>
              }
            </Col>
          </Row>
        </Grid>
      </Modal.Content>

      <Modal.Actions className='NoPadding'>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton important fill disabled={!canSubmit} onClick={() => _submit()} label={_submitLabel} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useDojoSystemCalls, useLordsFaucet } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistsOfPlayer, useNextRandomProfilePic } from '/src/hooks/useDuelistToken'
import { useDuelist } from '/src/stores/duelistStore'
import { useCalcFeeDuelist } from '/src/hooks/useContractCalls'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ProfileBadge } from '/src/components/account/ProfileDescription'
import { FormInput } from '/src/components/ui/Form'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { PROFILE_PIC_COUNT } from '/src/utils/constants'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { SceneName } from '/src/data/assets'
import { Opener } from '/src/hooks/useOpener'
import { Divider } from '/src/components/ui/Divider'
import { IconClick } from '/src/components/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistEditModal({
  opener,
}: {
  opener: Opener
}) {
  const { mintNew } = opener.props

  const { account, address } = useAccount()
  const { duelistId, dispatchDuelistId } = useSettings()
  const editingDuelistId = (mintNew ? 0n : duelistId)

  // watch new mints
  const { duelistIds } = useDuelistsOfPlayer()

  // Detect new mints
  const { dispatchSetScene } = usePistolsScene()
  const [duelistCountBeforeMint, setDuelistCountBeforeMint] = useState<number>(null)
  const { mintLords, hasFaucet } = useLordsFaucet()
  useEffect(() => {
    // minted new! go to Game...
    if (opener.isOpen &&
      mintNew &&
      duelistCountBeforeMint != null &&
      duelistCountBeforeMint != duelistIds.length
    ) {
      // select duelist
      dispatchDuelistId(duelistIds.at(-1))
      // first duelist... go from Gate to Tavern
      if (duelistIds.length == 1) {
        dispatchSetScene(SceneName.Tavern)
        if (hasFaucet) mintLords(account)
      }
      opener.close()
    }
  }, [mintNew, duelistIds.length])

  const { create_duelist, update_duelist } = useDojoSystemCalls()

  const { name, profilePic, score: { archetypeName } } = useDuelist(editingDuelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const { randomPic } = useNextRandomProfilePic()
  const _profilePic = useMemo(() => {
    return (
      selectedProfilePic ? selectedProfilePic
        : profilePic ? profilePic
          : randomPic
    )
  }, [selectedProfilePic, profilePic, randomPic])

  const [inputName, setInputName] = useState(null)
  const inputIsValid = useMemo(() => (inputName?.length >= 3), [inputName])
  const isUpdated = useMemo(() => (name == inputName && profilePic == _profilePic), [name, inputName, profilePic, _profilePic])

  const canSubmit = (inputIsValid && account && !isUpdated)

  useEffect(() => {
    setInputName(name ?? '')
    setSelectedProfilePic(profilePic ?? randomPic)
  }, [name, profilePic])

  const { fee } = useCalcFeeDuelist()


  const _mint = () => {
    if (canSubmit && mintNew) {
      setDuelistCountBeforeMint(duelistIds.length ?? 0)
      create_duelist(account, address, inputName, constants.ProfilePicType.Duelist, _profilePic.toString())
    }
  }

  const _update = () => {
    if (canSubmit && !mintNew) {
      update_duelist(account, editingDuelistId, inputName, constants.ProfilePicType.Duelist, _profilePic.toString())
    }
  }

  return (
    <Modal
      onClose={() => opener.close()}
      open={opener.isOpen}
      size='tiny'
    >
      <Modal.Header>
        {editingDuelistId ? `Duelist #${Number(editingDuelistId)}` : 'Create Your Duelist'}

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

              <Divider />

              {mintNew &&
                <FeesToPay value={0} fee={fee} prefixed />
              }

              {!mintNew &&
                <div className='FormLabel TitleCase'>
                  Archetype: <b>{archetypeName}</b>
                  {' '}
                  <ProfileBadge duelistId={editingDuelistId} />
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
              <ActionButton large fill label='Close' onClick={() => opener.close()} />
            </Col>
            {mintNew &&
              <Col>
                <BalanceRequiredButton
                  fee={fee}
                  disabled={!canSubmit}
                  label='Create Duelist!'
                  onClick={() => _mint()}
                />
              </Col>
            }
            {!mintNew &&
              <Col>
                <ActionButton large fill important disabled={!canSubmit} onClick={() => _update()} label='Update Duelist' />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

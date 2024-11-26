import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { useCalcFeeDuelist } from '@/pistols/hooks/useContractCalls'
import { useLordsFaucet } from '@/lib/dojo/hooks/useLordsMock'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileBadge } from '@/pistols/components/account/ProfileDescription'
import { FormInput } from '@/pistols/components/ui/Form'
import { ProfilePicType } from '@/games/pistols/generated/constants'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { FeesToPay } from '@/pistols/components/account/LordsBalance'
import { Opener } from '@/lib/ui/useOpener'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'
import { poseidon } from '@/lib/utils/starknet'

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
  const { duelistBalance } = useDuelistsOfOwner(address)

  // Detect new mints
  const { dispatchSetScene } = usePistolsScene()
  const [duelistBalanceBeforeMint, setDuelistBalanceBeforeMint] = useState<number>(null)
  const { mintLords, hasFaucet } = useLordsFaucet()
  useEffect(() => {
    // minted new! go to Game...
    if (opener.isOpen &&
      mintNew &&
      duelistBalanceBeforeMint != null &&
      duelistBalance != duelistBalanceBeforeMint
    ) {
      console.log(`NEW DUELIST BALANCE:`, duelistBalance)
      dispatchDuelistId(duelistBalance)
      dispatchSetScene(SceneName.Tavern)
      if (hasFaucet) mintLords(account)
      opener.close()
    }
  }, [mintNew, duelistBalance])

  const { create_duelist, update_duelist } = useDojoSystemCalls()

  const { name, profilePic, score: { archetypeName } } = useDuelist(editingDuelistId)
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)

  const randomPic = useMemo(() => (Number(poseidon([address ?? 0n, duelistBalance ?? 0n]) % BigInt(PROFILE_PIC_COUNT)) + 1), [address, duelistBalance])
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
      setDuelistBalanceBeforeMint(duelistBalance ?? 0)
      create_duelist(account, address, inputName, ProfilePicType.Duelist, _profilePic.toString())
    }
  }

  const _update = () => {
    if (canSubmit && !mintNew) {
      update_duelist(account, editingDuelistId, inputName, ProfilePicType.Duelist, _profilePic.toString())
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

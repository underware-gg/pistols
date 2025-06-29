import React, { useCallback, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Button, Checkbox, Container, Dropdown, Table } from 'semantic-ui-react'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { Address } from '/src/components/ui/Address'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { useAccount } from '@starknet-react/core'
import { usePlayer, useTeamMembersAccounts } from '/src/stores/playerStore'
import { useDuelistIdsOfOwner } from '/src/hooks/useTokenDuelists'
import { useFetchPacksByPlayer, usePack } from '/src/stores/packStore'
import { usePacksOfOwner } from '/src/hooks/useTokenPacks'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { useValidateWalletAddress } from '@underware/pistols-sdk/utils/hooks'
import { WalletAddressRow } from './AdminPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { useDuelist, useFetchDuelistIdsByPlayer } from '/src/stores/duelistStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { FormSelectFromMap } from '/src/components/ui/Form'
import { DuelistProfileKey, getCollectionProfileKeys } from '@underware/pistols-sdk/pistols'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function AirdropPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
          <DuellistAirDropper />
          <br />
        </InternalPageWrapper>

        <EntityStoreSync />
        <PlayerNameSync />
        <TokenStoreSync />
      </Container>
    </AppDojo>
  );
}


//--------------------------------
// Team Members
//

function DuellistAirDropper() {
  const { account } = useAccount()
  const { pack_token } = useDojoSystemCalls()
  const [address, setAddress] = useState('')
  const { isStarknetAddress } = useValidateWalletAddress(address)

  // select properties
  const [packType, setPackType] = useState<constants.PackType>(constants.PackType.SingleDuelist)
  const [collection, setCollection] = useState<constants.DuelistProfile>()
  const [profileKey, setProfileKey] = useState<DuelistProfileKey>()
  useMemo(() => {
    setCollection(undefined);
    setProfileKey(undefined);
  }, [packType])

  const canAirdrop = useMemo(() => {
    return isStarknetAddress && packType && (
      packType != constants.PackType.SingleDuelist || (collection && profileKey)
    )
  }, [isStarknetAddress, packType, collection, profileKey])

  const _airdrop = useCallback(() => {
    pack_token.airdrop(account, address, packType, collection, profileKey)
  }, [account, address, packType, collection, profileKey])
  return (
    <>
      <Table celled striped size='small' color='green'>
        <Header>
          <Row>
            <HeaderCell width={3}><h3>Airdrop Packs</h3></HeaderCell>
            <HeaderCell></HeaderCell>
            <HeaderCell></HeaderCell>
          </Row>
        </Header>
        <Body>
          <WalletAddressRow address={address} setAddress={setAddress} label='Recipient Wallet' />
          <Row>
            <Cell className='Code'>
              Pack Type
            </Cell>
            <Cell>
              <PackTypeSelector packType={packType} setPackType={setPackType} />
            </Cell>
          </Row>
          <Row>
            <Cell className='Code'>
              Collection
            </Cell>
            <Cell>
              <DuelistProfileSelector packType={packType} collection={collection} setCollection={setCollection} />
            </Cell>
          </Row>
          <Row>
            <Cell className='Code'>
              Duelist Profile
            </Cell>
            <Cell>
              <ProfileKeySelector packType={packType} collection={collection} profileKey={profileKey} setProfileKey={setProfileKey} />
            </Cell>
          </Row>
          <Row>
            <Cell></Cell>
            <Cell>
              <Button disabled={!canAirdrop} onClick={_airdrop}>Airdrop...</Button>
              &nbsp;&nbsp;
              <span className='Code'>
                [{packType}][{collection}][{profileKey}]
              </span>
            </Cell>
          </Row>
        </Body>
      </Table>
      <PlayerTokens address={address} />
    </>
  )
}


function PlayerTokens({
  address,
}: {
  address: BigNumberish
}) {
  useFetchDuelistIdsByPlayer(address)
  useFetchPacksByPlayer(address)
  const { duelistIds } = useDuelistIdsOfOwner(address)
  const { packIds } = usePacksOfOwner(address)
  return (
    <Table celled striped size='small'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Player Tokens</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <PlayerNameRow address={address} />
      <Body>
        {packIds.length == 0 && <PackTokenRow packId={0} packNumber={0} total={0} />}
        {packIds.map((packId, index) => (
          <PackTokenRow key={bigintToDecimal(packId)} packId={packId} packNumber={index + 1} total={packIds.length} />
        ))}
        {duelistIds.length == 0 && <DuelistTokenRow duelistId={0} duelistNumber={0} total={0} />}
        {duelistIds.map((duelistId, index) => (
          <DuelistTokenRow key={bigintToDecimal(duelistId)} duelistId={duelistId} duelistNumber={index + 1} total={duelistIds.length} />
        ))}
      </Body>
    </Table>
  )
}

function PlayerNameRow({
  address,
}: {
  address: BigNumberish
}) {
  const { name } = usePlayer(address)
  return (
    <Row>
      <Cell className='Code Important'>
        {name ?? '?'}
      </Cell>
      <Cell className='Code Important'>
        {name && <Address address={address} full />}
      </Cell>
      <Cell className='Code'>
        {name && <ExplorerLink address={address} voyager />}
      </Cell>
    </Row>
  )
}

function DuelistTokenRow({
  duelistId,
  duelistNumber,
  total,
}: {
  duelistId: BigNumberish
  duelistNumber: number
  total: number
}) {
  const { duelistIdDisplay, profileType, profileKey } = useDuelist(duelistId)
  return (
    <Row className='H5'>
      <Cell className='Code'>
        {duelistIdDisplay ?? '...'}
      </Cell>
      <Cell className='Code'>
        {`${profileType ?? '...'}: (${profileKey ?? '...'})`}
      </Cell>
      <Cell className='Code'>
        {`Duelist ${duelistNumber} / ${total}`}
      </Cell>
    </Row>
  )
}


function PackTokenRow({
  packId,
  packNumber,
  total,
}: {
  packId: BigNumberish
  packNumber: number
  total: number
}) {
  const { packIdDisplay, packType, contents } = usePack(packId)
  return (
    <Row className='H5'>
      <Cell className='Code'>
        {packIdDisplay ?? '...'}
      </Cell>
      <Cell className='Code'>
        {`${packType ?? '...'}: (${contents ?? '...'})`}
      </Cell>
      <Cell className='Code'>
        {`Pack ${packNumber} / ${total}`}
      </Cell>
    </Row>
  )
}



//--------------------------------
// Selectors
//

function PackTypeSelector({
  packType,
  setPackType,
}: {
  packType: constants.PackType
  setPackType: (packType: constants.PackType) => void
}) {
  const options = useMemo(() => [
    constants.PackType.GenesisDuelists5x,
    constants.PackType.FreeDuelist,
    constants.PackType.SingleDuelist,
  ].map((p) => ({
    key: `${p}`,
    value: `${p}`,
    text: `${p} (${constants.PACK_TYPES[p].contents})`,
  })), [])
  return (
    <Dropdown
      value={packType}
      options={options}
      onChange={(e, { value }) => setPackType(value as constants.PackType)}
      button
      fluid
    />
  )
}

function DuelistProfileSelector({
  packType,
  collection,
  setCollection,
}: {
  packType: constants.PackType
  collection: constants.DuelistProfile
  setCollection: (collection: constants.DuelistProfile) => void
}) {
  const disabled = (packType !== constants.PackType.SingleDuelist);
  const options = useMemo(() => [
    constants.DuelistProfile.Genesis,
    constants.DuelistProfile.Legends,
  ].map((p) => ({
    key: `${p}`,
    value: `${p}`,
    text: `${p}`,
  })), [])
  return (
    <Dropdown
      placeholder='Select Collection'
      value={collection}
      options={options}
      onChange={(e, { value }) => setCollection(value as constants.DuelistProfile)}
      disabled={disabled}
      button
      fluid
    />
  )
}


function ProfileKeySelector({
  packType,
  collection,
  profileKey,
  setProfileKey,
}: {
  packType: constants.PackType
  collection: constants.DuelistProfile
  profileKey: DuelistProfileKey
  setProfileKey: (profileKey: DuelistProfileKey) => void
}) {
  const disabled = (packType !== constants.PackType.SingleDuelist);
  const options = useMemo(() => (
    getCollectionProfileKeys(collection)
      .filter((p) => p != 'Unknown')
      .map((p) => ({
        key: `${p}`,
        value: `${p}`,
        text: `${p}`,
      })
      )), [packType, collection])

  return (
    <Dropdown
      placeholder='Select Profile'
      value={profileKey}
      options={options}
      onChange={(e, { value }) => setProfileKey(value as DuelistProfileKey)}
      disabled={disabled}
      button
      fluid
    />
  )
}
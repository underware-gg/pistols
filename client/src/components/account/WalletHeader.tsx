import React, { useEffect, useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useDojoSetup, useConnectedController } from '@underware/pistols-sdk/dojo'
import { getConnectorIcon } from '@underware/pistols-sdk/pistols/dojo'
import { makeProfilePicUrl } from '@underware/pistols-sdk/pistols'
import { useSettings } from '/src/hooks/SettingsContext'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { FoolsBalance, LordsBalance } from '/src/components/account/LordsBalance'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { ActionButton } from '/src/components/ui/Buttons'
import { Address } from '/src/components/ui/Address'
import { ConnectButton } from '/src/components/scenes/ScDoor'
import { SceneName } from '/src/data/assets'
import { usePlayerAvatar } from '/src/stores/playerStore'
import { emitter } from '/src/three/game'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletHeader({
}) {
  const { disconnect } = useDisconnect()
  const { address, isConnected, connector } = useAccount()
  const { selectedNetworkConfig } = useDojoSetup()
  const { lordsContractAddress } = useTokenContracts()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const { hasFinishedTutorial } = useSettings()
  const { avatarUrl } = usePlayerAvatar(address)

  // BUG: https://github.com/apibara/starknet-react/issues/419
  // const { data, error, isLoading } = useStarkProfile({ address, enabled: false })
  // console.log(data)
  const data = { name: null, profilePicture: null }

  const connectionName = useMemo(() => (data?.name ?? `Connected to ${selectedNetworkConfig.name}`), [data])
  // const imageUrl = useMemo(() => (data?.profilePicture ?? getConnectorIcon(connector) ?? makeProfilePicUrl(0)), [data, connector])
  const imageUrl = useMemo(() => (avatarUrl ?? getConnectorIcon(connector) ?? makeProfilePicUrl(0)), [data, connector, avatarUrl])

  const { username, openProfile } = useConnectedController()

  useEffect(() => {
    emitter.emit('player_username', username)
  }, [username])

  return (
    <Grid className='WalletHeader'>
      <Row className='TitleCase Padded'>
        <Col width={4} verticalAlign='middle'>
          {/* <Image src={imageUrl} className='ProfilePicMedium' /> */}
          <ProfilePic profilePicUrl={imageUrl} medium removeBorder className='ProfilePicMargin' />
        </Col>
        <Col width={12} textAlign='left'>
          {isConnected && <>
            <h4>{connectionName}</h4>
            {username && <span className='H4 Bold'>{username} <span className='Inactive'>|</span> </span>} <Address address={address ?? 0n} />
            <h5>
              LORDS: <LordsBalance address={address} />
              <span className='Inactive'> | </span>
              FOOLS: <FoolsBalance address={address} />
              {/* <EtherBalance address={address} /> */}
            </h5>
          </>}
          {!isConnected && <>
            <h4>Guest</h4>
            <h5>
              Connect a Controller account
              <br />
              to start playing
            </h5>
          </>}
        </Col>
      </Row>

      {isConnected &&
        <Row columns={'equal'}>
          {lordsContractAddress &&
            <Col verticalAlign='middle'>
              <LordsFaucet fill />
            </Col>
          }
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => dispatchSelectPlayerAddress(address)} label='Profile Poster' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill disabled={!openProfile} onClick={() => openProfile()} label='Inventory' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => {
              dispatchSetScene(SceneName.Gate)
              disconnect()

            }} label='Disconnect' />
          </Col>
        </Row>
      }

      <Row columns={'equal'} style={{ display: isConnected ? 'none' : undefined }}>
        {!hasFinishedTutorial &&
          <Col verticalAlign='middle'>
            <ConnectButton large={false} label='Play Tutorial' enterScene={SceneName.Tutorial} />
          </Col>
        }
        <Col verticalAlign='middle'>
          <ConnectButton large={false} label='Connect' />
        </Col>
      </Row>
    </Grid>
  )
}



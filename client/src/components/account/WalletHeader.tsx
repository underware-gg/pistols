import React, { useMemo } from 'react'
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
import { ConnectButton, PlayGameButton } from '/src/components/scenes/ScDoor'
import { SceneName } from '/src/data/assets'
import { useDiscordSocialLink } from '/src/stores/eventsModelStore'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletHeader({
}) {
  const { disconnect } = useDisconnect()
  const { account, address, isConnected, connector } = useAccount()
  const { selectedNetworkConfig } = useDojoSetup()
  const { lordsContractAddress } = useTokenContracts()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const { hasFinishedTutorial } = useSettings()
  const { avatarUrl, isLinked } = useDiscordSocialLink(address)

  // BUG: https://github.com/apibara/starknet-react/issues/419
  // const { data, error, isLoading } = useStarkProfile({ address, enabled: false })
  // console.log(data)
  const data = { name: null, profilePicture: null }

  const connectionName = useMemo(() => (data?.name ?? `Connected to ${selectedNetworkConfig.name}`), [data])
  // const imageUrl = useMemo(() => (data?.profilePicture ?? getConnectorIcon(connector) ?? makeProfilePicUrl(0)), [data, connector])
  const imageUrl = useMemo(() => (isLinked ? avatarUrl : getConnectorIcon(connector) ?? makeProfilePicUrl(0)), [data, connector, avatarUrl, isLinked])

  const { username, openProfile } = useConnectedController()

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
              <LordsFaucet fill account={account} />
            </Col>
          }
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => dispatchSelectPlayerAddress(address)} label='Profile' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill disabled={!openProfile} onClick={() => openProfile()} label='Account' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => {
              dispatchSetScene(SceneName.Gate)
              disconnect()

            }} label='Disconnect' />
          </Col>
        </Row>
      }

      {!isConnected &&
        <Row columns={'equal'}>
          {!hasFinishedTutorial &&
            <Col verticalAlign='middle'>
              <PlayGameButton large={false} />
            </Col>
          }
          <Col verticalAlign='middle'>
            <ConnectButton large={false} label='Connect' />
          </Col>
        </Row>
      }
    </Grid>
  )
}



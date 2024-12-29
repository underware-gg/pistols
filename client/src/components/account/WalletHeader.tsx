import React, { useMemo } from 'react'
import { Grid, Image } from 'semantic-ui-react'
import { _useConnector } from '@underware_gg/pistols-sdk/fix'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useLordsContract, useSelectedChain, useConnectedController, getConnectorIcon } from '@underware_gg/pistols-sdk/dojo'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { FameBalance, LordsBalance } from '/src/components/account/LordsBalance'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { ActionButton } from '/src/components/ui/Buttons'
import { AddressShort } from '/src/components/ui/AddressShort'
import { makeProfilePicUrl } from '/src/components/account/ProfilePic'
import { SceneName } from '/src/data/assets'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletHeader({
}) {
  const { disconnect } = useDisconnect()
  const { account, address, isConnected } = useAccount()
  const { connectedChainName } = useSelectedChain()
  const { lordsContractAddress } = useLordsContract()
  const { dispatchSetScene } = usePistolsScene()
  const { connector } = _useConnector()

  // BUG: https://github.com/apibara/starknet-react/issues/419
  // const { data, error, isLoading } = useStarkProfile({ address, enabled: false })
  // console.log(data)
  const data = { name: null, profilePicture: null }

  const name = useMemo(() => (data?.name ?? `Connected to ${connectedChainName}`), [data])
  const imageUrl = useMemo(() => (data?.profilePicture ?? getConnectorIcon(connector) ?? makeProfilePicUrl(0, true)), [data, connector])

  const { username, openProfile } = useConnectedController()

  return (
    <Grid>
      <Row className='TitleCase Padded'>
        <Col width={4} verticalAlign='middle'>
          <Image src={imageUrl} className='ProfilePicMedium' />
        </Col>
        {isConnected &&
          <Col width={12} textAlign='left'>
            <h4>{name}</h4>
            {username && <span className='H4 Bold'>{username} <span className='Inactive'>|</span> </span>} <AddressShort address={address ?? 0n} />
            {isConnected &&
              <h5>
                LORDS: <LordsBalance address={address} />
                <span className='Inactive'> | </span>
                FAME: <FameBalance address={address} />
                {/* <EtherBalance address={address} /> */}
              </h5>
            }
            <div className='AbsoluteRight AbsoluteBottom PaddedDouble'>
            </div>
          </Col>
        }
        {!isConnected &&
          <Col width={12} textAlign='left'>
            <h4>Guest</h4>
          </Col>
        }
      </Row>

      {isConnected &&
        <Row columns={'equal'}>
          {lordsContractAddress &&
            <Col verticalAlign='middle'>
              <LordsFaucet fill account={account} />
            </Col>
          }
          <Col verticalAlign='middle'>
            <ActionButton fill disabled={!openProfile} onClick={() => openProfile()} label='Controller' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => {
              dispatchSetScene(SceneName.Gate)
              disconnect()

            }} label='Disconnect' />
          </Col>
        </Row>
      }

    </Grid>
  )
}



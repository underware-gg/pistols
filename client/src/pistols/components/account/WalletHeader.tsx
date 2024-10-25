import React, { useMemo } from 'react'
import { Grid, Image } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useControllerMenu, useControllerUser } from '@/lib/dojo/hooks/useController'
import { getConnectorIcon } from '@/lib/dojo/setup/connectors'
import { LordsBalance } from '@/pistols/components/account/LordsBalance'
import { LordsFaucet } from '@/pistols/components/account/LordsFaucet'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { _useConnector } from '@/lib/dojo/fix/starknet_react_core'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletHeader({
}) {
  const { disconnect } = useDisconnect()
  const { account, address, isConnected } = useAccount()
  const { connectedChainName } = useSelectedChain()
  const { lordsContractAddress } = useLordsContract()
  const { connector } = _useConnector()

  // BUG: https://github.com/apibara/starknet-react/issues/419
  // const { data, error, isLoading } = useStarkProfile({ address, enabled: false })
  // console.log(data)
  const data = { name: null, profilePicture: null }

  const name = useMemo(() => (data?.name ?? `Connected to ${connectedChainName}`), [data])
  const imageUrl = useMemo(() => (data?.profilePicture ?? getConnectorIcon(connector) ?? '/profiles/square/00.jpg'), [data, connector])

  const { username } = useControllerUser()
  const { openMenu } = useControllerMenu()

  return (
    <Grid>
      <Row className='TitleCase Padded'>
        <Col width={4} verticalAlign='middle'>
          <Image src={imageUrl} className='ProfilePicSquare' />
        </Col>
        {isConnected &&
          <Col width={12} textAlign='left'>
            <h4>{name}</h4>
            {username && <span className='H4 Bold'>{username} / </span>} <AddressShort address={address ?? 0n} />
            {isConnected && lordsContractAddress &&
              <h5>
                LORDS: <LordsBalance address={address} big={false} />
                {/* &nbsp;&nbsp;/&nbsp; */}
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
            <ActionButton fill onClick={() => openMenu()} label='Settings' />
          </Col>
          <Col verticalAlign='middle'>
            <ActionButton fill onClick={() => disconnect()} label='Disconnect' />
          </Col>
        </Row>
      }

    </Grid>
  )
}



import React, { useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useLocation, useNavigate } from 'react-router'
import { Container, Menu, MenuItem } from 'semantic-ui-react'
import { TestPageMainMenu } from '/src/pages/tests/TestPageIndex'
import { bigintEquals } from '@underware/pistols-sdk/utils'
import { stringToFelt } from '@underware/pistols-sdk/starknet'
import { ChainId } from '@underware/pistols-sdk/pistols/config'
import App from '/src/components/App'
import { usePlayer } from '/src/stores/playerStore'

const internalPages = [
  { name: 'contracts', connected: true },
  { name: 'admin', connected: true },
  { name: 'airdrop', connected: true },
  { name: 'pools', connected: true },
  { name: 'seasons', connected: true },
  { name: 'matchmaking', connected: true },
  { name: 'quiz', connected: true },
  { name: 'players', connected: true },
  // { name: 'snapshot', connected: true },
]

export default function InternalPageIndex() {
  const [activeItem, setActiveItem] = useState('home')
  const navigate = useNavigate()
  const _click = (name: string) => {
    setActiveItem(name)
    navigate(`/internal/${name}`)
  }
  return (
    <App subtitle='Internal'>
      <Container text>
        <h3>Internal pages</h3>
        <Menu inverted vertical>
          {internalPages.map(page => (
            <MenuItem
              key={page.name}
              name={page.name}
              icon='arrow right'
              active={activeItem === page.name}
              onClick={() => _click(page.name)}
            />
          ))}
        </Menu>
        <br />
        <TestPageMainMenu />
      </Container>
    </App>
  );
}

export function InternalPageMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const _click = (name: string) => {
    navigate(`/internal/${name}`)
  }
  return (
    <>
      <Menu inverted>
        <MenuItem
          icon='arrow left'
          onClick={() => navigate('/internal')}
        />
        {internalPages.map(page => (
          <MenuItem
            style={{ padding: '0.5rem' }}
            key={page.name}
            name={page.name}
            // icon={page.connected ? 'chain' : null}
            active={location.pathname.endsWith(page.name)}
            onClick={() => _click(page.name)}
          />
        ))}
      </Menu>
    </>
  )
}

export function InternalPageWrapper({ children }: { children?: React.ReactNode }) {
  const { address, connector, chainId } = useAccount()
  const { isAdmin, isTeamMember } = usePlayer(address)
  const isAuthorized = useMemo(() => (
    connector?.id === 'predeployed'
    || (chainId && chainId != stringToFelt(ChainId.SN_MAIN))
    || isAdmin || isTeamMember
    || bigintEquals(address, '0x0550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f') // mata
    || bigintEquals(address, '0x052eaece65e70b394f6907fbef609a143466ee0b861bc339306ab54dc8668a25') // reci
    || bigintEquals(address, '0x07e268203c670265e8af497a201d568947db4087438c7fdac2be3b956de73811') // fortuna
    || bigintEquals(address, '0x0638c91e19171822a8521f206530278adf2530e06cb9ae2fb3adfac776ff8a73') // parsa
    || bigintEquals(address, '0x0458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69') // rogers
    || bigintEquals(address, '0x010b685e795f70a7fb32d473878154e38a2668372dfe5d01d6cbdd9309d1be7f') // calc
    || bigintEquals(address, '0x013f1386e3d4267a1502d8ca782d34b63634d969d3c527a511814c2ef67b84c4') // tarrence
    || bigintEquals(address, '0x056c3cd5ed408a22b2932947abfdf69e467cb999d0cde0b51d6055baa009b544') // broody
  ), [address])
  if (!isAuthorized) return <h1>No access</h1>
  return children
}

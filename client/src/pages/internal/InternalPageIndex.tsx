import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Container, Menu, MenuItem } from 'semantic-ui-react'
import { TestPageMainMenu } from '/src/pages/tests/TestPageIndex'
import App from '/src/components/App'
import { useAccount } from '@starknet-react/core'
import { bigintEquals } from '@underware/pistols-sdk/utils'

const internalPages = [
  { name: 'admin', connected: true },
  { name: 'pools', connected: true },
  { name: 'seasons', connected: true },
  { name: 'snapshot', connected: true },
]

export default function InternalPageIndex() {
  const [activeItem, setActiveItem] = useState('home')
  const navigate = useNavigate()
  const _click = (name: string) => {
    setActiveItem(name)
    navigate(`/internal/${name}`)
  }
  return (
    <App>
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
            key={page.name}
            name={page.name}
            icon={page.connected ? 'chain' : null}
            active={location.pathname.endsWith(page.name)}
            onClick={() => _click(page.name)}
          />
        ))}
      </Menu>
    </>
  )
}

export function InternalPageWrapper({ children }: { children?: React.ReactNode }) {
  const { address, connector } = useAccount()
  const isAuthorized = useMemo(() => (
    connector?.id === 'predeployed'
    || bigintEquals(address, '0x0550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f') // mata
    || bigintEquals(address, '0x052eaece65e70b394f6907fbef609a143466ee0b861bc339306ab54dc8668a25') // reci
    || bigintEquals(address, '0x07e268203c670265e8af497a201d568947db4087438c7fdac2be3b956de73811') // fortuna
    || bigintEquals(address, '0x0458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69') // rogers
  ), [address])
  if (!isAuthorized) return <></>
  return children
}

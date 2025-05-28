import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button, Container, Divider, Menu, MenuItem } from 'semantic-ui-react'
import App from '/src/components/App'

const testPages = [
  { name: 'connect', connected: true },
  { name: 'sign', connected: true },
  { name: 'chainswitch', connected: true},
  { name: 'tokens', connected: true },
  { name: 'tutorial', connected: true },
  { name: 'timestamp', connected: true },
  { name: 'profiles', connected: false },
  { name: 'icons', connected: false },
]

export default function TestPageIndex() {
  return (
    <App>
      <Container text>
        <TestPageMainMenu />
      </Container>
    </App>
  );
}

export function TestPageMainMenu() {
  const [activeItem, setActiveItem] = useState('home')
  const navigate = useNavigate()
  const _click = (name: string) => {
    setActiveItem(name)
    navigate(`/tests/${name}`)
  }
  return (
    <>
      <h3>Test pagess</h3>
      <Menu inverted vertical size='small'>
        {testPages.map(page => (
          <MenuItem
            key={page.name}
            name={page.name}
            icon='arrow right'
            active={activeItem === page.name}
            onClick={() => _click(page.name)}
          />
        ))}
      </Menu>
    </>
  );
}

export function TestPageMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const _click = (name: string) => {
    navigate(`/tests/${name}`)
  }
  return (
    <>
      <Menu inverted size='mini'>
        <MenuItem
          icon='arrow left'
          onClick={() => navigate('/tests')}
        />
        {testPages.map(page => (
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

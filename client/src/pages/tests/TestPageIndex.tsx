import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button, Container, Divider, Menu, MenuItem } from 'semantic-ui-react'
import App from '/src/components/App'

const testPages = [
  { name: 'connect', connected: true },
  { name: 'seasons', connected: true },
  { name: 'tokens', connected: true },
  { name: 'tutorial', connected: true },
  { name: 'timestamp', connected: true },
  { name: 'profiles', connected: false },
  { name: 'icons', connected: false },
  // { name: 'sign', connected: true },
]

export default function TestPageIndex() {
  const [activeItem, setActiveItem] = useState('home')
  const navigate = useNavigate()
  const _click = (name: string) => {
    setActiveItem(name)
    navigate(`/tests/${name}`)
  }
  return (
    <App>
      <Container text>
        <Menu inverted vertical>
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
      </Container>
    </App>
  );
}

export function BackToTestPageIndex() {
  const navigate = useNavigate()
  const _click = () => {
    navigate('/tests')
  }
  return <Button onClick={_click} icon='arrow left' content='Tests' />
}

export function TestPageMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const _click = (name: string) => {
    navigate(`/tests/${name}`)
  }
  return (
    <>
      <br />
      <Menu inverted>
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

import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Container, Menu, MenuItem } from 'semantic-ui-react'
import { TestPageMainMenu } from '/src/pages/tests/TestPageIndex'
import App from '/src/components/App'

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

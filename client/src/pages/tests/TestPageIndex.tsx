import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button, Container, Divider, Menu, MenuItem } from 'semantic-ui-react'
import App from '/src/components/App'

const testPages = [
  'connect',
  'tokens',
  'tutorial',
  'profiles',
  'timestamp',
  'icons',
  // 'sign',
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
          {testPages.map(name => (
            <MenuItem
              key={name}
              name={name}
              icon='arrow right'
              active={activeItem === name}
              onClick={() => _click(name)}
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
        {testPages.map(name => (
          <MenuItem
            key={name}
            name={name}
            active={location.pathname.endsWith(name)}
            onClick={() => _click(name)}
          />
        ))}
      </Menu>
    </>
  )
}

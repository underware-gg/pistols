import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Container, Menu, MenuItem } from 'semantic-ui-react'
import App from '/src/components/App'

const testPages = [
  'tokens',
  'profiles',
  'tutorial',
  'connect',
  'timestamp',
  'icons',
  'sign',
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

import React from 'react'
import App from '/src/components/App'
import Logo from '/src/components/Logo'

export default function MaintenancePage() {
  return (
    <App
      subtitle={'Under Maintenance'}
      backgroundImage={'/images/scenes/gate/bg_entrance_tavern.png'}
    >
      <Logo />
      <br />
      <h1>Pistols at Dawn</h1>
      <h3>Under Maintenance</h3>
    </App>
  );
}

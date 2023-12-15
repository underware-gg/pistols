import React, { useMemo } from 'react'
import AppHeader from '@/pistols/components/AppHeader'

export default function App({
  title = null,
  backgroundImage = null,
  children
}) {
  const style = useMemo(() => (backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: `cover`,
  } : {}), [backgroundImage])
  return (
    <div className='App' style={style}>
      <AppHeader title={title} />
      {children}
    </div>
  );
}


import React, { useMemo } from 'react'
import AppHeader from '@/pistols/components/AppHeader'

export default function App({
  title = null,
  backgroundImage = null,
  className = '',
  children
}) {
  const style = useMemo(() => (backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: `cover`,
  } : {}), [backgroundImage])
  return (
    <div className={`App ${className}`} style={style}>
      <AppHeader title={title} />
      {children}
      {/* <button className='DebuggerButton' onClick={() => setTimeout(() => { debugger; }, 2000)}>debugger</button> */}
    </div>
  );
}


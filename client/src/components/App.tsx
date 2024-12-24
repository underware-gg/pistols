import React, { ReactNode, useMemo } from 'react'

export interface AppProps {
  backgroundImage?: string
  className?: string
  children: ReactNode
}

export default function App({
  backgroundImage = null,
  className = '',
  children
}: AppProps) {
  const style = useMemo(() => (backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: `cover`,
  } : {}), [backgroundImage])
  return (
    <div className={`App ${className}`} style={style}>
      {children}
      {/* <button className='DebuggerButton' onClick={() => setTimeout(() => { debugger; }, 2000)}>debugger</button> */}
    </div>
  );
}

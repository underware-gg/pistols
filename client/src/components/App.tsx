import React, { ReactNode, useMemo } from 'react'
import { AppHeader, HeaderData } from '@/components/AppHeader'

export interface AppProps {
  headerData?: HeaderData
  backgroundImage?: string
  className?: string
  children: ReactNode
}

export default function App({
  headerData = {},
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
      <AppHeader headerData={headerData} />
      {children}
      {/* <button className='DebuggerButton' onClick={() => setTimeout(() => { debugger; }, 2000)}>debugger</button> */}
    </div>
  );
}


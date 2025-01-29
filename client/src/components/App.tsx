import React, { ReactNode, useMemo } from 'react'

export interface AppProps {
  backgroundImage?: string
  children: ReactNode
}

export default function App({
  backgroundImage,
  children
}: AppProps) {
  const style = useMemo(() => (backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: `cover`,
  } : {}), [backgroundImage])
  return (
    <div className='App' style={style}>
      {children}
    </div>
  );
}

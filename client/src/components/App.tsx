import React, { ReactNode, useEffect, useMemo } from 'react'

export interface AppProps {
  title?: string
  subtitle?: string
  backgroundImage?: string
  children: ReactNode
}

export default function App({
  title,
  subtitle,
  backgroundImage,
  children,
}: AppProps) {
  const style = useMemo(() => (backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: `cover`,
  } : {}), [backgroundImage])
  useEffect(() => {
    document.title = title || `Pistols at Dawn${subtitle ? ` | ${subtitle}` : ''}`
  }, [title, subtitle])
  return (
    <div className='App' style={style}>
      {children}
    </div>
  );
}

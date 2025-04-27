import { Image } from 'semantic-ui-react'
import { useGameAspect } from '/src/hooks/useGameAspect'

export default function Logo({
  width = 11,
  showName = false,
  vertical = false,
  square = false
}) {
  const { aspectWidth } = useGameAspect()

  if (!showName) {
    return (
      <Image src='/images/logo/logo.png' width={aspectWidth(width)} height={aspectWidth(width)} centered />
    )
  }

  return (
    <div className='NoMouse NoDrag' style={{ 
      display: 'flex', 
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      gap: aspectWidth(vertical ? 1 : 2)
    }}>
      <Image src='/images/logo/logo.svg' width={aspectWidth(width)} height={aspectWidth(width)} />
      <Image src={square ? '/images/logo/logo_text_square.png' : '/images/logo/logo_text.svg'} width={vertical ? aspectWidth(width * 1.5) : undefined} height={vertical ? undefined : aspectWidth(square ? width * 0.9 : width * 0.5)} />
    </div>
  )
}

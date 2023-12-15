import { useGameplayContext } from '@/pistols/hooks/GameplayContext'

function HealthBar() {
  const { health } = useGameplayContext()
  return (
    <Bar icon={health > 50 ? '❤️' : '❤️‍🩹'} value={health} />
  )
}

function Bar({
  icon,
  value,
}) {
  return (
    <div className='ColUI'>
      <div className='ColUISlider' style={{height: `${value}%`}} />
      <div className='ColUIContents'>
        <h2>
          {icon}
          <br />
          {value}%
        </h2>
      </div>
    </div>
  )
}

export {
  HealthBar,
}

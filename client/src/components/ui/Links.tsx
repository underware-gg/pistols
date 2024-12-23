import { useMemo } from "react"

export function TextLink({
  disabled = false,
  onClick,
  children,
}: {
  disabled?: boolean,
  onClick: Function,
  children: string,
}) {
  const classNames = useMemo(() => {
    let classNames = ['NoSelection']
    if (!disabled) {
      classNames.push('Anchor')
      classNames.push('Important')
    } else {
      classNames.push('Disabled')
    }
    return classNames
  }, [disabled])
  return (
    <span className={classNames.join(' ')} onClick={() => { if (!disabled) onClick() }}>{children}</span>
  )
}

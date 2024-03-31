
export function TextLink({
  disabled = false,
  onClick,
  children,
}: {
  disabled?: boolean,
  onClick: Function,
  children: string,
}) {
  let classNames = ['Unselectable']
  if (!disabled) {
    classNames.push('Anchor')
    classNames.push('Important')
  } else {
    classNames.push('Disabled')
  }
  return (
    <span className={classNames.join(' ')} onClick={() => { if (!disabled) onClick() }}>{children}</span>
  )
}

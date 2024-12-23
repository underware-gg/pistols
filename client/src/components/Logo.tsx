import { Image } from 'semantic-ui-react'

export default function Logo({
  width = 120
}) {
  return (
    <Image src='/images/logo.png' width={width} height={width} centered />
  )
}

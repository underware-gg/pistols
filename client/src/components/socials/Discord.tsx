import React, { useMemo } from 'react'
import { Button } from 'semantic-ui-react'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePlayerSocialLink } from '/src/stores/eventsModelStore'
import { useExecuteEmitPlayerSocialLink } from '/src/hooks/usePistolsSystemCalls'

export function DiscordLinkButton() {
  const { isLinked } = usePlayerSocialLink(constants.SocialPlatform.Discord)
  const userName = useMemo(() => (isLinked ? '' : 'Mataleone'), [isLinked])
  const userId = useMemo(() => (isLinked ? '' : '1234567890'), [isLinked])
  const { emit_player_social_link, isDisabled } = useExecuteEmitPlayerSocialLink(constants.SocialPlatform.Discord, userName, userId)
  return (
    <Button disabled={isDisabled} onClick={() => emit_player_social_link()}>
      {isLinked ? 'Unlink' : 'Link'}
    </Button>
  )
}

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { usePlayerSocialLink } from '/src/stores/eventsModelStore'
import { useExecuteClearPlayerSocialLink } from '/src/hooks/usePistolsSystemCalls'
import { signAndGenerateGeneralPurposeSalt } from '@underware/pistols-sdk/pistols'
import { GeneralPurposeMessage, GeneralPurposeState } from '@underware/pistols-sdk/pistols/config'
import { SALT_SERVER_URL } from '/src/utils/env'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import * as ENV from '/src/utils/env'

const client_id = ENV.DISCORD_CLIENT_ID || ''
const redirect_uri = ENV.DISCORD_REDIRECT_URL || ''
const can_link = (client_id && redirect_uri)

export function DiscordLinkButton({
  openNewTab = true,
}: {
  openNewTab?: boolean
}) {
  const { isLinked } = usePlayerSocialLink(constants.SocialPlatform.Discord)

  //
  // Link step 1: generate salt to validate player request
  //
  const { account, address, isConnected } = useAccount()
  const { starknetDomain } = useDojoSetup()
  const messageToSign = useMemo<GeneralPurposeMessage>(() => ({
    purpose: `Link to ${constants.SocialPlatform.Discord as string}`,
  }), [])
  const [isLinking, setIsLinking] = useState<boolean>(false)
  const [salt, setSalt] = useState<bigint>()
  const _initiate = useCallback(async () => {
    if (can_link && !isLinked && !isLinking) {
      setIsLinking(true)
      const { salt } = await signAndGenerateGeneralPurposeSalt(SALT_SERVER_URL, account, starknetDomain, messageToSign)
      if (salt > 0n) {
        setSalt(salt)
      } else {
        setIsLinking(false)
      }
    }
  }, [isLinked, isLinking, account, starknetDomain, messageToSign])

  //
  // Link step 2: request OAUTH from Discord
  //
  useEffect(() => {
    if (isLinking && salt) {
      const state: GeneralPurposeState = {
        chainId: starknetDomain.chainId as string,
        playerAddress: bigintToHex(address),
        salt: bigintToHex(salt),
        redirectUrl: `${ENV.SERVER_URL}/profile`,
      }
      const options = {
        client_id,
        redirect_uri,
        response_type: 'code',
        scope: 'identify email',
        state: JSON.stringify(state),
      }
      const url = 'https://discord.com/oauth2/authorize?' + new URLSearchParams(options)
      console.log('DiscordLinkButton:', url.length, options.state.length, url, options)
      window.open(url, openNewTab ? '_blank' : '_self')
    }
  }, [isLinking, salt])

  //
  // Link step 3: was linked from assets server, clear local state
  //
  useEffect(() => {
    if (isLinking && isLinked) {
      setIsLinking(false)
      setSalt(undefined)
    }
  }, [isLinking, isLinked])

  //
  // Unlink: call contract directly (only player can unlink)
  //
  const { clear_player_social_link, isDisabled } = useExecuteClearPlayerSocialLink(constants.SocialPlatform.Discord)

  if (isLinked) {
    return (
      <Button disabled={isDisabled} onClick={() => clear_player_social_link()}>
        Unlink
      </Button>
    )
  }
  if (!can_link) {
    return (
      <Button disabled={true} onClick={() => { }}>
        Disabled
      </Button>
    )
  }
  return (
    <Button disabled={!isConnected || isLinking} onClick={() => _initiate()}>
      {isLinking ? 'Linking...' : 'Link to Discord'}
    </Button>
  )
}

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { usePlayerDiscordSocialLink } from '/src/stores/eventsModelStore'
import { useExecuteClearPlayerSocialLink, useExecuteEmitPlayerSetting } from '/src/hooks/usePistolsSystemCalls'
import { signAndGenerateGeneralPurposeSalt } from '@underware/pistols-sdk/pistols'
import { GeneralPurposeMessage, GeneralPurposeState } from '@underware/pistols-sdk/pistols/config'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import * as ENV from '/src/utils/env'

// Discord OAUTH params
const client_id = ENV.DISCORD_CLIENT_ID || ''
const redirect_uri = ENV.DISCORD_REDIRECT_URL || ''
const can_link = (client_id && redirect_uri)

//
// How linking works...
//
// -	PISTOLS: generate salt with GeneralPurposeMessage hash
// -	PISTOLS: click Discord login, send state containing: (chain id + address + salt + message hash)
// -	DISCORD: authorize, redrects to SALT_SERVER
// -	SALT_SERVER: validates salt (re-generate and compare it)
// -	SALT_SERVER: does the OAUTH ping-pong with Discord
// -	SALT_SERVER: call emit_player_social_link()
// -	SALT_SERVER: redirects to game client
// -	Linked!
// 
// Discord OAuth Guide
// https://discord.com/developers/docs/topics/oauth2
//

export function DiscordLinkButton({
  openNewTab = true,
  className = '',
}: {
  openNewTab?: boolean
  className?: string
}) {
  const { isLinked } = usePlayerDiscordSocialLink()
  const { selectedNetworkConfig } = useDojoSetup()

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
      const { salt } = await signAndGenerateGeneralPurposeSalt(selectedNetworkConfig.assetsServerUrl, account, starknetDomain, messageToSign)
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
        redirectUrl: `${selectedNetworkConfig.clientUrl}/profile`,
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
      <Button fluid className={className} disabled={isDisabled} onClick={() => clear_player_social_link()}>
        Unlink Discord
      </Button>
    )
  }
  if (!can_link) {
    return (
      <Button fluid className={className} disabled={true} onClick={() => { }}>
        Discord Disabled
      </Button>
    )
  }
  return (
    <Button fluid className={className} disabled={!isConnected || isLinking} onClick={() => _initiate()}>
      {isLinking ? 'Linking...' : 'Link to Discord'}
    </Button>
  )
}

export function DiscordOptOutButton({
  className = '',
}: {
  className?: string
}) {
  const { isConnected } = useAccount()
  const { isLinked, optedOut } = usePlayerDiscordSocialLink()

  //
  // Unlink: call contract directly (only player can unlink)
  //
  const { emit_player_setting, isDisabled } = useExecuteEmitPlayerSetting(constants.SocialPlatform.Discord, constants.PlayerSetting.OptOutNotifications, !optedOut)
  const _emit = useCallback(() => {
    emit_player_setting()
  }, [emit_player_setting, optedOut])

  return (
    <Button fluid toggle active={!optedOut} className={className} disabled={!isConnected || !isLinked || isDisabled} onClick={() => _emit()}>
      {isDisabled ? '...' : optedOut ? 'No DMs' : 'DM Notify'}
    </Button>
  )
}

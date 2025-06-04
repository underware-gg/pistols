import React, { useEffect, useMemo } from 'react'
import { type Notification } from '/src/stores/notificationStore'
import { useAccount } from '@starknet-react/core'
import { usePlayer } from '/src/stores/playerStore'
import { useDuel } from '/src/hooks/useDuel'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { constants } from '@underware/pistols-sdk/pistols/gen'

export const PushNotification: React.FC<{ 
  notification: Notification, 
  shouldShow: boolean,
  showNotification: () => void
}> = ({ notification, shouldShow, showNotification }) => {
  const { address } = useAccount()
  const { name: myName } = usePlayer(address)
  const { challenge, turnA, turnB, completedStagesA, completedStagesB } = useDuel(notification?.duelId)
  const { isMyAccount: isMeA } = useIsMyAccount(challenge?.duelistAddressA)
  const { isMyAccount: isMeB } = useIsMyAccount(challenge?.duelistAddressB)
  const challengedName = usePlayer(challenge?.duelistAddressB).name
  const challengerName = usePlayer(challenge?.duelistAddressA).name

  const notificationData = useMemo(() => {
    if (!notification || !challenge || !shouldShow) return { title: null, message: null }

    const { duelId, state, requiresAction } = notification
    const isOpponentTurnA = isMeB && turnA
    const isOpponentTurnB = isMeA && turnB
    const hasCommittedA = completedStagesA?.[0]
    const hasCommittedB = completedStagesB?.[0]
    const hasRevealedA = completedStagesA?.[1]
    const hasRevealedB = completedStagesB?.[1]

    let rawTitle: string
    let rawMessage: string

    switch (state) {
      case constants.ChallengeState.Awaiting:
        if (requiresAction && isMeA) {
          rawTitle = `Your Move - ${myName}`
          rawMessage = `It's your turn to commit your moves in duel #${duelId.toString()} against ${challengedName}`
        } else {
          if (isMeB) {
            rawTitle = `Waiting for Duel Acceptance - ${myName}`
            rawMessage = `${challengerName} has challenged you to a duel #${duelId.toString()}`
          } else {
            rawTitle = `Waiting for Duel Acceptance - ${myName}`
            rawMessage = `Waiting for ${challengedName} to accept your duel #${duelId.toString()}`
          }
        }
        break
      case constants.ChallengeState.InProgress:
        // Handle commit phase
        if (!hasCommittedA || !hasCommittedB) {
          if (requiresAction) {
            rawTitle = `Your Move - Commit Cards - ${myName}`
            rawMessage = `It's your turn to commit your moves in duel #${duelId.toString()} against ${isMeA ? challengedName : challengerName}`
          } else if (isOpponentTurnA || isOpponentTurnB) {
            rawTitle = `Waiting for Opponent - ${myName}`
            rawMessage = `Waiting for ${isMeA ? challengedName : challengerName} to commit their moves in duel #${duelId.toString()}`
          }
        }
        // Handle reveal phase
        else if (hasCommittedA && hasCommittedB && (!hasRevealedA || !hasRevealedB)) {
          if (requiresAction) {
            rawTitle = `Your Move - Reveal Cards - ${myName}`
            rawMessage = `It's your turn to reveal your moves in duel #${duelId.toString()} against ${isMeA ? challengedName : challengerName}`
          } else if (isOpponentTurnA || isOpponentTurnB) {
            rawTitle = `Waiting for Opponent - ${myName}`
            rawMessage = `Waiting for ${isMeA ? challengedName : challengerName} to reveal their moves in duel #${duelId.toString()}`
          }
        }
        // Fallback for other in-progress states
        else {
          rawTitle = `Duel In Progress - ${myName}`
          rawMessage = isMeA
            ? `${challengedName} has accepted your challenge in duel #${duelId.toString()}`
            : `You've accepted ${challengerName}'s challenge in duel #${duelId.toString()}`
        }
        break
      case constants.ChallengeState.Refused:
        rawTitle = `Duel Refused - ${myName}`
        rawMessage = isMeA
          ? `${challengedName} has refused your challenge in duel #${duelId.toString()}`
          : `You've refused ${challengerName}'s challenge in duel #${duelId.toString()}`
        break
      case constants.ChallengeState.Withdrawn:
        rawTitle = `Duel Withdrawn - ${myName}`
        rawMessage = isMeA
          ? `Your challenge with ${challengedName} in duel #${duelId.toString()} has been withdrawn`
          : `The challenge from ${challengerName} in duel #${duelId.toString()} has been withdrawn`
        break
      case constants.ChallengeState.Expired:
        rawTitle = `Duel Expired - ${myName}`
        rawMessage = isMeA
          ? `Your challenge to ${challengedName} in duel #${duelId.toString()} has expired`
          : `The challenge from ${challengerName} in duel #${duelId.toString()} has expired`
        break
      case constants.ChallengeState.Resolved:
        if (requiresAction) {
          rawTitle = `Duel Ended - Action Required - ${myName}`
          rawMessage = `Your duel with ${isMeA ? challengedName : challengerName} in duel #${duelId.toString()} has been resolved. Click to see the result!`
        } else {
          rawTitle = `Duel Resolved - ${myName}`
          rawMessage = `Your duel with ${isMeA ? challengedName : challengerName} in duel #${duelId.toString()} has been resolved`
        }
        break
      case constants.ChallengeState.Draw:
        if (requiresAction) {
          rawTitle = `Duel Ended - Action Required - ${myName}`
          rawMessage = `Your duel with ${isMeA ? challengedName : challengerName} in duel #${duelId.toString()} has been resolved. Click to see the result!`
        } else {
          rawTitle = `Duel Draw - ${myName}`
          rawMessage = `Your duel with ${isMeA ? challengedName : challengerName} in duel #${duelId.toString()} ended in a draw`
        }
        break
      default:
        rawTitle = `Duel Update - ${myName}`
        rawMessage = `Duel #${duelId.toString()} state updated to ${state}`
    }

    return { title: rawTitle, message: rawMessage }
  }, [notification, myName, isMeA, isMeB, challengedName, challengerName, challenge, turnA, turnB, completedStagesA, completedStagesB])

  //TODO notifications show up behind curtain
  //TODO check notifications working throughout a duel and if they display correct text
  //TODO check all texts states and pushnotifications might not have latest information?

  useEffect(() => {
    if (notification && notificationData.title && notificationData.message) {
      if (!notification.isDisplayed) {
        sendBrowserNotification()
      }
    }
  }, [notification, notificationData])

  const sendBrowserNotification = async () => {
    if (!("serviceWorker" in navigator)) return
    
    if (Notification.permission !== "granted") {
      return
    }

    const registration = await navigator.serviceWorker.ready
    registration.showNotification(notificationData.title, {
      body: notificationData.message,
      icon: '/images/logo/logo.png',
      tag: `duel-${notification?.duelId}`,
      data: { duelId: notification?.duelId }
    })
    showNotification()
  }

  return null
} 
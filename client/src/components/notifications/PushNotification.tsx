import React, { useEffect, useMemo } from 'react'
import { type Notification } from '/src/stores/notificationStore'
import { useAccount } from '@starknet-react/core'
import { usePlayer } from '/src/stores/playerStore'
import { DuelStage, useDuel } from '/src/hooks/useDuel'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePistolsContext } from '/src/hooks/PistolsContext'

export const PushNotification: React.FC<{ 
  notifications: Notification[], 
  shouldShow: boolean,
  showNotification: () => void
}> = ({ notifications, shouldShow, showNotification }) => {
  const { currentDuel, selectedDuelId } = usePistolsContext()

  const notification = notifications?.[0]
  const { challenge, turnA, turnB, completedStagesA, completedStagesB } = useDuel(notification?.duelId)
  const { isMyAccount: isMeA } = useIsMyAccount(challenge?.duelistAddressA)
  const { isMyAccount: isMeB } = useIsMyAccount(challenge?.duelistAddressB)
  const { name: duelistNameA } = usePlayer(challenge?.duelistAddressA)
  const { name: duelistNameB } = usePlayer(challenge?.duelistAddressB)

  const notificationData = useMemo(() => {
    if (!notification || !challenge || !shouldShow || (!isMeA && !isMeB)) return { title: null, message: null }

    if (notifications.length > 1) {
      return {
        title: `You have ${notifications.length} new duel updates!`,
        message: `There are ${notifications.length} duels with new activity. Click to view your notifications!`
      }
    }

    const myName = isMeA ? duelistNameA : duelistNameB

    const { duelId, state, requiresAction } = notification
    const isOpponentTurn = (!isMeA && turnA) || (!isMeB && turnB)
    const hasCommittedA = completedStagesA?.[DuelStage.Round1Commit]
    const hasCommittedB = completedStagesB?.[DuelStage.Round1Commit]
    const hasRevealedA = completedStagesA?.[DuelStage.Round1Reveal]
    const hasRevealedB = completedStagesB?.[DuelStage.Round1Reveal]

    let rawTitle: string
    let rawMessage: string

    switch (state) {
      case constants.ChallengeState.Awaiting:
        if (requiresAction && isMeA) {
          rawTitle = `Your Move - ${myName}`
          rawMessage = `It's your turn to commit your moves in duel #${duelId.toString()} against ${duelistNameB}`
        } else {
          if (isMeB) {
            rawTitle = `Waiting for Duel Acceptance - ${myName}`
            rawMessage = `${duelistNameA} has challenged you to a duel #${duelId.toString()}`
          } else {
            rawTitle = `Waiting for Duel Acceptance - ${myName}`
            rawMessage = `Waiting for ${duelistNameB} to accept your duel #${duelId.toString()}`
          }
        }
        break
      case constants.ChallengeState.InProgress:
        // Handle commit phase
        if (!hasCommittedA || !hasCommittedB) {
          if (requiresAction) {
            rawTitle = `Commit Cards - ${myName}`
            rawMessage = `It's your turn to commit your moves in duel #${duelId.toString()} against ${isMeA ? duelistNameB : duelistNameA}`
          } else if (isOpponentTurn) {
            rawTitle = `Waiting for Opponent - ${myName}`
            rawMessage = `Waiting for ${isMeA ? duelistNameB : duelistNameA} to commit their moves in duel #${duelId.toString()}`
          }
        }
        // Handle reveal phase
        else if (hasCommittedA && hasCommittedB && (!hasRevealedA || !hasRevealedB)) {
          if (requiresAction) {
            rawTitle = `Reveal Cards - ${myName}`
            rawMessage = `It's your turn to reveal your moves in duel #${duelId.toString()} against ${isMeA ? duelistNameB : duelistNameA}`
          } else if (isOpponentTurn) {
            rawTitle = `Waiting for Opponent - ${myName}`
            rawMessage = `Waiting for ${isMeA ? duelistNameB : duelistNameA} to reveal their moves in duel #${duelId.toString()}`
          }
        }
        // Fallback for other in-progress states
        else {
          rawTitle = `Duel In Progress - ${myName}`
          rawMessage = isMeA
            ? `${duelistNameB} has accepted your duel #${duelId.toString()}`
            : `You've accepted ${duelistNameA}'s duel #${duelId.toString()}`
        }
        break
      case constants.ChallengeState.Refused:
        rawTitle = `Duel Refused - ${myName}`
        rawMessage = isMeA
          ? `${duelistNameB} has refused your duel #${duelId.toString()}`
          : `You've refused ${duelistNameA}'s duel #${duelId.toString()}`
        break
      case constants.ChallengeState.Withdrawn:
        rawTitle = `Duel Withdrawn - ${myName}`
        rawMessage = isMeA
          ? `Your duel #${duelId.toString()} with ${duelistNameB} has been withdrawn`
          : `The duel #${duelId.toString()} from ${duelistNameA} has been withdrawn`
        break
      case constants.ChallengeState.Expired:
        rawTitle = `Duel Expired - ${myName}`
        rawMessage = isMeA
          ? `Your duel #${duelId.toString()} with ${duelistNameB} has expired`
          : `The duel #${duelId.toString()} from ${duelistNameA} has expired`
        break
      case constants.ChallengeState.Resolved:
        if (requiresAction) {
          rawTitle = `Duel Ended - ${myName}`
          rawMessage = `Your duel #${duelId.toString()} with ${isMeA ? duelistNameB : duelistNameA} has been resolved. Click to see the result!`
        } else {
          rawTitle = `Duel Resolved - ${myName}`
          rawMessage = `Your duel #${duelId.toString()} with ${isMeA ? duelistNameB : duelistNameA} has been resolved`
        }
        break
      case constants.ChallengeState.Draw:
        if (requiresAction) {
          rawTitle = `Duel Ended - ${myName}`
          rawMessage = `Your duel #${duelId.toString()} with ${isMeA ? duelistNameB : duelistNameA} has been resolved. Click to see the result!`
        } else {
          rawTitle = `Duel Draw - ${myName}`
          rawMessage = `Your duel #${duelId.toString()} with ${isMeA ? duelistNameB : duelistNameA} ended in a draw`
        }
        break
      default:
        rawTitle = `Duel Update - ${myName}`
        rawMessage = `Duel #${duelId.toString()} state updated to ${state}`
    }

    return { title: rawTitle, message: rawMessage }
  }, [notification, isMeA, isMeB, duelistNameA, duelistNameB, challenge, turnA, turnB, completedStagesA, completedStagesB])

  //TODO notifications show up behind curtain
  //TODO check notifications working throughout a duel and if they display correct text
  //TODO check all texts states and pushnotifications might not have latest information?

  useEffect(() => {
    if (notification && notificationData.title && notificationData.message) {
      if (notifications.some(n => !n.isDisplayed) && Number(selectedDuelId) !== notification.duelId && Number(currentDuel) !== notification.duelId) {
        sendBrowserNotification()
      } else if (Number(selectedDuelId) === notification.duelId || Number(currentDuel) === notification.duelId) {
        showNotification()
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
      tag: `duels-${notifications.map(n => n.duelId).join('-')}`,
      data: { 
        duelIds: notifications.map(n => n.duelId)
      }
    })
    showNotification()
  }

  return null
} 
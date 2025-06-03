self.addEventListener('install', () => {
  console.log('[SW] Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', function(event) {
  if (!event.data) return

  const { title, message, duelId } = event.data
  const options = {
    body: message,
    icon: '/images/ui/notification_bartender_head.png',
    tag: `duel-${duelId}`,
    data: {
      duelId: duelId
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.data)
  event.notification.close()

  const duelId = event.notification.data?.duelId

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        const client = clientList[0]
        client.focus()

        // ✅ Send duelId to app
        client.postMessage({
          type: 'DUEL_NOTIFICATION_CLICK',
          duelId
        })

        return
      }

      // No tab? Open fresh one
      if (clients.openWindow) {
        return clients.openWindow(`/tavern?duel=${duelId}`)
      }
    })
  )
})

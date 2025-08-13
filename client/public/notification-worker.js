self.addEventListener('install', () => {
  console.log('[SW] Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.data)
  event.notification.close()

  const duelIds = event.notification.data?.duelIds

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        const client = clientList[0]
        client.focus()

        // ✅ Send duelId to app
        client.postMessage({
          type: 'DUEL_NOTIFICATION_CLICK',
          duelIds
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

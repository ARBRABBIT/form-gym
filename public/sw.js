self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message;
  try { message = event.data.json(); } catch { return; }
  event.waitUntil(self.registration.showNotification(message.title, { body: message.body, icon: '/app-icon-192.png', badge: '/app-icon-192.png', tag: 'form-morning-weight', data: { url: '/#morning' }, actions: [{ action: 'snooze', title: 'In 30 minutes' }, { action: 'skip', title: 'Skip today' }] }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    if (event.action === 'snooze' || event.action === 'skip') {
      await fetch('/api/reminders/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: event.action }), credentials: 'same-origin' });
      return;
    }
    const url = new URL('/#morning', self.location.origin).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(url); await existing.focus(); }
    else await self.clients.openWindow(url);
  })());
});

/* Brew City PAL service worker (GitHub Pages build only).
 * - Makes the site an installable web app.
 * - Shows Web Push notifications sent by the Apps Script server (Push.gs), and opens the app on the right request
 *   when one is tapped.
 * It does not cache pages: the app always loads fresh from GitHub Pages, so updates show up immediately. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  const show = self.registration.showNotification(d.title || 'Brew City PAL', {
    body: d.body || '',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || '' }
  });
  // Bump the home-screen badge; the app sets the exact unread count when it next opens.
  const badge = self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge().catch(() => {}) : Promise.resolve();
  e.waitUntil(Promise.all([show, badge]));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.url) || '';
  const url = new URL(link, self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope)) { c.postMessage({ type: 'open', url }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});

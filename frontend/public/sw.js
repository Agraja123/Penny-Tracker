// Minimal service worker: lets Penny Tracker be installed on a phone/desktop and
// show reminder notifications through the system tray. It deliberately does not
// cache anything, so a new deployment is always picked up straight away.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("/home");
    })
  );
});

// Service workers can't read import.meta.env, so this config is duplicated
// from src/lib/firebase.js. These are Firebase's public web config values —
// safe to expose client-side (not secrets); see https://firebase.google.com/docs/projects/api-keys.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDTaHpzBhBzcKm1G38cBn0LGTQyya2b-eY",
  authDomain: "cinemax-644cf.firebaseapp.com",
  projectId: "cinemax-644cf",
  storageBucket: "cinemax-644cf.firebasestorage.app",
  messagingSenderId: "212799048998",
  appId: "1:212799048998:web:d09b50c90c1b2ab389c5e7",
});

const messaging = firebase.messaging();

// Background/killed-tab delivery — foreground messages are handled in
// src/lib/firebase.js via onMessage() instead.
messaging.onBackgroundMessage((payload) => {
  // The admin SDK sends `imageUrl` (see services/notification/channels/push.js)
  // but the client-received web payload renames it to `image` — see
  // https://firebase.google.com/docs/reference/js/messaging_.notificationpayload
  const { title, body, image } = payload.notification || {};
  self.registration.showNotification(title || 'CineMax', {
    body: body || '',
    icon: '/cinemax_logo.png',
    ...(image ? { image } : {}),
  });
});

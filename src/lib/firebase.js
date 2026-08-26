import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

/**
 * Requests notification permission (if not already granted/denied) and
 * registers this device for push, returning the FCM token to send to the
 * backend. Returns null if the browser doesn't support FCM, permission was
 * denied, or anything else goes wrong — callers treat push as best-effort.
 */
export async function requestPushToken() {
    if (!(await isSupported())) return null

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        const messaging = getMessaging(app)
        return await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        })
    } catch (err) {
        console.error("Failed to get FCM token:", err)
        return null
    }
}

/** Foreground message handler — background/killed-tab delivery is handled by the service worker instead. */
export async function onForegroundMessage(callback) {
    if (!(await isSupported())) return () => {}
    const messaging = getMessaging(app)
    return onMessage(messaging, callback)
}

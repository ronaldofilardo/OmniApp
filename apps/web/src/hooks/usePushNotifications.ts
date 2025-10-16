import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration);
        return registration;
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
    return null;
  };

  const subscribeToPush = async () => {
    if (!isSupported) return null;

    try {
      const registration = await registerServiceWorker();
      if (!registration) return null;

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Create subscription
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BKxQzQyVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVzVxVz'; // Placeholder
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      setSubscription(newSubscription);

      // Send to backend
      await api.post('/notifications/push-subscription', {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(newSubscription.getKey('auth')!)
        }
      });

      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  };

  const unsubscribeFromPush = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    subscribeToPush,
    unsubscribeFromPush
  };
}

// Utility functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
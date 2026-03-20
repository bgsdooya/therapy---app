importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAva-S1bxT0J_bp3Xdh9usrDIgNpbNkNYo",
  authDomain: "yangsanjeil-therapy.firebaseapp.com",
  projectId: "yangsanjeil-therapy",
  storageBucket: "yangsanjeil-therapy.firebasestorage.app",
  messagingSenderId: "319760379198",
  appId: "1:319760379198:web:e512f5c8af2cd89fef906f",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '양산제일병원', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    requireInteraction: true,
    tag: 'therapy-notification',
  });
});

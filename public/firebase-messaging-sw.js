// Importa los scripts necesarios desde Firebase
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Configuración de tu app (mismo que en tu .env.local)
firebase.initializeApp({
  apiKey: "AIzaSyBXlA3J_ws9kUd16RInzpha-UEahsU8iGQ",
  authDomain: "mensajeria-2bb6d.firebaseapp.com",
  projectId: "mensajeria-2bb6d",
  storageBucket: "mensajeria-2bb6d.appspot.com",
  messagingSenderId: "401445581230",
  appId: "1:401445581230:web:b3485aeac4cca6f7e6d83f",
  measurementId: "G-RMNPE7M7HX"
});

// Inicializar el servicio de mensajería
const messaging = firebase.messaging();

// Mostrar notificación cuando se recibe en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log("🔕 Notificación recibida en segundo plano:", payload);

  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon || '/favicon.ico', // Puedes personalizar el ícono
    data: payload.data
  });
});

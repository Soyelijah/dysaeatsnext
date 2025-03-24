import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validación: Si falta una variable, se lanza un error en consola
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.error(`🚨 ERROR: Falta la variable de entorno ${key} en .env.local`);
  }
});

// Inicializa Firebase
const firebaseApp = initializeApp(firebaseConfig); // Cambié 'app' por 'firebaseApp'
export { firebaseApp }; // Exportamos firebaseApp correctamente
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp);

// Solo inicializa Analytics si está disponible
export const analytics = typeof window !== "undefined" ? getAnalytics(firebaseApp) : null;

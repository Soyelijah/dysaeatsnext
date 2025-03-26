import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp, auth, db } from "./firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

// Solo inicializar messaging en el cliente
let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== "undefined" && typeof navigator !== "undefined") {
  messaging = getMessaging(firebaseApp);
}

// Guardar el token en Firestore
const guardarTokenFCM = async (token: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "usuarios", user.uid);
  await setDoc(userRef, { fcmToken: token }, { merge: true });

  console.log("💾 Token FCM guardado en Firestore para:", user.uid);
};

// Solicitar permiso y obtener token
export const solicitarPermisoYObtenerToken = async () => {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log("🔑 Token FCM:", token);
      await guardarTokenFCM(token);
      return token;
    } else {
      console.warn("⚠️ No se obtuvo token. Solicita permiso para notificaciones.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error al obtener token FCM:", error);
    return null;
  }
};

// Escuchar notificaciones en primer plano
export const escucharMensajesEnPrimerPlano = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("🔔 Notificación en primer plano:", payload);
    alert(`${payload.notification?.title}\n${payload.notification?.body}`);
  });
};

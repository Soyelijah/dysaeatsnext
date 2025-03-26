import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseApp } from "./firebaseConfig"; // Configuración de Firebase
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore"; // Firestore para guardar datos adicionales
import { getDoc } from "firebase/firestore"; // 👈 Asegúrate de importar esto arriba

const auth = getAuth(firebaseApp); // Inicializa la autenticación
const db = getFirestore(firebaseApp); // Inicializa Firestore

/**
 * Registra un nuevo usuario con correo y contraseña.
 * @param email Correo electrónico del usuario
 * @param password Contraseña del usuario
 * @param rut RUT del usuario (formateado)
 */
export const registerUser = async (email: string, password: string, rut: string) => {
  try {
    // Crea un nuevo usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Guarda información adicional del usuario en Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid, // ID único del usuario
      email: user.email, // Correo electrónico del usuario
      name: user.displayName, // Nombre del usuario (puede ser null)
      photoURL: user.photoURL, // URL de la foto del usuario (puede ser null)
      rut: rut, // RUT del usuario
      role: "cliente", // Rol predeterminado del usuario
      createdAt: serverTimestamp(), // Marca de tiempo de creación
    });

    return user;
  } catch (error) {
    console.error("Error en el registro:", error); // Manejo de errores
    throw error;
  }
};

/**
 * Inicia sesión con correo y contraseña.
 * @param email Correo electrónico del usuario
 * @param password Contraseña del usuario
 */
export const loginUser = async (email: string, password: string) => {
  try {
    // Autentica al usuario con correo y contraseña
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error); // Manejo de errores
    throw error;
  }
};

/**
 * Cierra sesión del usuario actual.
 */
export const logoutUser = async () => {
  try {
    // Cierra la sesión del usuario autenticado
    await signOut(auth);
    console.log("Usuario desconectado");
  } catch (error) {
    console.error("Error al cerrar sesión:", error); // Manejo de errores
    throw error;
  }
};

/**
 * Obtiene el usuario actualmente autenticado.
 * @returns Usuario autenticado o null si no hay sesión activa
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser; // Devuelve el usuario actual
};

/**
 * Inicia sesión con cuenta de Google.
 * Crea usuario en Firestore si no existe.
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) return null;

    // Verifica si el usuario ya existe en Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef); // ✅ Versión modular correcta

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        role: "cliente",
        createdAt: serverTimestamp(),
      });
    }

    return user;
  } catch (error) {
    console.error("❌ Error en login con Google:", error);
    throw error;
  }
};
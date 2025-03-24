"use client"; // Indica que este componente es un cliente de React

// Importar Firebase y Firestore
import { auth, googleProvider, db } from "@/firebase/firebaseConfig"; // Configuración de Firebase
import { signInWithPopup } from "firebase/auth"; // Método para iniciar sesión con Google
import { doc, getDoc, setDoc } from "firebase/firestore"; // Métodos para interactuar con Firestore
import { useRouter } from "next/navigation"; // Hook para redirigir al usuario

// Componente principal de la página de inicio de sesión
export default function Login() {
  const router = useRouter(); // Inicializar el enrutador para redirección

  // Función para manejar el inicio de sesión con Google
  const handleLogin = async () => {
    try {
      // Iniciar sesión con Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user; // Obtener información del usuario autenticado

      // Referencia al documento del usuario en Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef); // Verificar si el documento ya existe

      // Si el usuario no existe en Firestore, guardar sus datos
      if (!userDoc.exists()) {
        const nombre = user.displayName || "Sin Nombre"; // Nombre del usuario o valor por defecto

        await setDoc(userRef, {
          uid: user.uid, // ID único del usuario
          name: nombre, // Nombre del usuario
          email: user.email, // Correo electrónico del usuario
          photoURL: user.photoURL, // URL de la foto de perfil
          role: "cliente", // Rol por defecto asignado al usuario
          rut: "", // Campo inicial vacío para el RUT
          codigoInterno: "", // Campo inicial vacío para el código interno
        });
      }

      // Redirigir al usuario a la página de pedidos
      router.push("/pedidos");
    } catch (error) {
      console.error("Error al iniciar sesión:", error); // Manejo de errores en la consola
    }
  };

  // Renderizar la interfaz de usuario
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2> {/* Título de la página */}
      <button
        onClick={handleLogin} // Llamar a la función de inicio de sesión al hacer clic
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        Iniciar sesión con Google
      </button>
    </div>
  );
}

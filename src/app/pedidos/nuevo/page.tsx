"use client"; // Indica que este componente se renderiza en el cliente.
import { useEffect, useState } from "react"; // Importa hooks para manejar estados y efectos.
import { useRouter } from "next/navigation"; // Importa useRouter para manejar la navegación.
import { onAuthStateChanged } from "firebase/auth"; // Detecta cambios en la autenticación.
import { auth } from "@/firebase/firebaseConfig"; // Configuración de Firebase para autenticación.
import { crearPedido, obtenerUsuario } from "@/firebase/firestoreService"; // Funciones para Firestore.
import { UserApp } from "@/types/user"; // Tipo de usuario personalizado.

export default function NuevoPedidoPage() {
  const [descripcion, setDescripcion] = useState(""); // Estado para almacenar la descripción del pedido.
  const [loading, setLoading] = useState(false); // Estado para manejar el estado de carga.
  const [error, setError] = useState(""); // Estado para manejar mensajes de error.
  const [usuario, setUsuario] = useState<UserApp | null>(null); // Estado para almacenar el perfil del usuario.
  const [cargandoPerfil, setCargandoPerfil] = useState(true); // Estado para manejar la carga del perfil.
  const router = useRouter(); // Hook para redirigir al usuario a otra página.

  // Cargar datos del usuario desde Firestore.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const datos = await obtenerUsuario(user.uid); // Obtiene datos del usuario desde Firestore.
        setUsuario(datos); // Establece el perfil del usuario.
      }
      setCargandoPerfil(false); // Desactiva el estado de carga del perfil.
    });

    return () => unsub(); // Limpia el listener al desmontar el componente.
  }, []);

  // Maneja el envío del formulario.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario.
    if (!usuario) return; // Si no hay usuario, no continúa.

    // Validar datos requeridos del perfil.
    if (
      !usuario.name ||
      !usuario.telefono ||
      !usuario.direccion ||
      usuario.name.trim() === ""
    ) {
      setError("⚠️ Debes completar tu perfil (nombre, teléfono y dirección) antes de crear un pedido."); // Establece mensaje de error.
      return;
    }

    setError(""); // Limpia errores anteriores.
    setLoading(true); // Activa el estado de carga.

    try {
      // Crea un nuevo pedido en Firestore.
      await crearPedido({
        descripcion, // Descripción del pedido.
        estado: "pendiente", // Estado inicial del pedido.
        creadoEn: new Date(), // Fecha de creación del pedido.
        userId: usuario.uid, // ID del usuario que creó el pedido.
      });
      router.push("/pedidos"); // Redirige a la página de pedidos.
    } catch (e) {
      console.error("Error al crear pedido:", e); // Muestra el error en la consola.
      setError("Ocurrió un error al guardar el pedido."); // Establece mensaje de error.
    } finally {
      setLoading(false); // Desactiva el estado de carga.
    }
  };

  // Validación antes de mostrar el formulario.
  if (cargandoPerfil) return <p className="text-center mt-10">Cargando perfil...</p>;

  if (
    !usuario?.name ||
    !usuario.telefono ||
    !usuario.direccion ||
    usuario.name.trim() === ""
  ) {
    return (
      <div className="text-center mt-10 text-red-600 font-medium">
        ⚠️ Debes completar tu perfil (nombre, teléfono y dirección) antes de crear un pedido.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-md shadow">
      <h1 className="text-xl font-bold mb-4">Crear nuevo pedido</h1> {/* Título de la página */}

      {error && <p className="text-red-500 mb-4">{error}</p>} {/* Muestra mensajes de error */}

      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full border p-2 rounded mb-4"
          placeholder="Describe tu pedido"
          value={descripcion} // Valor del textarea vinculado al estado.
          onChange={(e) => setDescripcion(e.target.value)} // Actualiza el estado al escribir.
          required // Campo obligatorio.
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading} // Desactiva el botón si está en estado de carga.
        >
          {loading ? "Guardando..." : "Crear Pedido"} {/* Texto dinámico según el estado de carga */}
        </button>
      </form>
    </div>
  );
}

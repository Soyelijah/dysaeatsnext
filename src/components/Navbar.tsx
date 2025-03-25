"use client"; // Indica que este componente es un cliente de React.

import { useState, useEffect } from "react"; // Hooks para manejar estado y efectos secundarios.
import Link from "next/link"; // Componente para navegación entre páginas.
import Image from "next/image"; // Componente para optimización de imágenes.
import { useRouter, usePathname } from "next/navigation"; // Hooks para navegación y rutas.
import { auth } from "@/firebase/firebaseConfig"; // Configuración de Firebase para autenticación.
import { onAuthStateChanged, signOut } from "firebase/auth"; // Métodos para manejar autenticación.
import { obtenerUsuario } from "@/firebase/firestoreService"; // Función para obtener datos del usuario.
import { UserApp } from "@/types/user"; // Tipo de datos para el usuario.

// Componente de barra de navegación responsiva con soporte para diferentes roles de usuario
// y estado de autenticación dinámico.
const Navbar = () => {
  const [user, setUser] = useState<UserApp | null>(null); // Estado para almacenar datos del usuario.
  const [loading, setLoading] = useState(true); // Estado para manejar la carga inicial.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Estado para manejar el menú móvil.
  const router = useRouter(); // Hook para redirección de rutas.
  const pathname = usePathname(); // Hook para obtener la ruta actual.

  useEffect(() => {
    // Observer para cambios en el estado de autenticación.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Si el usuario está autenticado, obtener datos adicionales.
        const userData = await obtenerUsuario(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null); // Si no hay usuario autenticado, limpiar el estado.
      }
      setLoading(false); // Finalizar la carga inicial.
    });

    // Limpiar el observer al desmontar.
    return () => unsubscribe();
  }, []);

  // Función para cerrar sesión.
  const handleLogout = async () => {
    try {
      await signOut(auth); // Cerrar sesión en Firebase.
      router.push("/login"); // Redirigir al usuario a la página de inicio de sesión.
    } catch (error) {
      console.error("Error al cerrar sesión:", error); // Manejar errores en el cierre de sesión.
    }
  };

  // Determinar si un enlace está activo.
  const isActive = (path: string) => {
    return pathname === path ? "text-orange-500 font-bold" : "text-gray-700 hover:text-orange-500";
  };

  // Renderizar enlaces según el rol del usuario.
  const renderNavLinks = () => {
    if (!user) return null; // Si no hay usuario, no mostrar enlaces.

    const commonLinks = (
      <>
        {/* Enlace a la página de pedidos del usuario. */}
        <Link href="/pedidos" className={`${isActive("/pedidos")} block py-2 px-4 transition-colors`}>
          Mis Pedidos
        </Link>
        {/* Enlace a la página de perfil del usuario. */}
        <Link href="/perfil" className={`${isActive("/perfil")} block py-2 px-4 transition-colors`}>
          Mi Perfil
        </Link>
      </>
    );

    // Enlaces específicos para administradores.
    if (user.role === "admin") {
      return (
        <>
          {commonLinks}
          {/* Enlace para gestión de usuarios. */}
          <Link href="/admin/usuarios" className={`${isActive("/admin/usuarios")} block py-2 px-4 transition-colors`}>
            Gestión Usuarios
          </Link>
          {/* Enlace para reportes administrativos. */}
          <Link href="/admin/reportes" className={`${isActive("/admin/reportes")} block py-2 px-4 transition-colors`}>
            Reportes
          </Link>
        </>
      );
    }

    // Enlaces específicos para repartidores.
    if (user.role === "repartidor") {
      return (
        <>
          {commonLinks}
          {/* Enlace para pedidos disponibles. */}
          <Link href="/repartidor/disponibles" className={`${isActive("/repartidor/disponibles")} block py-2 px-4 transition-colors`}>
            Pedidos Disponibles
          </Link>
        </>
      );
    }

    // Enlaces predeterminados para clientes.
    return (
      <>
        {commonLinks}
        {/* Enlace para crear un nuevo pedido. */}
        <Link href="/pedidos/nuevo" className={`${isActive("/pedidos/nuevo")} block py-2 px-4 transition-colors`}>
          Nuevo Pedido
        </Link>
      </>
    );
  };

  return (
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo y Título */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <span className="text-xl font-bold text-gray-800">DysaEats</span>
        </Link>

        {/* Navegación - Escritorio */}
        {!loading && user && (
          <div className="hidden md:flex items-center space-x-6">
            {renderNavLinks()}
            {/* Botón para cerrar sesión. */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Botón de inicio de sesión para usuarios no autenticados. */}
        {!loading && !user && (
          <Link href="/login" className="hidden md:block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors">
            Iniciar Sesión
          </Link>
        )}

        {/* Botón de menú móvil */}
        <button
          className="md:hidden text-gray-600 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="pt-2 space-y-1">
            {user ? (
              <>
                {renderNavLinks()}
                {/* Botón para cerrar sesión en el menú móvil. */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left block py-2 px-4 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" className="block py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; // Exportar el componente Navbar.

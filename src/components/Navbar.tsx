"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { obtenerUsuario } from "@/firebase/firestoreService";
import { UserApp } from "@/types/user";

const Navbar = () => {
  const [user, setUser] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await obtenerUsuario(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path ? "text-orange-500 font-bold" : "text-gray-700 hover:text-orange-500";
  };

  const renderNavLinks = () => {
    if (!user) return null;

    const commonLinks = (
      <>
        <Link href="/pedidos" className={`${isActive("/pedidos")} block py-2 px-4 transition-colors`}>
          Mis Pedidos
        </Link>
        <Link href="/perfil" className={`${isActive("/perfil")} block py-2 px-4 transition-colors`}>
          Mi Perfil
        </Link>
      </>
    );

    if (user.role === "admin") {
      return (
        <>
          {commonLinks}
          <Link href="/admin/usuarios" className={`${isActive("/admin/usuarios")} block py-2 px-4 transition-colors`}>
            Gestión Usuarios
          </Link>
          <Link href="/admin/reportes" className={`${isActive("/admin/reportes")} block py-2 px-4 transition-colors`}>
            Reportes
          </Link>
        </>
      );
    }

    if (user.role === "repartidor") {
      return (
        <>
          {commonLinks}
          <Link href="/repartidor/disponibles" className={`${isActive("/repartidor/disponibles")} block py-2 px-4 transition-colors`}>
            Pedidos Disponibles
          </Link>
        </>
      );
    }

    return (
      <>
        {commonLinks}
        <Link href="/pedidos/nuevo" className={`${isActive("/pedidos/nuevo")} block py-2 px-4 transition-colors`}>
          Nuevo Pedido
        </Link>
      </>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-orange-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg">
            D
          </div>
          <span className="text-lg font-semibold text-gray-800">DysaEats</span>
        </Link>

        {!loading && user && (
          <div className="hidden md:flex items-center gap-6">
            {renderNavLinks()}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {!loading && !user && (
          <Link href="/login" className="hidden md:block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors">
            Iniciar Sesión
          </Link>
        )}

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

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="pt-2 space-y-1">
            {user ? (
              <>
                {renderNavLinks()}
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

export default Navbar;
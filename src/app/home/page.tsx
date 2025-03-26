// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { obtenerUsuario } from "@/firebase/firestoreService";
import { UserApp } from "@/types/user";
import { Button } from "@/components/Button";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await obtenerUsuario(firebaseUser.uid);
        setUser(userData);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || !user) return <div className="p-10">Cargando...</div>;

  return (
    <main className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Avatar y bienvenida */}
        {user.photoURL && (
          <Image
            src={user.photoURL}
            alt="avatar"
            width={80}
            height={80}
            className="rounded-full mx-auto"
          />
        )}

        <h1 className="mt-4 text-3xl font-bold text-textMain">
          ¡Hola, {user.name || "Usuario"}!
        </h1>
        <p className="text-gray-500 mt-1">Rol: <span className="capitalize font-medium">{user.role}</span></p>

        {/* Acciones según el rol */}
        <div className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2">
          {user.role === "cliente" && (
            <>
              <Link href="/pedidos/nuevo">
                <Button className="w-full">📦 Crear Nuevo Pedido</Button>
              </Link>
              <Link href="/pedidos">
                <Button variant="outline" className="w-full">Ver Mis Pedidos</Button>
              </Link>
            </>
          )}

          {user.role === "repartidor" && (
            <>
              <Link href="/repartidor/disponibles">
                <Button className="w-full">🛵 Ver Pedidos Disponibles</Button>
              </Link>
              <Link href="/pedidos">
                <Button variant="outline" className="w-full">Mis Pedidos Asignados</Button>
              </Link>
            </>
          )}

          {user.role === "admin" && (
            <>
              <Link href="/admin/usuarios">
                <Button className="w-full">👥 Gestión de Usuarios</Button>
              </Link>
              <Link href="/admin/reportes">
                <Button variant="outline" className="w-full">📊 Reportes</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

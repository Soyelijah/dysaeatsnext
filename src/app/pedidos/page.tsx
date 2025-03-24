// Habilitar el uso de componentes cliente
"use client";

// Importar hooks y servicios necesarios
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  obtenerPedidosPorUsuario,
  obtenerTodosLosPedidos,
  obtenerUsuario,
  aceptarPedido,
  marcarComoEntregado, // Importar función para marcar como entregado
} from "@/firebase/firestoreService";
import { Pedido } from "@/types/pedido";
import { UserApp } from "@/types/user";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

// Componente principal de la página de pedidos
export default function PedidosPage() {
  // Estado para almacenar los pedidos del usuario
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Estado para almacenar los datos del usuario autenticado
  const [usuario, setUsuario] = useState<UserApp | null>(null);

  // Estado para manejar la visualización de carga
  const [loading, setLoading] = useState(true);

  // Estado para almacenar datos de clientes y repartidores
  const [clientes, setClientes] = useState<Record<string, UserApp>>({});
  const [repartidores, setRepartidores] = useState<Record<string, UserApp>>({});

  // Función para cargar datos de un usuario por UID
  const cargarUsuario = async (uid: string): Promise<UserApp | null> => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      name: data.name,
      email: data.email,
      photoURL: data.photoURL,
      role: data.role,
      rut: data.rut,
      telefono: data.telefono,
      direccion: data.direccion,
    };
  };

  // Efecto para escuchar cambios en la autenticación y cargar datos del usuario y pedidos
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // Obtener datos del usuario autenticado
      const datosUsuario = await obtenerUsuario(user.uid);
      if (!datosUsuario) return;

      setUsuario(datosUsuario);

      // Obtener pedidos según el rol del usuario
      const pedidos =
        datosUsuario.role === "cliente"
          ? await obtenerPedidosPorUsuario(user.uid)
          : await obtenerTodosLosPedidos();

      setPedidos(pedidos);

      // Cargar clientes y repartidores asociados
      const nuevosClientes: Record<string, UserApp> = {};
      const nuevosRepartidores: Record<string, UserApp> = {};

      for (const pedido of pedidos) {
        if (!nuevosClientes[pedido.userId]) {
          const cliente = await cargarUsuario(pedido.userId);
          if (cliente) nuevosClientes[pedido.userId] = cliente;
        }

        if (pedido.repartidorId && !nuevosRepartidores[pedido.repartidorId]) {
          const repartidor = await cargarUsuario(pedido.repartidorId);
          if (repartidor) nuevosRepartidores[pedido.repartidorId] = repartidor;
        }
      }

      setClientes(nuevosClientes);
      setRepartidores(nuevosRepartidores);
      setLoading(false);
    });

    // Limpiar el listener al desmontar el componente
    return () => unsub();
  }, []);

  // Mostrar mensaje de carga mientras se obtienen los datos
  if (loading) return <p className="text-center mt-8">Cargando...</p>;

  // Renderizar la página de pedidos
  return (
    <div className="p-6">
      {/* Encabezado con título y botón para crear pedidos */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {usuario?.role === "cliente" && (
          <Link
            href="/pedidos/nuevo"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Crear Pedido
          </Link>
        )}
      </div>

      {/* Mostrar mensaje si no hay pedidos disponibles */}
      {pedidos.length === 0 ? (
        <p>No hay pedidos disponibles.</p>
      ) : (
        // Lista de pedidos
        <ul className="space-y-3">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="border p-4 rounded-md">
              {/* Descripción del pedido */}
              <p className="font-semibold">{pedido.descripcion}</p>
              {/* Estado y fecha del pedido */}
              <p className="text-sm text-gray-500">
                Estado: {pedido.estado} | Fecha:{" "}
                {pedido.creadoEn.toLocaleDateString()}
              </p>

              {/* Mostrar información adicional si el usuario no es cliente */}
              {usuario?.role !== "cliente" && (
                <>
                  <p className="text-xs text-gray-400">
                    ID Usuario: {pedido.userId}
                  </p>

                  {pedido.repartidorId && (
                    <p className="text-xs text-green-500">
                      Asignado a: {pedido.repartidorId}
                    </p>
                  )}
                </>
              )}

              {/* Botón para aceptar pedidos pendientes (solo para repartidores) */}
              {usuario?.role === "repartidor" &&
                pedido.estado === "pendiente" &&
                !pedido.repartidorId && (
                  <button
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm"
                    onClick={async () => {
                      if (!usuario) return;
                      await aceptarPedido(pedido.id!, usuario.uid);
                      const pedidosActualizados = await obtenerTodosLosPedidos();
                      setPedidos(pedidosActualizados);
                    }}
                  >
                    Aceptar pedido
                  </button>
              )}

              {/* Botón para marcar como entregado (solo para repartidor asignado) */}
              {usuario?.role === "repartidor" &&
                pedido.estado === "en camino" &&
                pedido.repartidorId === usuario.uid && (
                  <>
                    <button
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      onClick={async () => {
                        await marcarComoEntregado(pedido.id!);
                        const pedidosActualizados = await obtenerTodosLosPedidos();
                        setPedidos(pedidosActualizados);
                      }}
                    >
                      Marcar como entregado
                    </button>
                    {/* Mostrar datos del cliente al repartidor si el pedido está "en camino" */}
                    <div className="mt-2 text-sm text-white bg-slate-800 p-2 rounded">
                      <p><strong>Cliente:</strong> {clientes[pedido.userId]?.name}</p>
                      <p><strong>Teléfono:</strong> {clientes[pedido.userId]?.telefono}</p>
                      <p><strong>Dirección:</strong> {clientes[pedido.userId]?.direccion}</p>
                    </div>
                  </>
              )}

              {/* Mostrar datos del repartidor al cliente si el pedido está "en camino" */}
              {usuario?.role === "cliente" &&
                pedido.estado === "en camino" &&
                pedido.repartidorId && (
                  <div className="mt-2 text-sm text-white bg-slate-800 p-2 rounded">
                    <p><strong>Repartidor:</strong> {repartidores[pedido.repartidorId]?.name}</p>
                    <p><strong>Teléfono:</strong> {repartidores[pedido.repartidorId]?.telefono}</p>
                    {repartidores[pedido.repartidorId]?.photoURL && (
                      <img
                        src={repartidores[pedido.repartidorId]!.photoURL!}
                        alt="Foto repartidor"
                        className="w-16 h-16 rounded-full mt-2"
                      />
                    )}
                  </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

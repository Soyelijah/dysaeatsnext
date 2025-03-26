// src/app/pedidos/page.tsx - Rediseño profesional
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  obtenerPedidosPorUsuario,
  obtenerTodosLosPedidos,
  obtenerUsuario,
  aceptarPedido,
  marcarComoEntregado,
} from "@/firebase/firestoreService";
import { Pedido } from "@/types/pedido";
import { UserApp } from "@/types/user";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [usuario, setUsuario] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Record<string, UserApp>>({});
  const [repartidores, setRepartidores] = useState<Record<string, UserApp>>({});

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const datosUsuario = await obtenerUsuario(user.uid);
      if (!datosUsuario) return;

      setUsuario(datosUsuario);

      const pedidos =
        datosUsuario.role === "cliente"
          ? await obtenerPedidosPorUsuario(user.uid)
          : await obtenerTodosLosPedidos();

      setPedidos(pedidos);

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

    return () => unsub();
  }, []);

  if (loading) return <p className="text-center mt-8">Cargando...</p>;

  const estadoColor = {
    pendiente: "bg-orange-100 text-orange-800",
    "en camino": "bg-blue-100 text-blue-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-textMain">Pedidos</h1>
          {usuario?.role === "cliente" && (
            <Link href="/pedidos/nuevo" className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-md">
              Crear Pedido
            </Link>
          )}
        </div>

        {pedidos.length === 0 ? (
          <p className="text-gray-600">No hay pedidos disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {pedidos.map((pedido) => (
              <li key={pedido.id} className="bg-white border shadow-sm p-4 rounded-md">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-textMain">{pedido.descripcion}</h2>
                    <p className="text-sm text-gray-500">
                      Estado: <span className={`px-2 py-1 rounded ${estadoColor[pedido.estado]}`}>{pedido.estado}</span>
                      <span className="ml-4">
                        Fecha:{" "}
                        {new Date(pedido.creadoEn).toLocaleString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    {usuario?.role !== "cliente" && (
                      <p className="text-xs text-gray-400">ID Usuario: {pedido.userId}</p>
                    )}
                    {pedido.repartidorId && usuario?.role !== "cliente" && (
                      <p className="text-xs text-green-600">Asignado a: {pedido.repartidorId}</p>
                    )}
                  </div>
            
                  <div className="text-right space-y-2">
                    <Link href={`/pedidos/${pedido.id}`} className="text-sm text-primary hover:underline">
                      Ver Detalle
                    </Link>
            
                    {usuario?.role === "repartidor" && pedido.estado === "pendiente" && !pedido.repartidorId && (
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        onClick={async () => {
                          if (!usuario) return;
                          await aceptarPedido(pedido.id!, usuario.uid);
                          const pedidosActualizados = await obtenerTodosLosPedidos();
                          setPedidos(pedidosActualizados);
                        }}
                      >
                        Aceptar Pedido
                      </button>
                    )}
            
                    {usuario?.role === "repartidor" && pedido.estado === "en camino" && pedido.repartidorId === usuario.uid && (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={async () => {
                          await marcarComoEntregado(pedido.id!);
                          const pedidosActualizados = await obtenerTodosLosPedidos();
                          setPedidos(pedidosActualizados);
                        }}
                      >
                        Marcar como Entregado
                      </button>
                    )}
                  </div>
                </div>
            
                {/* Info adicional (cliente/repartidor) */}
                {usuario?.role === "repartidor" && pedido.estado === "en camino" && (
                  <div className="text-sm text-white bg-slate-800 p-3 rounded">
                    <p><strong>Cliente:</strong> {clientes[pedido.userId]?.name}</p>
                    <p><strong>Teléfono:</strong> {clientes[pedido.userId]?.telefono}</p>
                    <p><strong>Dirección:</strong> {clientes[pedido.userId]?.direccion}</p>
                  </div>
                )}
            
                {usuario?.role === "cliente" && pedido.estado === "en camino" && pedido.repartidorId && (
                  <div className="text-sm text-white bg-slate-800 p-3 rounded">
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
              </div>
            </li>            
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

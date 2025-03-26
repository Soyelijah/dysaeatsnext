// src/app/pedidos/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";
import { obtenerUsuario } from "@/firebase/firestoreService";
import { 
  aceptarPedido, 
  marcarComoEntregado,
  suscribirseAPedido
} from "@/firebase/pedidoService";
import { Pedido } from "@/types/pedido";
import { UserApp } from "@/types/user";
import { Button } from "@/components/Button";

// Interfaz extendida para incluir datos de usuario relacionados
interface PedidoConUsuarios extends Pedido {
  cliente?: UserApp | null;
  repartidor?: UserApp | null;
}

// Función para obtener un pedido por ID
const obtenerPedidoPorId = async (pedidoId: string | string[]): Promise<Pedido | null> => {
  // Convertir el ID a string si es un array
  const id = Array.isArray(pedidoId) ? pedidoId[0] : pedidoId;
  
  return new Promise<Pedido | null>((resolve) => {
    // Usar la función de suscripción pero solo para obtener el valor inicial
    const unsub = suscribirseAPedido(id, (pedido) => {
      resolve(pedido);
      // Cancelar la suscripción inmediatamente después de obtener el valor
      setTimeout(() => unsub(), 100);
    });
  });
};

// Función para cancelar pedido
const cancelarPedido = async (pedidoId: string) => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await updateDoc(pedidoRef, { 
      estado: "cancelado",
      canceladoEn: new Date() 
    });
    return true;
  } catch (error) {
    console.error("Error al cancelar el pedido:", error);
    throw error;
  }
};

export default function PedidoDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [user, setUser] = useState<UserApp | null>(null);
  const [pedido, setPedido] = useState<PedidoConUsuarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          router.push("/login");
          return;
        }
        
        try {
          // Obtener datos del usuario actual
          const userData = await obtenerUsuario(firebaseUser.uid);
          setUser(userData);
          
          // Obtener datos del pedido
          const pedidoData = await obtenerPedidoPorId(id as string);
          
          if (!pedidoData) {
            setError("No se encontró el pedido solicitado");
            setLoading(false);
            return;
          }
          
          // Cargar datos completos (cliente y repartidor)
          const pedidoCompleto: PedidoConUsuarios = { ...pedidoData };
          
          // Obtener datos del cliente
          if (pedidoData.userId) {
            const clienteData = await obtenerUsuario(pedidoData.userId);
            pedidoCompleto.cliente = clienteData; // Ahora acepta null
          }
          
          // Obtener datos del repartidor si existe
          if (pedidoData.repartidorId) {
            const repartidorData = await obtenerUsuario(pedidoData.repartidorId);
            pedidoCompleto.repartidor = repartidorData; // Ahora acepta null
          }
          
          setPedido(pedidoCompleto);
        } catch (err: any) {
          console.error("Error al cargar datos:", err);
          setError(err.message || "Error al cargar los datos");
        } finally {
          setLoading(false);
        }
      });
      
      // Limpiar suscripción al desmontar
      return () => unsubAuth();
    };
    
    fetch();
  }, [id, router]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  // Mostrar mensaje de error
  if (error || !pedido || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700">{error || "No se encontró el pedido solicitado."}</p>
        <Button
          onClick={() => router.push('/pedidos')}
          variant={"primary"}
        >
          Volver a mis pedidos
        </Button>
      </div>
    );
  }

  const isCliente = user.uid === pedido.userId;
  const isRepartidor = user.uid === pedido.repartidorId;
  const isAdmin = user.role === "admin";

  // Mapa de estilos para estados
  const estadoColor: Record<string, string> = {
    pendiente: "bg-orange-100 text-orange-800",
    "en camino": "bg-blue-100 text-blue-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };

  const handleAccion = async (accion: string) => {
    try {
      if (accion === "aceptar") {
        await aceptarPedido(pedido.id!, user.uid);
      } else if (accion === "entregado") {
        await marcarComoEntregado(pedido.id!);
      } else if (accion === "cancelar") {
        await cancelarPedido(pedido.id!);
      }
      
      // Actualizar datos del pedido
      const pedidoActualizado = await obtenerPedidoPorId(pedido.id!);
      if (pedidoActualizado) {
        // Mantener los datos de cliente y repartidor con el tipo correcto
        const pedidoCompleto: PedidoConUsuarios = {
          ...pedidoActualizado,
          cliente: pedido.cliente,
          repartidor: pedido.repartidor
        };
        setPedido(pedidoCompleto);
      }
    } catch (err: any) {
      console.error(`Error al ${accion} el pedido:`, err);
      setError(`Error al ${accion} el pedido: ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border rounded-md shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-textMain mb-1">
                Pedido #{typeof pedido.id === 'string' ? pedido.id.slice(0, 8) : ''}
              </h2>
              <p className="text-gray-500 text-sm">{pedido.descripcion}</p>
              <p className="text-gray-400 text-xs mt-1">
                {pedido.creadoEn.toLocaleString()}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoColor[pedido.estado] || "bg-gray-100 text-gray-800"} capitalize`}>
              {pedido.estado}
            </span>
          </div>
        </div>

        {/* Información de cliente y repartidor */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Cliente</h3>
            <p className="text-textMain font-semibold">{pedido.cliente?.name || "-"}</p>
            <p className="text-sm text-gray-500">{pedido.cliente?.direccion || "Sin dirección"}</p>
            <p className="text-sm text-gray-500">{pedido.cliente?.telefono || "Sin teléfono"}</p>
          </div>

          {pedido.repartidorId && (
            <div className="bg-white border rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Repartidor</h3>
              <p className="text-textMain font-semibold">{pedido.repartidor?.name || "-"}</p>
              <p className="text-sm text-gray-500">{pedido.repartidor?.telefono || "-"}</p>
            </div>
          )}
        </div>

        {/* Sección de productos */}
        {pedido.productos && pedido.productos.length > 0 && (
          <div className="bg-white border rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Productos</h3>
            <ul className="space-y-2">
              {pedido.productos.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{p.cantidad}x {p.nombre}</span>
                  <span>${p.precio * p.cantidad}</span>
                </li>
              ))}
            </ul>
            <hr className="my-2" />
            <div className="text-right font-semibold">
              Total: ${pedido.total?.toFixed(0) || 0}
            </div>
          </div>
        )}

        {/* Acciones según rol */}
        <div className="text-center">
          {pedido.estado === "pendiente" && user.role === "repartidor" && !isRepartidor && (
            <Button
              onClick={() => handleAccion("aceptar")}
              variant={"success"}
            >
              Aceptar Pedido
            </Button>
          )}

          {pedido.estado === "en camino" && isRepartidor && (
            <Button
              onClick={() => handleAccion("entregado")}
              variant={"primary"}
            >
              Marcar como Entregado
            </Button>
          )}

          {pedido.estado === "pendiente" && (isCliente || isAdmin) && (
            <Button
              onClick={() => handleAccion("cancelar")}
              variant={"danger"}
            >
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
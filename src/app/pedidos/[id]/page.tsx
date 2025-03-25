"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import { 
  obtenerUsuario, 
  aceptarPedido, 
  marcarComoEntregado 
} from "@/firebase/firestoreService";
import { Pedido } from "@/types/pedido";
import { UserApp } from "@/types/user";
import { Button } from "@/components/Button";

// Interfaz para las props de la página
interface PedidoDetailPageProps {
  params: {
    id: string; // ID del pedido que viene de la URL
  };
}

/**
 * Página de Detalle de Pedido
 * 
 * Muestra información detallada de un pedido específico y proporciona
 * opciones para interactuar con él según el rol del usuario.
 */
export default function PedidoDetailPage({ params }: PedidoDetailPageProps) {
  // Estados para manejar datos y UI
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<UserApp | null>(null);
  const [cliente, setCliente] = useState<UserApp | null>(null);
  const [repartidor, setRepartidor] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pedidoId = params.id;

  // Cargar datos del pedido y usuarios relacionados
  useEffect(() => {
    const fetchPedidoDetails = async () => {
      if (!pedidoId) return;

      try {
        // Obtener datos del pedido
        const pedidoRef = doc(db, "pedidos", pedidoId);
        const pedidoSnap = await getDoc(pedidoRef);
        
        if (!pedidoSnap.exists()) {
          setError("El pedido solicitado no existe");
          setLoading(false);
          return;
        }
        
        // Transformar datos del snapshot a un objeto Pedido
        const pedidoData = pedidoSnap.data();
        const pedidoObj: Pedido = {
          id: pedidoSnap.id,
          descripcion: pedidoData.descripcion,
          estado: pedidoData.estado,
          creadoEn: pedidoData.creadoEn.toDate(),
          userId: pedidoData.userId,
          repartidorId: pedidoData.repartidorId,
        };
        
        setPedido(pedidoObj);
        
        // Obtener datos del cliente
        const clienteData = await obtenerUsuario(pedidoData.userId);
        setCliente(clienteData);
        
        // Si hay un repartidor asignado, obtener sus datos
        if (pedidoData.repartidorId) {
          const repartidorData = await obtenerUsuario(pedidoData.repartidorId);
          setRepartidor(repartidorData);
        }
      } catch (error) {
        console.error("Error al obtener detalles del pedido:", error);
        setError("Ocurrió un error al cargar los detalles del pedido");
      } finally {
        setLoading(false);
      }
    };

    // Obtener el usuario actual autenticado
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await obtenerUsuario(user.uid);
        setUsuario(userData);
        
        // Una vez que tenemos el usuario, obtenemos los detalles del pedido
        fetchPedidoDetails();
      } else {
        // Si no hay usuario autenticado, redirigir al login
        router.push('/login');
      }
    });

    return () => unsubAuth();
  }, [pedidoId, router]);

  // Manejar acción de aceptar pedido (para repartidores)
  const handleAceptarPedido = async () => {
    if (!pedido || !usuario) return;
    
    setActionLoading(true);
    try {
      await aceptarPedido(pedido.id!, usuario.uid);
      
      // Actualizar el pedido en el estado
      setPedido({
        ...pedido,
        estado: "en camino",
        repartidorId: usuario.uid
      });
      
      // Establecer al usuario actual como repartidor
      setRepartidor(usuario);
    } catch (error) {
      console.error("Error al aceptar el pedido:", error);
      setError("Ocurrió un error al aceptar el pedido. Inténtalo de nuevo.");
    } finally {
      setActionLoading(false);
    }
  };

  // Manejar acción de marcar como entregado
  const handleMarcarEntregado = async () => {
    if (!pedido) return;
    
    setActionLoading(true);
    try {
      await marcarComoEntregado(pedido.id!);
      
      // Actualizar el pedido en el estado
      setPedido({
        ...pedido,
        estado: "entregado"
      });
    } catch (error) {
      console.error("Error al marcar como entregado:", error);
      setError("Ocurrió un error al marcar el pedido como entregado. Inténtalo de nuevo.");
    } finally {
      setActionLoading(false);
    }
  };

  // Manejar acción de cancelar pedido (solo para estado pendiente)
  const handleCancelarPedido = async () => {
    if (!pedido || pedido.estado !== "pendiente") return;
    
    if (!confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
      return;
    }
    
    setActionLoading(true);
    try {
      // Actualizar el estado en Firestore
      const pedidoRef = doc(db, "pedidos", pedido.id!);
      await updateDoc(pedidoRef, { estado: "cancelado" });
      
      // Actualizar el pedido en el estado
      setPedido({
        ...pedido,
        estado: "cancelado"
      });
    } catch (error) {
      console.error("Error al cancelar el pedido:", error);
      setError("Ocurrió un error al cancelar el pedido. Inténtalo de nuevo.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Mostrar mensaje de error si no se encontró el pedido
if (error || !pedido) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
      <p className="text-gray-700">{error || "No se encontró el pedido solicitado."}</p>
      <Button
        onClick={() => router.push('/pedidos')}
        className="mt-6"
        variant={"primary" as const}
      >
        Volver a mis pedidos
      </Button>
    </div>
  );
}

// Función para obtener una etiqueta de estado con color adecuado
const getStatusBadge = (estado: string) => {
  const statusConfig = {
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
    'en camino': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Camino' },
    entregado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
  };

  const config = statusConfig[estado as keyof typeof statusConfig] ||
    { bg: 'bg-gray-100', text: 'text-gray-800', label: estado };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

return (
  <div className="max-w-4xl mx-auto">
    {/* Encabezado */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Detalle del Pedido</h1>
        <p className="text-gray-600">ID: {pedido.id}</p>
      </div>
      <Button
        onClick={() => router.push('/pedidos')}
        variant={"outline" as const}
        leftIcon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        }
      >
        Volver a pedidos
      </Button>
    </div>

    {/* Tarjeta principal */}
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      {/* Información básica del pedido */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Estado: {getStatusBadge(pedido.estado)}</h2>
            <p className="text-gray-600 mt-1">
              Fecha: {pedido.creadoEn.toLocaleDateString()} - {pedido.creadoEn.toLocaleTimeString()}
            </p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            {usuario?.role === "repartidor" && pedido.estado === "pendiente" && !pedido.repartidorId && (
              <Button
                onClick={handleAceptarPedido}
                isLoading={actionLoading}
                variant={"success" as const}
              >
                Aceptar Pedido
              </Button>
            )}
            {usuario?.role === "repartidor" && pedido.estado === "en camino" && pedido.repartidorId === usuario.uid && (
              <Button
                onClick={handleMarcarEntregado}
                isLoading={actionLoading}
                variant={"primary" as const}
              >
                Marcar como Entregado
              </Button>
            )}
            {((usuario?.role === "cliente" && pedido.userId === usuario.uid) || usuario?.role === "admin") && pedido.estado === "pendiente" && (
              <Button
                onClick={handleCancelarPedido}
                isLoading={actionLoading}
                variant={"danger" as const}
              >
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Descripción</h3>
        <p className="text-gray-700 whitespace-pre-line">{pedido.descripcion}</p>
      </div>

        {/* Información del cliente */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
          {cliente ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{cliente.name || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{cliente.telefono || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium">{cliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium">{cliente.direccion || "No especificada"}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No se encontró información del cliente.</p>
          )}
        </div>

        {/* Información del repartidor (si existe) */}
        {(pedido.repartidorId || pedido.estado === "en camino" || pedido.estado === "entregado") && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Información del Repartidor</h3>
            {repartidor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{repartidor.name || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{repartidor.telefono || "No especificado"}</p>
                </div>
                {repartidor.photoURL && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-2">Foto</p>
                    <img
                      src={repartidor.photoURL}
                      alt="Foto repartidor"
                      className="w-16 h-16 rounded-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No se encontró información del repartidor.</p>
            )}
          </div>
        )}
      </div>

      {/* Timeline de seguimiento */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Seguimiento del Pedido</h3>
          <div className="space-y-6">
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="h-full border-l border-gray-300 ml-4"></div>
              </div>
              <div className="pb-6">
                <div className="text-gray-800 font-medium">Pedido creado</div>
                <div className="text-gray-500 text-sm">{pedido.creadoEn.toLocaleString()}</div>
              </div>
            </div>

            {(pedido.estado === "en camino" || pedido.estado === "entregado") && (
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className={`h-full border-l border-gray-300 ml-4 ${pedido.estado === "entregado" ? "" : "hidden"}`}></div>
                </div>
                <div className="pb-6">
                  <div className="text-gray-800 font-medium">Pedido aceptado por repartidor</div>
                  <div className="text-gray-500 text-sm">
                    {repartidor ? `${repartidor.name}` : "Repartidor asignado"}
                  </div>
                </div>
              </div>
            )}

            {pedido.estado === "entregado" && (
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="text-gray-800 font-medium">Pedido entregado</div>
                  <div className="text-gray-500 text-sm">Entrega completada con éxito</div>
                </div>
              </div>
            )}

            {pedido.estado === "cancelado" && (
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="rounded-full h-8 w-8 bg-red-500 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="text-gray-800 font-medium">Pedido cancelado</div>
                  <div className="text-gray-500 text-sm">El pedido ha sido cancelado</div>
                </div>
              </div>
            )}

            {pedido.estado === "pendiente" && (
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="rounded-full h-8 w-8 bg-gray-300 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="text-gray-800 font-medium">Esperando repartidor</div>
                  <div className="text-gray-500 text-sm">El pedido está pendiente de ser aceptado</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
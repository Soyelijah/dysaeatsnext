// src/firebase/pedidoService.ts

import { db, firebaseApp } from "./firebaseConfig";
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, doc, getDoc, updateDoc, onSnapshot, GeoPoint } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Pedido } from "@/types/pedido";
import { UserApp } from "@/types/user";

// Referencia a la colección "pedidos" en Firestore
const pedidosRef = collection(db, "pedidos");
const functions = getFunctions(firebaseApp);

/**
 * Crea un nuevo pedido en Firestore y envía notificación al restaurante
 * @param pedido Objeto con los datos del pedido
 * @returns Documento creado
 */
export const crearPedido = async (pedido: Pedido) => {
  try {
    // Crear pedido en Firestore
    const docRef = await addDoc(pedidosRef, {
      descripcion: pedido.descripcion,
      estado: pedido.estado,
      creadoEn: Timestamp.fromDate(pedido.creadoEn),
      userId: pedido.userId,
      ubicacionCliente: pedido.ubicacionCliente || null,
      productos: pedido.productos || [],
      total: pedido.total || 0,
      metodoPago: pedido.metodoPago || 'efectivo',
    });
    
    // Enviar notificación de nuevo pedido (usando Cloud Functions)
    try {
      const notificarNuevoPedido = httpsCallable(functions, 'notificarNuevoPedido');
      await notificarNuevoPedido({ 
        pedidoId: docRef.id,
        clienteId: pedido.userId 
      });
    } catch (notificationError) {
      console.error("Error al enviar notificación:", notificationError);
      // No bloqueamos el proceso si falla la notificación
    }
    
    return docRef;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

/**
 * Obtiene pedidos de un usuario específico con actualizaciones en tiempo real
 * @param userId ID del usuario
 * @param callback Función a llamar cuando hay cambios
 * @returns Función para cancelar la suscripción
 */
export const suscribirseAPedidosUsuario = (
  userId: string, 
  callback: (pedidos: Pedido[]) => void
) => {
  const q = query(
    pedidosRef,
    where("userId", "==", userId),
    orderBy("creadoEn", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const pedidos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: doc.data().creadoEn.toDate(),
    })) as Pedido[];
    
    callback(pedidos);
  });
};

/**
 * Obtiene pedidos de un usuario específico
 * @param userId ID del usuario
 * @returns Lista de pedidos
 */
export const obtenerPedidosPorUsuario = async (userId: string) => {
  const q = query(
    pedidosRef,
    where("userId", "==", userId),
    orderBy("creadoEn", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    creadoEn: doc.data().creadoEn.toDate(),
  })) as Pedido[];
};

/**
 * Obtiene todos los pedidos con filtros opcionales
 * @param filtros Objeto con filtros a aplicar (opcional)
 * @returns Lista de pedidos
 */
export const obtenerTodosLosPedidos = async (filtros?: {
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}): Promise<Pedido[]> => {
  let q = query(pedidosRef, orderBy("creadoEn", "desc"));
  
  // Aplicar filtros si existen
  if (filtros?.estado) {
    q = query(q, where("estado", "==", filtros.estado));
  }
  
  // Nota: Firestore no permite múltiples filtros de rango en un mismo campo
  // Para filtros de fecha se haría en memoria o con consultas compuestas
  
  const snapshot = await getDocs(q);
  const pedidos = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    creadoEn: doc.data().creadoEn.toDate(),
  })) as Pedido[];
  
  // Filtrar por fecha en memoria si es necesario
  if (filtros?.fechaInicio || filtros?.fechaFin) {
    return pedidos.filter(pedido => {
      if (filtros.fechaInicio && pedido.creadoEn < filtros.fechaInicio) {
        return false;
      }
      if (filtros.fechaFin && pedido.creadoEn > filtros.fechaFin) {
        return false;
      }
      return true;
    });
  }
  
  return pedidos;
};

/**
 * Obtiene un usuario específico por su UID
 * @param uid ID del usuario
 * @returns Datos del usuario o null si no existe
 */
export const obtenerUsuario = async (uid: string): Promise<UserApp | null> => {
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
    telefono: data.telefono || "",
    direccion: data.direccion || "",
    rut: data.rut || "",
    ubicacion: data.ubicacion || null,
  };
};

/**
 * Actualiza el rol de un usuario en Firestore
 * @param uid ID del usuario
 * @param nuevoRol Nuevo rol a asignar
 * @returns Promesa vacia
 */
export const actualizarRolUsuario = async (uid: string, nuevoRol: string) => {
  const ref = doc(db, "users", uid);
  return await updateDoc(ref, { role: nuevoRol });
};

/**
 * Aceptar un pedido y asignarlo a un repartidor
 * @param pedidoId ID del pedido
 * @param repartidorId ID del repartidor
 * @returns Promesa vacía
 */
export const aceptarPedido = async (pedidoId: string, repartidorId: string) => {
  try {
    const ref = doc(db, "pedidos", pedidoId);
    
    // Actualizar estado y asignar repartidor
    await updateDoc(ref, {
      estado: "en camino",
      repartidorId: repartidorId,
      actualizadoEn: Timestamp.now(),
    });
    
    // Enviar notificación al cliente
    try {
      const notificarPedidoAceptado = httpsCallable(functions, 'notificarPedidoAceptado');
      await notificarPedidoAceptado({ pedidoId, repartidorId });
    } catch (notificationError) {
      console.error("Error al enviar notificación:", notificationError);
    }
    
    return true;
  } catch (error) {
    console.error("Error al aceptar pedido:", error);
    throw error;
  }
};

/**
 * Marcar un pedido como entregado
 * @param pedidoId ID del pedido
 * @returns Promesa vacía 
 */
export const marcarComoEntregado = async (pedidoId: string) => {
  try {
    const ref = doc(db, "pedidos", pedidoId);
    
    // Actualizar estado del pedido
    await updateDoc(ref, { 
      estado: "entregado",
      entregadoEn: Timestamp.now()
    });
    
    // Enviar notificación al cliente
    try {
      const notificarPedidoEntregado = httpsCallable(functions, 'notificarPedidoEntregado');
      await notificarPedidoEntregado({ pedidoId });
    } catch (notificationError) {
      console.error("Error al enviar notificación:", notificationError);
    }
  } catch (error) {
    console.error("Error al marcar pedido como entregado:", error);
    throw error;
  }
};

/**
 * Actualizar la ubicación del repartidor para un pedido
 * @param pedidoId ID del pedido
 * @param latitude Latitud actual
 * @param longitude Longitud actual
 */
export const actualizarUbicacionRepartidor = async (
  pedidoId: string,
  latitude: number,
  longitude: number
) => {
  try {
    const ref = doc(db, "pedidos", pedidoId);
    await updateDoc(ref, {
      ubicacionRepartidor: new GeoPoint(latitude, longitude),
      ultimaActualizacionUbicacion: Timestamp.now()
    });
  } catch (error) {
    console.error("Error al actualizar ubicación del repartidor:", error);
    throw error;
  }
};

/**
 * Suscribirse a un pedido específico para recibir actualizaciones en tiempo real
 * @param pedidoId ID del pedido
 * @param callback Función a llamar cuando hay cambios
 * @returns Función para cancelar la suscripción
 */
export const suscribirseAPedido = (
  pedidoId: string,
  callback: (pedido: Pedido | null) => void
) => {
  const docRef = doc(db, "pedidos", pedidoId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const pedido: Pedido = {
        id: docSnap.id,
        descripcion: data.descripcion,
        estado: data.estado,
        creadoEn: data.creadoEn.toDate(),
        userId: data.userId,
        repartidorId: data.repartidorId,
        productos: data.productos || [],
        total: data.total || 0,
        metodoPago: data.metodoPago || 'efectivo',
      };
      
      callback(pedido);
    } else {
      callback(null);
    }
  });
};
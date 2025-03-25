// Importaciones de Firebase y geolocalización
import { doc, updateDoc, GeoPoint, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Servicio para gestionar la ubicación en tiempo real de los repartidores
 * y permitir el seguimiento de los pedidos.
 * 
 * Este servicio proporciona funciones para:
 * - Actualizar la ubicación del repartidor
 * - Suscribirse a las actualizaciones de ubicación de un repartidor
 * - Calcular distancias y tiempos estimados de llegada
 */

interface Coords {
  latitude: number;
  longitude: number;
}

// ID del observador de posición para poder cancelarlo posteriormente
let watchPositionId: number | null = null;

/**
 * Inicia el seguimiento de la ubicación del repartidor
 * y actualiza automáticamente su posición en Firestore.
 * 
 * @param repartidorId ID del repartidor
 * @param pedidoId ID del pedido que está entregando
 * @param onError Callback para manejar errores
 * @returns Una función para detener el seguimiento
 */
export const iniciarSeguimientoUbicacion = (
  repartidorId: string,
  pedidoId: string,
  onError?: (error: any) => void
): (() => void) => {
  // Verifica si el navegador soporta geolocalización
  if (!navigator.geolocation) {
    if (onError) {
      onError(new Error("La geolocalización no está soportada por este navegador."));
    }
    return () => {};
  }

  // Configuración de las opciones de geolocalización
  const options = {
    enableHighAccuracy: true, // Alta precisión
    timeout: 10000, // Timeout de 10 segundos
    maximumAge: 0 // No usar ubicaciones en caché
  };

  // Función de éxito que se llama cuando se obtiene una nueva posición
  const success = async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    
    try {
      // Actualizar la ubicación del repartidor en Firestore
      await actualizarUbicacionRepartidor(repartidorId, { latitude, longitude });
      
      // Actualizar la ubicación en el pedido
      await actualizarUbicacionPedido(pedidoId, { latitude, longitude });
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error("Error al actualizar ubicación:", error);
    }
  };

  // Función de error que se llama cuando hay un problema obteniendo la posición
  const error = (err: GeolocationPositionError) => {
    if (onError) {
      onError(err);
    }
    console.error("Error de geolocalización:", err);
  };

  // Inicia el seguimiento de la posición
  watchPositionId = navigator.geolocation.watchPosition(success, error, options);

  // Devuelve una función para detener el seguimiento
  return () => {
    if (watchPositionId !== null) {
      navigator.geolocation.clearWatch(watchPositionId);
      watchPositionId = null;
    }
  };
};

/**
 * Actualiza la ubicación de un repartidor en Firestore
 * 
 * @param repartidorId ID del repartidor
 * @param coords Coordenadas (latitud y longitud)
 */
export const actualizarUbicacionRepartidor = async (
  repartidorId: string,
  coords: Coords
): Promise<void> => {
  try {
    const repartidorRef = doc(db, "repartidores_ubicacion", repartidorId);
    
    // Crear un objeto GeoPoint para almacenar las coordenadas
    const ubicacion = new GeoPoint(coords.latitude, coords.longitude);
    
    // Actualizar el documento con la nueva ubicación y timestamp
    await updateDoc(repartidorRef, {
      ubicacion: ubicacion,
      ultimaActualizacion: new Date(),
      enMovimiento: true,
    });
  } catch (error) {
    console.error("Error al actualizar la ubicación del repartidor:", error);
    throw error;
  }
};

/**
 * Actualiza la ubicación asociada a un pedido en Firestore
 * 
 * @param pedidoId ID del pedido
 * @param coords Coordenadas (latitud y longitud)
 */
export const actualizarUbicacionPedido = async (
  pedidoId: string,
  coords: Coords
): Promise<void> => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    
    // Crear un objeto GeoPoint para almacenar las coordenadas
    const ubicacionRepartidor = new GeoPoint(coords.latitude, coords.longitude);
    
    // Actualizar el documento con la nueva ubicación y timestamp
    await updateDoc(pedidoRef, {
      ubicacionRepartidor: ubicacionRepartidor,
      ultimaActualizacionUbicacion: new Date(),
    });
  } catch (error) {
    console.error("Error al actualizar la ubicación en el pedido:", error);
    throw error;
  }
};

/**
 * Detiene el seguimiento de ubicación cuando un pedido es completado o cancelado
 * 
 * @param repartidorId ID del repartidor
 */
export const detenerSeguimientoUbicacion = async (repartidorId: string): Promise<void> => {
  // Detener el watchPosition si está activo
  if (watchPositionId !== null) {
    navigator.geolocation.clearWatch(watchPositionId);
    watchPositionId = null;
  }
  
  try {
    // Actualizar el estado del repartidor a "no en movimiento"
    const repartidorRef = doc(db, "repartidores_ubicacion", repartidorId);
    await updateDoc(repartidorRef, {
      enMovimiento: false,
      ultimaActualizacion: new Date(),
    });
  } catch (error) {
    console.error("Error al detener el seguimiento de ubicación:", error);
    throw error;
  }
};

/**
 * Suscribe a las actualizaciones de ubicación de un pedido
 * 
 * @param pedidoId ID del pedido
 * @param callback Función que se llama con cada actualización de ubicación
 * @returns Función para cancelar la suscripción
 */
export const suscribirseUbicacionPedido = (
  pedidoId: string,
  callback: (ubicacion: {latitude: number, longitude: number} | null) => void
): (() => void) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);
  
  // Crear un listener para los cambios en el documento del pedido
  const unsubscribe = onSnapshot(pedidoRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data.ubicacionRepartidor) {
        // Pasar las coordenadas al callback
        callback({
          latitude: data.ubicacionRepartidor.latitude,
          longitude: data.ubicacionRepartidor.longitude,
        });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error al suscribirse a la ubicación del pedido:", error);
    callback(null);
  });
  
  // Devolver función para cancelar la suscripción
  return unsubscribe;
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * 
 * @param coords1 Coordenadas del primer punto
 * @param coords2 Coordenadas del segundo punto
 * @returns Distancia en kilómetros
 */
export const calcularDistancia = (
  coords1: Coords,
  coords2: Coords
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distancia en km
  
  return d;
};

/**
 * Calcula el tiempo estimado de llegada basado en la distancia
 * y una velocidad promedio de 30 km/h para zonas urbanas
 * 
 * @param distanciaKm Distancia en kilómetros
 * @param velocidadPromedio Velocidad promedio en km/h (por defecto 30)
 * @returns Tiempo estimado en minutos
 */
export const calcularTiempoEstimado = (
  distanciaKm: number,
  velocidadPromedio: number = 30
): number => {
  // Convertir la distancia a tiempo en horas
  const tiempoHoras = distanciaKm / velocidadPromedio;
  
  // Convertir a minutos
  const tiempoMinutos = tiempoHoras * 60;
  
  // Agregar un margen de 5 minutos para tráfico, semáforos, etc.
  return Math.ceil(tiempoMinutos) + 5;
};

/**
 * Función auxiliar para convertir grados a radianes
 * 
 * @param grados Valor en grados
 * @returns Valor en radianes
 */
const toRad = (grados: number): number => {
  return grados * Math.PI / 180;
};

/**
 * Solicita permiso de ubicación al usuario
 * 
 * @returns Promesa que se resuelve cuando el usuario otorga permiso
 */
export const solicitarPermisoUbicacion = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La geolocalización no está soportada por este navegador."));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Crea un objeto de ubicación inicial para un repartidor
 * 
 * @param repartidorId ID del repartidor
 * @param coords Coordenadas iniciales
 */
export const crearUbicacionInicial = async (
  repartidorId: string,
  coords: Coords
): Promise<void> => {
  try {
    const repartidorRef = doc(db, "repartidores_ubicacion", repartidorId);
    
    // Crear un objeto GeoPoint para almacenar las coordenadas
    const ubicacion = new GeoPoint(coords.latitude, coords.longitude);
    
    // Crear el documento con la ubicación inicial
    await updateDoc(repartidorRef, {
      ubicacion: ubicacion,
      ultimaActualizacion: new Date(),
      enMovimiento: false,
      nombre: "", // Se rellenará con datos del usuario
      telefono: "", // Se rellenará con datos del usuario
      pedidoActual: null // ID del pedido que está entregando actualmente
    });
  } catch (error) {
    console.error("Error al crear la ubicación inicial del repartidor:", error);
    throw error;
  }
};

/**
 * Actualiza el pedido actual que está entregando un repartidor
 * 
 * @param repartidorId ID del repartidor
 * @param pedidoId ID del pedido
 */
export const actualizarPedidoActual = async (
  repartidorId: string,
  pedidoId: string | null
): Promise<void> => {
  try {
    const repartidorRef = doc(db, "repartidores_ubicacion", repartidorId);
    
    await updateDoc(repartidorRef, {
      pedidoActual: pedidoId,
      enMovimiento: pedidoId !== null
    });
  } catch (error) {
    console.error("Error al actualizar el pedido actual:", error);
    throw error;
  }
};

/**
 * Obtiene la ubicación actual de un repartidor
 * 
 * @param repartidorId ID del repartidor
 * @returns Promesa con las coordenadas o null si no existe
 */
export const obtenerUbicacionRepartidor = async (
  repartidorId: string
): Promise<Coords | null> => {
  try {
    const repartidorRef = doc(db, "repartidores_ubicacion", repartidorId);
    const docSnap = await getDoc(repartidorRef);
    
    if (docSnap.exists() && docSnap.data().ubicacion) {
      const ubicacion = docSnap.data().ubicacion;
      return {
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener la ubicación del repartidor:", error);
    return null;
  }
};
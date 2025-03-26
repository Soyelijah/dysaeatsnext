// src/types/pedido.ts (Next.js)

// Interfaz que define la estructura de un pedido
export interface Pedido {
  // ID único del pedido (opcional)
  id?: string;

  // Descripción del pedido
  descripcion: string;

  // Estado actual del pedido
  estado: "pendiente" | "en camino" | "entregado" | "cancelado";

  // Fecha y hora en que se creó el pedido
  creadoEn: Date;

  // ID del usuario asociado al pedido
  userId: string;

  // ID del repartidor asociado al pedido (opcional)
  repartidorId?: string;
  
  // Lista de productos incluidos en el pedido (opcional)
  productos?: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  
  // Costo total del pedido (opcional)
  total?: number;
  
  // Método de pago (opcional)
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
  
  // Ubicación del cliente (opcional)
  ubicacionCliente?: {
    latitude: number;
    longitude: number;
    direccion: string;
  };
  
  // Ubicación del repartidor (opcional)
  ubicacionRepartidor?: {
    latitude: number;
    longitude: number;
  };
  
  // Fechas de seguimiento (opcionales)
  aceptadoEn?: Date;
  entregadoEn?: Date;
  canceladoEn?: Date;
}
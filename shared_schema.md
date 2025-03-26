# 📦 Modelo Compartido de Datos - DysaEats

Este archivo define la estructura unificada de los modelos usados en Firebase Firestore, para mantener sincronizadas las apps web y móvil.

---

## 🛍️ Pedido (`pedidos`)
```ts
{
  id: string;
  descripcion: string;
  estado: 'pendiente' | 'en camino' | 'entregado' | 'cancelado';
  creadoEn: Timestamp;
  userId: string;
  repartidorId?: string;
  productos?: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  total?: number;
  ubicacionRepartidor?: GeoPoint;
  ultimaActualizacionUbicacion?: Timestamp;
}

👤 Usuario (users)

{
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  telefono?: string;
  direccion?: string;
  role: 'cliente' | 'repartidor' | 'admin';
  createdAt: Timestamp;
}


📍 Ubicación de Repartidores (repartidores_ubicacion)

{
  ubicacion: GeoPoint;
  velocidad?: number;
  heading?: number;
  precision?: number;
  altitud?: number;
  pedidoActual?: string;
  enMovimiento: boolean;
  ultimaActualizacion: Timestamp;
}

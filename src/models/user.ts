// dysaeatsnext/src/models/user.ts
export interface Usuario {
    uid: string
    name: string
    email: string
    photoURL: string
    telefono?: string
    direccion?: string
    role: 'cliente' | 'repartidor' | 'admin'
    createdAt?: Date
  }
  
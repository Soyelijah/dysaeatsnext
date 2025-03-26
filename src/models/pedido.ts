import { Producto } from './producto'; // Asegúrate de ajustar la ruta si es necesario

export interface Pedido {
    id: string;
    clienteId: string; // Cambiado de userId a clienteId
    productos: Producto[]; // Ahora TypeScript reconoce Producto
    descripcion: string;
    estado: 'pendiente' | 'en camino' | 'entregado' | 'cancelado';
    creadoEn: Date;
    repartidorId?: string;
    total?: number;
}

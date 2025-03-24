// Interfaz que define la estructura de un pedido
export interface Pedido {
  // ID único del pedido (opcional)
  // Identificador único del pedido, puede ser nulo o indefinido. Se utiliza para diferenciar cada pedido.
  id?: string;

  // Descripción del pedido
  // Detalle o información sobre el pedido, como los productos o servicios solicitados.
  descripcion: string;

  // Estado actual del pedido
  // Representa el estado del pedido, restringido a valores específicos: "pendiente", "en camino" o "entregado".
  estado: "pendiente" | "en camino" | "entregado";

  // Fecha y hora en que se creó el pedido
  // Marca temporal que indica cuándo se generó el pedido.
  creadoEn: Date;

  // ID del usuario asociado al pedido
  // Identificador del usuario que realizó el pedido, necesario para asociar el pedido a un cliente.
  userId: string;

  // ID del repartidor asociado al pedido (opcional)
  // Identificador del repartidor asignado al pedido, puede ser nulo o indefinido si aún no se ha asignado.
  repartidorId?: string;
}

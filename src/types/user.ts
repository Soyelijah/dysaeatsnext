// Define la interfaz para representar un usuario en la aplicación
export interface UserApp {
  // Identificador único del usuario
  uid: string; // UID único para identificar al usuario en la base de datos
  
  // Nombre completo del usuario
  name: string; // Nombre del usuario para mostrar en la aplicación
  
  // Correo electrónico del usuario
  email: string; // Dirección de correo electrónico para contacto y autenticación
  
  // URL opcional de la foto de perfil del usuario
  photoURL?: string; // Foto de perfil del usuario (opcional)
  
  // Rol del usuario en la aplicación: cliente, repartidor o administrador
  role: "cliente" | "repartidor" | "admin"; // Define el nivel de acceso del usuario
  
  // RUT opcional del usuario
  rut?: string; // Identificación tributaria del usuario (opcional)
  
  // Código interno opcional del usuario
  codigoInterno?: string; // Código interno para uso administrativo (opcional)

  // Teléfono opcional del usuario
  telefono?: string; // Número de contacto del usuario (opcional)

  // Dirección opcional del usuario
  direccion?: string; // Dirección física del usuario (opcional)
}

// Importación de configuraciones y métodos necesarios de Firebase
import { db } from "./firebaseConfig"; // Configuración de la base de datos Firebase
import {
  collection, // Acceso a una colección en Firestore
  addDoc, // Agregar un documento a Firestore
  query, // Construir consultas en Firestore
  where, // Agregar condiciones a las consultas
  orderBy, // Ordenar resultados de consultas
  getDocs, // Obtener documentos de una consulta
  Timestamp, // Manejar marcas de tiempo en Firestore
  doc, // Acceso a un documento específico en Firestore
  getDoc, // Obtener un documento específico de Firestore
  updateDoc, // Actualizar un documento en Firestore
} from "firebase/firestore"; // Métodos de Firestore para interactuar con la base de datos

// Importación de tipos para tipar los datos
import { Pedido } from "@/types/pedido"; // Tipo Pedido
import { UserApp } from "@/types/user"; // Tipo UserApp

// Referencia a la colección "pedidos" en Firestore
const pedidosRef = collection(db, "pedidos"); // Punto de acceso a la colección "pedidos"

// Crear un nuevo pedido en Firestore
export const crearPedido = async (pedido: Pedido) => {
  // Agregar un nuevo documento a la colección "pedidos"
  return await addDoc(pedidosRef, {
    descripcion: pedido.descripcion, // Descripción del pedido
    estado: pedido.estado, // Estado del pedido
    creadoEn: Timestamp.fromDate(pedido.creadoEn), // Fecha de creación convertida a Timestamp
    userId: pedido.userId, // ID del usuario que creó el pedido
  });
};

// Obtener pedidos de un usuario específico
export const obtenerPedidosPorUsuario = async (userId: string) => {
  // Construir consulta para filtrar pedidos por userId y ordenarlos por fecha de creación
  const q = query(
    pedidosRef,
    where("userId", "==", userId), // Condición: userId debe coincidir
    orderBy("creadoEn", "desc") // Ordenar por "creadoEn" en orden descendente
  );

  // Ejecutar consulta y mapear documentos a objetos Pedido
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id, // ID del documento
    ...doc.data(), // Datos del documento
    creadoEn: doc.data().creadoEn.toDate(), // Convertir Timestamp a fecha
  })) as Pedido[];
};

// Obtener todos los pedidos
export const obtenerTodosLosPedidos = async (): Promise<Pedido[]> => {
  // Construir consulta para obtener todos los pedidos ordenados por "creadoEn"
  const q = query(collection(db, "pedidos"), orderBy("creadoEn", "desc"));

  // Ejecutar consulta y mapear documentos a objetos Pedido
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id, // ID del documento
    ...doc.data(), // Datos del documento
    creadoEn: doc.data().creadoEn.toDate(), // Convertir Timestamp a fecha
  })) as Pedido[];
};

// Obtener un usuario específico por su UID
export const obtenerUsuario = async (uid: string): Promise<UserApp | null> => {
  // Referencia al documento del usuario en la colección "users"
  const ref = doc(db, "users", uid);

  // Obtener documento del usuario y verificar existencia
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  // Extraer datos del documento y retornarlos como UserApp
  const data = snap.data();
  return {
    uid, // UID del usuario
    name: data.name, // Nombre del usuario
    email: data.email, // Correo electrónico del usuario
    photoURL: data.photoURL, // URL de la foto del usuario
    role: data.role, // Rol del usuario
    telefono: data.telefono || "",     // Agregado
    direccion: data.direccion || "",   // Agregado
    rut: data.rut || "",               // Agregado
  };
};

// Actualizar el rol de un usuario en Firestore
export const actualizarRolUsuario = async (uid: string, nuevoRol: string) => {
  // Referencia al documento del usuario en la colección "users"
  const ref = doc(db, "users", uid);

  // Actualizar el campo "role" del documento
  return await updateDoc(ref, { role: nuevoRol });
};

// Aceptar un pedido y asignarlo a un repartidor
export const aceptarPedido = async (pedidoId: string, repartidorId: string) => {
  // Referencia al documento del pedido en la colección "pedidos"
  const ref = doc(db, "pedidos", pedidoId);

  // Actualizar estado del pedido y asignar ID del repartidor
  return await updateDoc(ref, {
    estado: "en camino", // Cambiar estado a "en camino"
    repartidorId: repartidorId, // Asignar ID del repartidor
  });
};

// Marcar un pedido como entregado
export const marcarComoEntregado = async (pedidoId: string) => {
  // Referencia al documento del pedido en la colección "pedidos"
  const ref = doc(db, "pedidos", pedidoId);

  // Actualizar estado del pedido a "entregado"
  await updateDoc(ref, { estado: "entregado" });
};

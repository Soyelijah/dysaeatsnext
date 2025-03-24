// Importación de dependencias necesarias
// Se importan hooks de React, funciones de Firebase y tipos personalizados.
"use client";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { obtenerUsuario, actualizarRolUsuario } from "@/firebase/firestoreService";
import { UserApp } from "@/types/user";
import RutInput from "@/components/RutInput"; // Importación del componente RutInput
import { doc, updateDoc } from "firebase/firestore"; // Importación de funciones para actualizar Firestore
import { db } from "@/firebase/firebaseConfig"; // Importación de la configuración de Firestore

// Componente principal de la página de perfil
// Define el estado inicial y maneja la lógica de autenticación y carga de datos del usuario.
export default function PerfilPage() {
  // Estado para almacenar los datos del usuario
  // `userData` contiene la información del usuario autenticado.
  const [userData, setUserData] = useState<UserApp | null>(null);

  // Estado para manejar el estado de carga
  // `loading` indica si los datos del usuario aún están cargándose.
  const [loading, setLoading] = useState(true);

  const [actualizando, setActualizando] = useState(false); // Estado para manejar la actualización del rol

  // Efecto para manejar el estado de autenticación
  // Escucha los cambios en el estado de autenticación y obtiene los datos del usuario.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const datos = await obtenerUsuario(user.uid); // Obtiene los datos del usuario desde Firestore.
        setUserData(datos); // Actualiza el estado con los datos del usuario.
      }
      setLoading(false); // Cambia el estado de carga a falso.
    });

    return () => unsub(); // Limpia el listener al desmontar el componente.
  }, []);

  // Función para cambiar el rol del usuario
  // Actualiza el rol en Firestore y actualiza el estado local con los datos actualizados.
  const cambiarRol = async (nuevoRol: string) => {
    if (!userData) return;

    setActualizando(true); // Indica que la actualización está en progreso
    await actualizarRolUsuario(userData.uid, nuevoRol); // Actualiza el rol en Firestore
    const datosActualizados = await obtenerUsuario(userData.uid); // Obtiene los datos actualizados
    setUserData(datosActualizados); // Actualiza el estado local
    setActualizando(false); // Finaliza la actualización
  };

  // Renderizado condicional mientras se cargan los datos
  // Muestra un mensaje de carga o de error si no se encuentra el usuario.
  if (loading) return <p className="text-center mt-10">Cargando perfil...</p>;
  if (!userData) return <p className="text-center mt-10">No se encontró el usuario</p>;

  // Determina si el usuario es administrador
  const esAdmin = userData.role === "admin";

  // Renderizado del perfil del usuario
  // Muestra la información del usuario, incluyendo campos editables y opciones de rol.
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-md shadow text-center">
      {/* Foto de perfil del usuario */}
      {userData.photoURL && (
        <img
          src={userData.photoURL}
          alt="Foto de perfil"
          className="w-24 h-24 mx-auto rounded-full mb-4"
        />
      )}

      {/* Formulario para editar datos del usuario */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!userData) return;

          const ref = doc(db, "users", userData.uid); // Referencia al documento del usuario en Firestore
          await updateDoc(ref, {
            name: userData.name, // Actualiza el nombre del usuario
            telefono: userData.telefono, // Actualiza el teléfono del usuario
            direccion: userData.direccion, // Actualiza la dirección del usuario
            rut: userData.rut, // Actualiza el RUT del usuario
          });

          alert("✅ Perfil actualizado con éxito"); // Muestra un mensaje de éxito
        }}
      >
        {/* Campo editable: Nombre */}
        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Nombre completo"
          value={userData.name}
          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          required
        />

        {/* Teléfono */}
        <div className="relative mb-2">
          <span className="absolute top-2.5 left-2 text-gray-500">+56 9</span>
          <input
            type="text"
            className="border p-2 pl-16 rounded w-full"
            placeholder="XXXX XXXX"
            value={userData.telefono?.replace("+56 9 ", "") || ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 8); // solo números, máx 8 dígitos
              const formateado = `+56 9 ${digits.slice(0, 4)} ${digits.slice(4)}`;
              setUserData({ ...userData, telefono: formateado });
            }}
            inputMode="numeric"
            pattern="\d{4} \d{4}"
            required
          />
        </div>


        {/* Campo editable: Dirección */}
        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Dirección"
          value={userData.direccion || ""}
          onChange={(e) => setUserData({ ...userData, direccion: e.target.value })}
          required
        />

        {/* Campo editable: RUT */}
        <RutInput
          value={userData.rut || ""}
          onChange={(rut) => setUserData({ ...userData, rut })}
        />

        {/* Botón para guardar cambios */}
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Guardar Cambios
        </button>
      </form>

      {/* Mostrar rol del usuario */}
      <div className="mt-4 inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
        Rol: {userData.role}
      </div>

      {/* Selector para cambiar rol (solo visible para administradores) */}
      {esAdmin && (
        <div className="mt-4">
          <label className="block mb-2 text-sm font-medium">Cambiar rol</label>
          <select
            className="border p-2 rounded w-full"
            value={userData.role}
            onChange={(e) => cambiarRol(e.target.value)}
            disabled={actualizando}
          >
            <option value="cliente">Cliente</option>
            <option value="repartidor">Repartidor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )}
    </div>
  );
}

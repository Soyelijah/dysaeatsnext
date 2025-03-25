"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import { obtenerUsuario } from "@/firebase/firestoreService";
import { UserApp } from "@/types/user";
import RutInput from "@/components/RutInput";
import { Button } from "@/components/Button";

/**
 * Componente de Página de Perfil
 * 
 * Permite a los usuarios ver y actualizar su información personal,
 * incluyendo nombre, teléfono, dirección, RUT, email y contraseña.
 * Integra validación de datos y gestión de errores.
 */
export default function PerfilPage() {
  // Estados para manejar los datos del usuario y UI
  const [userData, setUserData] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [editMode, setEditMode] = useState(false);
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Estado para cambio de email
  const [newEmail, setNewEmail] = useState('');
  
  const router = useRouter();

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const datos = await obtenerUsuario(user.uid);
        setUserData(datos);
        setNewEmail(user.email || '');
      } else {
        // Redirigir a login si no hay usuario autenticado
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // Manejar actualización de datos del perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setSaving(true);
    setMessage(null);

    try {
      // Referencia al documento del usuario en Firestore
      const ref = doc(db, "users", userData.uid);
      
      // Actualizar datos en Firestore
      await updateDoc(ref, {
        name: userData.name,
        telefono: userData.telefono,
        direccion: userData.direccion,
        rut: userData.rut,
      });

      // Actualizar nombre de visualización en Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: userData.name,
        });
      }

      setMessage({ type: 'success', text: '✅ Perfil actualizado con éxito' });
      setEditMode(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage({ type: 'error', text: '❌ Error al actualizar el perfil. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  // Cambiar contraseña
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    // Validaciones básicas
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Usuario no autenticado");
      
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Actualizar contraseña
      await user.updatePassword(newPassword);
      
      setMessage({ type: 'success', text: '✅ Contraseña actualizada correctamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      
      // Mensajes de error específicos
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'La contraseña actual es incorrecta' });
      } else if (error.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Demasiados intentos. Inténtalo más tarde.' });
      } else {
        setMessage({ type: 'error', text: 'Error al cambiar la contraseña. Inténtalo de nuevo.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Cambiar email
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Por favor, introduce un email válido' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      
      // Actualizar email en Firebase Auth
      await updateEmail(user, newEmail);
      
      // Actualizar email en Firestore
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { email: newEmail });
      
      setMessage({ type: 'success', text: '✅ Email actualizado correctamente' });
    } catch (error: any) {
      console.error("Error al cambiar email:", error);
      
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ 
          type: 'error', 
          text: 'Esta operación es sensible y requiere que hayas iniciado sesión recientemente. Por favor, cierra sesión y vuelve a iniciar sesión.'
        });
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage({ type: 'error', text: 'Este email ya está en uso por otra cuenta.' });
      } else {
        setMessage({ type: 'error', text: 'Error al cambiar el email. Inténtalo de nuevo.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Mientras se cargan los datos del usuario
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Si no se encuentra el usuario
  if (!userData) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold text-red-600">No se encontró el usuario</h2>
        <p className="mt-4">
          Parece que ha ocurrido un error al cargar tu perfil. Por favor, intenta iniciar sesión nuevamente.
        </p>
        <Button 
          onClick={() => router.push('/login')} 
          className="mt-4"
          variant="primary"
        >
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  // Determinar si el usuario es administrador
  const esAdmin = userData.role === "admin";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Encabezado del perfil con imagen */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              {userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Foto de perfil"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-orange-300 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {userData.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">{userData.name || "Usuario"}</h1>
              <p className="text-orange-100 mt-1">{userData.email}</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-800 text-white">
                  {userData.role === "admin" 
                    ? "Administrador" 
                    : userData.role === "repartidor"
                      ? "Repartidor"
                      : "Cliente"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'general'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('general')}
            >
              Información General
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Seguridad
            </button>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          {/* Mostrar mensajes de éxito o error */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Pestaña de información general */}
          {activeTab === 'general' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Datos Personales</h2>
                {!editMode ? (
                  <Button 
                    onClick={() => setEditMode(true)} 
                    variant="outline"
                    size="sm"
                    leftIcon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    }
                  >
                    Editar
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setEditMode(false)} 
                    variant="ghost"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="py-2">{userData.name || "No especificado"}</p>
                    )}
                  </div>

                  {/* Email (solo lectura en esta sección) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <p className="py-2">{userData.email}</p>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    {editMode ? (
                      <div className="relative">
                        <span className="absolute top-1/2 transform -translate-y-1/2 left-3 text-gray-500">+56 9</span>
                        <input
                          type="text"
                          className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={userData.telefono?.replace("+56 9 ", "") || ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                            const formateado = `+56 9 ${digits.slice(0, 4)} ${digits.slice(4)}`;
                            setUserData({ ...userData, telefono: formateado });
                          }}
                          inputMode="numeric"
                          pattern="\d{4} \d{4}"
                          required
                        />
                      </div>
                    ) : (
                      <p className="py-2">{userData.telefono || "No especificado"}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={userData.direccion || ""}
                        onChange={(e) => setUserData({ ...userData, direccion: e.target.value })}
                        required
                      />
                    ) : (
                      <p className="py-2">{userData.direccion || "No especificado"}</p>
                    )}
                  </div>

                  {/* RUT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUT
                    </label>
                    {editMode ? (
                      <RutInput
                        value={userData.rut || ""}
                        onChange={(rut) => setUserData({ ...userData, rut })}
                      />
                    ) : (
                      <p className="py-2">{userData.rut || "No especificado"}</p>
                    )}
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <p className="py-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {userData.role === "admin" 
                          ? "Administrador" 
                          : userData.role === "repartidor"
                            ? "Repartidor"
                            : "Cliente"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Botón de guardar (solo en modo edición) */}
                {editMode && (
                  <div className="mt-6">
                    <Button
                      type="submit"
                      isLoading={saving}
                      loadingText="Guardando..."
                      variant="primary"
                      fullWidth
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Pestaña de seguridad */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Cambio de correo electrónico */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Cambiar Correo Electrónico</h2>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nuevo correo electrónico
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={saving}
                    loadingText="Actualizando..."
                    variant="secondary"
                  >
                    Actualizar Correo
                  </Button>
                </form>
              </div>
              
              {/* Separador */}
              <hr className="my-6" />

              {/* Cambio de contraseña */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={saving}
                    loadingText="Actualizando..."
                    variant="secondary"
                  >
                    Cambiar Contraseña
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
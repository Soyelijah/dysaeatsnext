"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { signInWithGoogle } from "@/firebase/authService";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    const user = await signInWithGoogle();
    if (user) {
      router.push("/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-orange-600/30 p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Sección izquierda con ilustración */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-orange-500/10 to-orange-500/20 p-8 md:p-12 flex items-center justify-center relative">
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {/* Aquí puedes incluir una ilustración de comida o delivery como la del ejemplo */}
            <div className="relative w-64 h-80">
              <div className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-10 top-0 left-0"></div>
              <div className="relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-orange-500 mx-auto">
                  <path d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
                  <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.006zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
                </svg>
                <div className="text-center mt-6">
                  <h2 className="text-2xl font-bold text-orange-600">DysaEats</h2>
                  <p className="text-orange-700 mt-2">Tu comida favorita a domicilio</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-orange-500/10 to-transparent"></div>
        </div>
        
        {/* Sección derecha con formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Inicio de Sesión</h1>
              <p className="text-gray-500 mt-2 text-sm">Ingresa para disfrutar de la mejor comida</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="text-sm text-gray-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  id="email" 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="text-sm text-gray-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Contraseña
                </label>
                <input 
                  type="password" 
                  id="password" 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox" 
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Recordarme
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              
              <div>
                <Button
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium text-sm"
                >
                  Iniciar Sesión
                </Button>
              </div>
              
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>
              
              <Button
                onClick={handleLogin}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg flex items-center justify-center gap-3 transition shadow-sm"
              >
                <div className="w-5 h-5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Google</span>
              </Button>
            </div>
            
            <p className="mt-8 text-center text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                Regístrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
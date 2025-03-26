'use client';

import React, { useEffect } from "react";
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { solicitarPermisoYObtenerToken, escucharMensajesEnPrimerPlano } from "@/firebase/notificationListener";
import { metadata } from "./metadata"; // 👈 usa el archivo del paso anterior

// Configuración de fuentes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Componente RootLayout
 * 
 * Layout principal de la aplicación que incluye:
 * - Configuración de fuentes
 * - Barra de navegación
 * - Estructura básica HTML
 * - Pie de página
 */
export default function RootLayout({ children }: RootLayoutProps) {
  useEffect(() => {
    solicitarPermisoYObtenerToken();
    escucharMensajesEnPrimerPlano();
  }, []);

  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Barra de navegación */}
        <Navbar />

        {/* Contenido principal */}
        <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Pie de página */}
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Columna 1 */}
              <div>
                <h3 className="text-lg font-bold mb-4">DysaEats</h3>
                <p className="text-gray-300">
                  Tu plataforma de confianza para pedidos y entregas a domicilio
                </p>
              </div>

              {/* Columna 2 */}
              <div>
                <h3 className="text-lg font-bold mb-4">Enlaces</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                      Sobre nosotros
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
                      Términos y condiciones
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                      Política de privacidad
                    </a>
                  </li>
                </ul>
              </div>

              {/* Columna 3 */}
              <div>
                <h3 className="text-lg font-bold mb-4">Contáctanos</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300">contacto@dysaeats.com</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-300">+56 9 1234 5678</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
              © {new Date().getFullYear()} DysaEats. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/firebase/firebaseConfig";
import { obtenerUsuario } from "@/firebase/firestoreService";
import { UserApp } from "@/types/user";

export default function Home() {
  const [user, setUser] = useState<UserApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar el estado de autenticación
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await obtenerUsuario(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Características principales del servicio
  const features = [
    {
      icon: "/icons/fast-delivery.svg",
      title: "Entrega Rápida",
      description: "Recibe tus pedidos en tiempo récord con nuestro sistema optimizado de reparto.",
    },
    {
      icon: "/icons/restaurant.svg",
      title: "Restaurantes Locales",
      description: "Apoya a los negocios de tu zona con una amplia selección de restaurantes locales.",
    },
    {
      icon: "/icons/tracking.svg",
      title: "Seguimiento en Tiempo Real",
      description: "Sigue el estado de tu pedido en tiempo real, desde la preparación hasta la entrega.",
    },
    {
      icon: "/icons/payment.svg",
      title: "Pagos Seguros",
      description: "Múltiples métodos de pago con la máxima seguridad para tus transacciones.",
    },
  ];

  // Testimonios de usuarios
  const testimonials = [
    {
      name: "Ana Rodríguez",
      role: "Cliente",
      testimonial: "DysaEats ha cambiado mi forma de pedir comida. La aplicación es intuitiva y los repartidores siempre son puntuales.",
      avatar: "/avatars/user1.jpg",
    },
    {
      name: "Carlos Méndez",
      role: "Repartidor",
      testimonial: "Como repartidor, valoro la flexibilidad y el buen trato que recibo. La plataforma hace que mi trabajo sea más eficiente.",
      avatar: "/avatars/user2.jpg",
    },
    {
      name: "Restaurante El Sabor",
      role: "Restaurante",
      testimonial: "Desde que nos unimos a DysaEats, nuestras ventas han aumentado considerablemente. El proceso es sencillo y bien organizado.",
      avatar: "/avatars/restaurant1.jpg",
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16 sm:py-24 rounded-xl overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                La comida que amas, en la puerta de tu casa
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Descubre los mejores restaurantes de tu zona y recibe tus comidas favoritas sin salir de casa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!loading && !user ? (
                  <Link href="/login" className="bg-white text-orange-600 hover:bg-gray-100 transition-colors font-semibold px-6 py-3 rounded-lg text-center">
                    Iniciar Sesión
                  </Link>
                ) : (
                  <Link href="/pedidos/nuevo" className="bg-white text-orange-600 hover:bg-gray-100 transition-colors font-semibold px-6 py-3 rounded-lg text-center">
                    Realizar Pedido
                  </Link>
                )}
                <Link href="/about" className="bg-transparent border-2 border-white hover:bg-white/10 transition-colors font-semibold px-6 py-3 rounded-lg text-center">
                  Conoce Más
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="w-full h-[400px] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-white/30 backdrop-blur-md rounded-lg transform rotate-12 shadow-xl"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-white rounded-lg shadow-xl overflow-hidden transform -rotate-6">
                    <div className="w-full h-full relative">
                      {/* Placeholder para imagen de comida */}
                      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">Imagen de Comida</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Patrones de fondo decorativos */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full"></div>
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-white opacity-10 rounded-full"></div>
        </div>
      </section>

      {/* Características */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Por qué elegir DysaEats?</h2>
            <p className="text-gray-600 text-lg">
              Descubre las ventajas que nos hacen la mejor opción para tus pedidos a domicilio
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className="w-8 h-8 text-orange-500">
                    {/* Placeholder para ícono */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="bg-gray-100 py-16 rounded-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-orange-500">500+</div>
              <div className="text-gray-600">Restaurantes</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-orange-500">10k+</div>
              <div className="text-gray-600">Clientes Satisfechos</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-orange-500">300+</div>
              <div className="text-gray-600">Repartidores</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-orange-500">50k+</div>
              <div className="text-gray-600">Entregas Realizadas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Nuestros Usuarios Opinan</h2>
            <p className="text-gray-600 text-lg">
              Descubre lo que clientes, repartidores y restaurantes dicen sobre nuestra plataforma
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4">
                    {/* Placeholder para avatar */}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.testimonial}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-500 text-white py-16 rounded-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para probar DysaEats?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Une a nuestra comunidad y disfruta de la mejor experiencia en pedidos a domicilio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && !user ? (
              <Link href="/login" className="bg-white text-orange-600 hover:bg-gray-100 transition-colors font-semibold px-6 py-3 rounded-lg">
                Iniciar Sesión
              </Link>
            ) : (
              <Link href="/pedidos/nuevo" className="bg-white text-orange-600 hover:bg-gray-100 transition-colors font-semibold px-6 py-3 rounded-lg">
                Realizar Pedido
              </Link>
            )}
            <Link href="/about" className="bg-transparent border-2 border-white hover:bg-white/10 transition-colors font-semibold px-6 py-3 rounded-lg">
              Conoce Más
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
# DysaEats - Aplicación Web

Aplicación web para servicio de entrega de comida desarrollada con Next.js, React y TypeScript.

## Descripción

DysaEats es una plataforma completa para servicios de entrega de comida que conecta a clientes, repartidores y restaurantes. Esta aplicación web forma parte de un ecosistema que también incluye una aplicación móvil complementaria.

## Características

- **Autenticación de usuarios**: Inicio de sesión con Google y gestión de cuentas
- **Gestión de pedidos**: Crear, visualizar y dar seguimiento a pedidos
- **Seguimiento en tiempo real**: Visualización de la ubicación del repartidor en tiempo real
- **Panel de repartidor**: Interfaz específica para la gestión de entregas
- **Panel de administrador**: Control centralizado para administración del sistema
- **Notificaciones**: Sistema de alertas para mantener informados a todos los usuarios

## Tecnologías utilizadas

- **Next.js 15.2.3**: Framework React con renderizado del lado del servidor
- **React 19.0.0**: Biblioteca para construir interfaces de usuario
- **TypeScript 5**: Superconjunto tipado de JavaScript
- **Firebase 11.4.0**: Plataforma de desarrollo para aplicaciones web y móviles
  - Authentication: Gestión de usuarios
  - Firestore: Base de datos NoSQL
  - Cloud Functions: Lógica de servidor serverless
  - Cloud Messaging: Notificaciones push
- **Tailwind CSS 4**: Framework CSS para diseño rápido
- **Google Maps API**: Integración de mapas y servicios de ubicación

## Requisitos previos

- Node.js 18.x o superior
- npm 8.x o superior
- Cuenta de Firebase
- Clave API de Google Maps

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/dysaeatsnext.git
   cd dysaeatsnext

2. Instala las dependencias:

npm install

3. Configura las variables de entorno:

- Crea un archivo .env.local en la raíz del proyecto
- Copia el contenido de .env.example y completa con tus propias claves

4. Inicia el servidor de desarrollo:

npm run dev

5. Abre http://localhost:3000 en tu navegador para ver la aplicación.

Estructura del proyecto

src/
├── app/                # Rutas y páginas de la aplicación
├── components/         # Componentes reutilizables
├── firebase/           # Configuración y servicios de Firebase
├── styles/             # Estilos globales
├── types/              # Definiciones de tipos TypeScript
└── utils/              # Utilidades y funciones auxiliares

Despliegue
Para compilar el proyecto para producción:

npm run build

Puedes desplegar la aplicación en plataformas como Vercel, Netlify o Firebase Hosting.
Recursos adicionales

- Documentación de Next.js
- Documentación de Firebase
- Documentación de Google Maps Platform

Aplicación móvil relacionada
Este proyecto tiene una contraparte móvil desarrollada con Flutter. Puedes encontrarla en dysaeatsflutter.
Licencia
MIT
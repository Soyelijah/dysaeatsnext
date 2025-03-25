"use client";

import React, { useState, useEffect, useRef } from "react";
import { suscribirseUbicacionPedido, calcularDistancia, calcularTiempoEstimado } from "@/firebase/locationService";
import { Button } from "@/components/Button";

// Definición de propiedades del componente
interface DeliveryMapProps {
  pedidoId: string;
  direccionCliente?: string;
  onUbicacionChanged?: (coords: { latitude: number; longitude: number } | null) => void;
}

/**
 * Componente de mapa para seguimiento de pedidos en tiempo real
 * 
 * Este componente muestra un mapa con la ubicación actual del repartidor y la dirección de entrega,
 * permitiendo seguir el progreso del pedido y calcular tiempos estimados.
 */
export const DeliveryMap: React.FC<DeliveryMapProps> = ({ 
  pedidoId, 
  direccionCliente,
  onUbicacionChanged
}) => {
  // Referencias para el mapa y marcadores
  const mapRef = useRef<google.maps.Map | null>(null);
  const repartidorMarkerRef = useRef<google.maps.Marker | null>(null);
  const clienteMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRef = useRef<google.maps.Polyline | null>(null);
  
  // Estados del componente
  const [ubicacionRepartidor, setUbicacionRepartidor] = useState<{ latitude: number; longitude: number } | null>(null);
  const [ubicacionCliente, setUbicacionCliente] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [tiempoEstimado, setTiempoEstimado] = useState<number | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Cargar la API de Google Maps
  useEffect(() => {
    // Verificar si la API ya está cargada
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    // Función para cargar la API
    const loadGoogleMapsScript = () => {
      // Crear un script para cargar la API
      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      
      // Definir la función de callback
      window.initMap = () => {
        setMapsLoaded(true);
      };
      
      // Agregar el script al DOM
      document.head.appendChild(googleMapsScript);
      
      // Manejar errores de carga
      googleMapsScript.onerror = () => {
        setError("Error al cargar los mapas de Google");
      };
    };

    // Cargar el script
    loadGoogleMapsScript();
    
    // Limpiar
    return () => {
        window.initMap = () => {};
      };      
  }, []);

  // Suscribirse a las actualizaciones de ubicación del repartidor
  useEffect(() => {
    if (!pedidoId) return;
    
    const unsubscribe = suscribirseUbicacionPedido(pedidoId, (ubicacion) => {
      setUbicacionRepartidor(ubicacion);
      if (onUbicacionChanged) {
        onUbicacionChanged(ubicacion);
      }
    });
    
    return () => unsubscribe();
  }, [pedidoId, onUbicacionChanged]);

  // Geocodificar la dirección del cliente cuando está disponible
  useEffect(() => {
    const geocodificarDireccion = async () => {
      if (!direccionCliente || !mapsLoaded) return;
      
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: direccionCliente }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error("No se pudo geocodificar la dirección"));
            }
          });
        });
        
        const location = result[0].geometry.location;
        setUbicacionCliente({
          latitude: location.lat(),
          longitude: location.lng()
        });
      } catch (error) {
        console.error("Error al geocodificar:", error);
        setError("No se pudo encontrar la ubicación de entrega");
      }
    };
    
    geocodificarDireccion();
  }, [direccionCliente, mapsLoaded]);

  // Inicializar el mapa cuando la API está cargada
  useEffect(() => {
    if (!mapsLoaded) return;
    
    // Crear el mapa si no existe
    if (!mapRef.current) {
      // Usar una ubicación predeterminada (Santiago de Chile)
      const defaultCenter = { lat: -33.4489, lng: -70.6693 };
      
      // Crear el mapa
      const mapElement = document.getElementById('delivery-map');
      if (mapElement) {
        mapRef.current = new google.maps.Map(mapElement, {
          center: defaultCenter,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
      }
    }
  }, [mapsLoaded]);

  // Actualizar marcadores y ruta cuando cambian las ubicaciones
  useEffect(() => {
    if (!mapRef.current || !mapsLoaded) return;
    
    // Actualizar marcador del repartidor
    if (ubicacionRepartidor) {
      const repartidorLatLng = new google.maps.LatLng(
        ubicacionRepartidor.latitude,
        ubicacionRepartidor.longitude
      );
      
      // Crear o actualizar el marcador del repartidor
      if (!repartidorMarkerRef.current) {
        repartidorMarkerRef.current = new google.maps.Marker({
          position: repartidorLatLng,
          map: mapRef.current,
          icon: {
            url: '/icons/delivery-bike.svg',
            scaledSize: new google.maps.Size(40, 40)
          },
          title: "Repartidor"
        });
      } else {
        repartidorMarkerRef.current.setPosition(repartidorLatLng);
      }
      
      // Centrar el mapa en la ubicación del repartidor
      mapRef.current.panTo(repartidorLatLng);
    }
    
    // Actualizar marcador del cliente
    if (ubicacionCliente) {
      const clienteLatLng = new google.maps.LatLng(
        ubicacionCliente.latitude,
        ubicacionCliente.longitude
      );
      
      // Crear o actualizar el marcador del cliente
      if (!clienteMarkerRef.current) {
        clienteMarkerRef.current = new google.maps.Marker({
          position: clienteLatLng,
          map: mapRef.current,
          icon: {
            url: '/icons/home.svg',
            scaledSize: new google.maps.Size(40, 40)
          },
          title: "Dirección de entrega"
        });
      } else {
        clienteMarkerRef.current.setPosition(clienteLatLng);
      }
    }
    
    // Actualizar ruta si tenemos ambas ubicaciones
    if (ubicacionRepartidor && ubicacionCliente) {
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: new google.maps.LatLng(
            ubicacionRepartidor.latitude,
            ubicacionRepartidor.longitude
          ),
          destination: new google.maps.LatLng(
            ubicacionCliente.latitude,
            ubicacionCliente.longitude
          ),
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Eliminar la ruta anterior si existe
            if (routeRef.current) {
              routeRef.current.setMap(null);
            }
            
            // Crear la nueva ruta
            const path = result.routes[0].overview_path;
            routeRef.current = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: '#FF6B00',
              strokeOpacity: 0.8,
              strokeWeight: 5,
              map: mapRef.current
            });
            
            // Ajustar el zoom para mostrar toda la ruta
            const bounds = new google.maps.LatLngBounds();
            path.forEach((point) => {
              bounds.extend(point);
            });
            mapRef.current?.fitBounds(bounds);
            
            // Calcular distancia y tiempo estimado
            const distanciaKm = result.routes[0].legs[0].distance?.value ? 
              result.routes[0].legs[0].distance.value / 1000 : 
              calcularDistancia(ubicacionRepartidor, ubicacionCliente);
            
            setDistancia(parseFloat(distanciaKm.toFixed(2)));
            setTiempoEstimado(calcularTiempoEstimado(distanciaKm));
          } else {
            // Si no se puede calcular la ruta, usar línea recta
            const path = [
              new google.maps.LatLng(
                ubicacionRepartidor.latitude,
                ubicacionRepartidor.longitude
              ),
              new google.maps.LatLng(
                ubicacionCliente.latitude,
                ubicacionCliente.longitude
              )
            ];
            
            // Eliminar la ruta anterior si existe
            if (routeRef.current) {
              routeRef.current.setMap(null);
            }
            
            // Crear la nueva ruta
            routeRef.current = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: '#FF6B00',
              strokeOpacity: 0.8,
              strokeWeight: 5,
              map: mapRef.current
            });
            
            // Calcular distancia y tiempo estimado usando fórmula de Haversine
            const distanciaKm = calcularDistancia(ubicacionRepartidor, ubicacionCliente);
            setDistancia(parseFloat(distanciaKm.toFixed(2)));
            setTiempoEstimado(calcularTiempoEstimado(distanciaKm));
            
            // Ajustar el zoom para mostrar ambos puntos
            const bounds = new google.maps.LatLngBounds();
            path.forEach((point) => {
              bounds.extend(point);
            });
            mapRef.current?.fitBounds(bounds);
          }
        }
      );
    }
  }, [ubicacionRepartidor, ubicacionCliente, mapsLoaded]);

  // Si hay un error, mostrar mensaje
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error al cargar el mapa</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Si no se ha cargado la API, mostrar cargando
  if (!mapsLoaded) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center h-60">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Información del seguimiento */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Seguimiento en tiempo real</h3>
        
        <div className="mt-2 grid grid-cols-2 gap-4">
          {distancia !== null && (
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <p className="font-medium">{distancia} km</p>
            </div>
          )}
          
          {tiempoEstimado !== null && (
            <div>
              <p className="text-sm text-gray-500">Tiempo estimado</p>
              <p className="font-medium">{tiempoEstimado} min</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mapa */}
      <div 
        id="delivery-map" 
        className={`w-full ${mapExpanded ? 'h-96' : 'h-60'} transition-all duration-300`}
      ></div>
      
      {/* Controles del mapa */}
      <div className="p-4 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {ubicacionRepartidor ? 
            "Repartidor en movimiento" : 
            "Esperando ubicación del repartidor..."}
        </div>
        
        <Button
          onClick={() => setMapExpanded(!mapExpanded)}
          variant="ghost"
          size="sm"
        >
          {mapExpanded ? "Reducir mapa" : "Ampliar mapa"}
        </Button>
      </div>
    </div>
  );
};

export default DeliveryMap;
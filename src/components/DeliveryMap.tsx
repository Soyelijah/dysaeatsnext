"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import {
  suscribirseUbicacionPedido,
  calcularDistancia,
  calcularTiempoEstimado
} from "@/firebase/locationService";
import { Button } from "@/components/Button";

interface DeliveryMapProps {
  pedidoId: string;
  direccionCliente?: string;
  ubicacionInicial?: { latitude: number; longitude: number };
  onUbicacionChanged?: (coords: { latitude: number; longitude: number } | null) => void;
  height?: string;
  showControls?: boolean;
}

// Estilo del contenedor del mapa
const containerStyle = {
  width: "100%",
  height: "100%"
};

// Centro predeterminado del mapa: Santiago, Chile
const centerDefault = { lat: -33.4489, lng: -70.6693 };

// Componente de mapa para seguimiento de pedidos en tiempo real
export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  pedidoId,
  direccionCliente,
  ubicacionInicial,
  onUbicacionChanged,
  height = "60vh",
  showControls = true
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ubicacionRepartidor, setUbicacionRepartidor] = useState(ubicacionInicial || null);
  const [ubicacionCliente, setUbicacionCliente] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [tiempoEstimado, setTiempoEstimado] = useState<number | null>(null);
  const [tiempoLlegada, setTiempoLlegada] = useState<string | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "geometry"]
  });

  // Suscribirse a ubicación del repartidor en tiempo real
  useEffect(() => {
    if (!pedidoId) return;

    const unsubscribe = suscribirseUbicacionPedido(pedidoId, (ubicacion) => {
      if (ubicacion) {
        setUbicacionRepartidor(ubicacion);
        setLastUpdateTime(new Date());
        onUbicacionChanged?.(ubicacion);
      }
    });

    return () => unsubscribe();
  }, [pedidoId, onUbicacionChanged]);

  // Geocodificar dirección del cliente a coordenadas
  useEffect(() => {
    if (!direccionCliente || !isLoaded) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: direccionCliente }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const location = results[0].geometry.location;
        setUbicacionCliente({
          latitude: location.lat(),
          longitude: location.lng()
        });
      }
    });
  }, [direccionCliente, isLoaded]);

  // Calcular la ruta y mostrarla en el mapa
  useEffect(() => {
    if (ubicacionRepartidor && ubicacionCliente && isLoaded) {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: ubicacionRepartidor.latitude, lng: ubicacionRepartidor.longitude },
          destination: { lat: ubicacionCliente.latitude, lng: ubicacionCliente.longitude },
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);

            const leg = result.routes[0].legs[0];
            const distanciaKm = leg.distance?.value ? leg.distance.value / 1000 : 0;
            const tiempoMin = leg.duration?.value ? Math.ceil(leg.duration.value / 60) : 0;

            setDistancia(parseFloat(distanciaKm.toFixed(2)));
            setTiempoEstimado(tiempoMin);

            const llegada = new Date(Date.now() + tiempoMin * 60000);
            setTiempoLlegada(llegada.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }
      );
    }
  }, [ubicacionRepartidor, ubicacionCliente, isLoaded]);

  if (loadError) {
    return (
      <div className="bg-red-50 p-4 text-red-800 border border-red-300 rounded-md">
        Error al cargar Google Maps. Verifica tu conexión o API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
        <span className="ml-2 text-gray-700">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Panel de información del seguimiento */}
      {showControls && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Seguimiento en tiempo real</h3>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <p className="font-medium">{distancia ?? "—"} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo estimado</p>
              <p className="font-medium">{tiempoEstimado ?? "—"} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hora llegada</p>
              <p className="font-medium">{tiempoLlegada ?? "—"}</p>
            </div>
          </div>
          {lastUpdateTime && (
            <p className="text-xs text-gray-500 mt-2">
              Última actualización: {lastUpdateTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Mapa de Google */}
      <div style={{ height: mapExpanded ? "80vh" : height }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={ubicacionRepartidor ? { lat: ubicacionRepartidor.latitude, lng: ubicacionRepartidor.longitude } : centerDefault}
          zoom={15}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {ubicacionRepartidor && (
            <Marker
              position={{ lat: ubicacionRepartidor.latitude, lng: ubicacionRepartidor.longitude }}
              icon="/icons/delivery-bike.svg"
              title="Repartidor"
            />
          )}
          {ubicacionCliente && (
            <Marker
              position={{ lat: ubicacionCliente.latitude, lng: ubicacionCliente.longitude }}
              icon="/icons/home.svg"
              title="Cliente"
            />
          )}
          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
        </GoogleMap>
      </div>

      {/* Controles del mapa */}
      {showControls && (
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {ubicacionRepartidor ? (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                Repartidor en movimiento
              </span>
            ) : (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Esperando ubicación del repartidor...
              </span>
            )}
          </div>
          <Button onClick={() => setMapExpanded(!mapExpanded)} variant="ghost" size="sm">
            {mapExpanded ? "Reducir mapa" : "Ampliar mapa"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;

// Indica que este componente es del lado del cliente.
"use client";

// Importación de hooks y utilidades necesarias.
import { useState } from "react"; // Manejo de estado.
import { formatearRUT } from "@/utils/rut"; // Función para formatear el RUT.

// Define las propiedades del componente RutInput.
export interface RutInputProps {
  value?: string; // Valor inicial opcional del RUT.
  onChange: (rut: string) => void; // Función para manejar cambios en el RUT.
}

// Componente principal RutInput.
export default function RutInput({ value = "", onChange }: RutInputProps) {
  // Estado para almacenar el RUT ingresado.
  const [rut, setRut] = useState(value); // Inicializa el estado con el valor inicial.

  // Maneja el cambio en el input del RUT.
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value; // Obtiene el valor ingresado.
    const rutFormateado = formatearRUT(input); // Formatea el RUT ingresado.
    setRut(rutFormateado); // Actualiza el estado con el RUT formateado.
    onChange(rutFormateado); // Llama a la función onChange con el RUT formateado.
  };

  // Renderiza el campo de entrada del RUT.
  return (
    <input
      type="text" // Define el tipo de input como texto.
      value={rut} // Asigna el valor actual del RUT.
      onChange={handleInput} // Maneja cambios en el input.
      placeholder="Ej: 25484075-0" // Placeholder para guiar al usuario.
      className="border p-2 rounded w-full" // Estilos del input.
    />
  );
}

// Función para formatear un RUT chileno
// Esta función toma un RUT como entrada, elimina caracteres no válidos y lo formatea con un guion.
export const formatearRUT = (rut: string): string => {
  // Eliminar caracteres no numéricos ni 'k' o 'K'
  // Se asegura de que solo queden números y el dígito verificador válido.
  const cleanRut = rut.replace(/[^0-9kK]/g, ""); 
  
  // Verificar si el RUT tiene menos de 2 caracteres
  // Si es menor a 2, se devuelve sin cambios ya que no es un RUT válido.
  if (cleanRut.length < 2) return cleanRut; 
  
  // Separar el cuerpo del RUT (sin el dígito verificador)
  // Extrae todos los caracteres excepto el último, que corresponde al dígito verificador.
  const cuerpo = cleanRut.slice(0, -1); 
  
  // Extraer el dígito verificador del RUT
  // Obtiene el último carácter como dígito verificador.
  const dv = cleanRut.slice(-1); 
  
  // Retornar el RUT formateado con un guion entre el cuerpo y el dígito verificador
  // Formatea el RUT como "cuerpo-dv".
  return `${cuerpo}-${dv}`; 
};

// src/utils/errorHandler.js

export const getErrorMessage = (error) => {
  // Si no hay respuesta del servidor (red caída)
  if (!error.response) {
    return "Error de conexión. Intente más tarde.";
  }

  const data = error.response.data;

  // Si el backend devuelve un mensaje simple 'detail' (común en DRF)
  if (data.detail) {
    return data.detail;
  }

  // Si devuelve un objeto de errores por campo (ej: registro)
  // Intentamos extraer el primer mensaje del primer campo que falle
  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0]; // Ej: 'password'
    const firstError = data[firstKey];     // Ej: ['La contraseña es muy corta']
    
    if (Array.isArray(firstError)) {
      // Formato: "Password: La contraseña es muy corta"
      // Capitalizamos la primera letra del campo para que se vea mejor
      const fieldName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
      return `${fieldName}: ${firstError[0]}`;
    }
    
    // Si es un string directo
    if (typeof firstError === 'string') {
        return firstError;
    }
  }

  return "Ocurrió un error inesperado.";
};
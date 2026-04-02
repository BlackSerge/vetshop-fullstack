
export const getErrorMessage = (error) => {
 
  if (!error.response) {
    return "Error de conexión. Intente más tarde.";
  }

  const data = error.response.data;

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0]; 
    const firstError = data[firstKey];    
    
    if (Array.isArray(firstError)) {
      const fieldName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
      return `${fieldName}: ${firstError[0]}`;
    }
    
    if (typeof firstError === 'string') {
        return firstError;
    }
  }

  return "Ocurrió un error inesperado.";
};
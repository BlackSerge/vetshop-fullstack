// src/components/admin/ImageUploader.jsx
import { useState, useRef  } from 'react';
import { UploadCloud, X, Image } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export default function ImageUploader({
  onImageSelect, // (file) => void
  onImageRemove, // () => void
  currentImageUrl, // URL de la imagen actual (si es edición)
  label = "Subir Imagen",
  error,
}) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [preview, setPreview] = useState(currentImageUrl || null);
  const fileInputRef = useRef(null);

  // <--- DEFINIR VARIABLES DE ESTILO DINÁMICAS ---
  const containerBaseClasses = `relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-300`;
  const containerThemeClasses = isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-600';
  const containerErrorClasses = error ? 'border-red-500' : 'hover:border-purple-500 hover:text-purple-500';
  const removeBtnClasses = isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const labelColor = isDark ? 'text-gray-200' : 'text-gray-700';
  const mutedTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const errorColor = 'text-red-500';
  // ---------------------------------------------

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onImageSelect(file);
    } else {
      setPreview(currentImageUrl || null);
      onImageSelect(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Limpiar el input de archivo
    }
    onImageRemove();
  };

  return (
    <div className="mb-4">
      {label && (
        <p className={`block text-sm font-medium mb-2 ${labelColor}`}>
          {label}
        </p>
      )}
      <div 
        className={`${containerBaseClasses} ${containerThemeClasses} ${containerErrorClasses} cursor-pointer`} 
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {preview ? (
          <>
            <img src={preview} alt="Vista previa" className="max-h-40 object-contain mb-2 rounded-md" />
            <p className="text-sm">Haga clic para cambiar</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className={`absolute top-2 right-2 p-1 rounded-full text-white ${removeBtnClasses}`}
              aria-label="Eliminar imagen"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud size={36} className="mb-2" />
            <p className="text-sm">Arrastre y suelte una imagen aquí, o haga clic para seleccionar</p>
            <p className={`text-xs ${mutedTextColor}`}>JPG, PNG, GIF</p>
          </div>
        )}
      </div>
      {error && <p className={`mt-1 text-sm ${errorColor}`}>{error}</p>}
    </div>
  );
}
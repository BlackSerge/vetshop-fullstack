import React, { useState, useRef, useEffect  } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useThemeStore } from '@/shared';

export default function ImageUploader({
  onImageSelect,
  onImageRemove, 
  currentImageUrl, 
  label = "Subir Imagen",
  error,
}) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [preview, setPreview] = useState(currentImageUrl || null);
  
  const fileInputRef = useRef(null);
  useEffect(() => {
      setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const containerBaseClasses = `relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300`;
  const containerThemeClasses = isDark 
    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-750 hover:border-gray-500' 
    : 'bg-white border-gray-300 text-gray-600 hover:bg-purple-50/30 hover:border-purple-300';
  const containerErrorClasses = error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : '';
  const removeBtnClasses = isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const mutedTextColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const errorColor = 'text-red-500';
  
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
      fileInputRef.current.value = ''; 
    }
    onImageRemove();
  };

  return (
    <div className="mb-6 w-full">
      {label && (
        <p className={`block text-sm font-bold mb-2 ml-1 ${labelColor}`}>
          {label}
        </p>
      )}
      <div 
        className={`${containerBaseClasses} ${containerThemeClasses} ${containerErrorClasses} cursor-pointer group`} 
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
          <div className="relative w-full flex flex-col items-center">
            <div className={`relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-2 ${isDark ? 'border-gray-700' : 'border-white'}`}>
                <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className={`absolute top-2 right-2 p-1.5 rounded-full text-white shadow-md transition-transform hover:scale-110 ${removeBtnClasses}`}
                aria-label="Eliminar imagen"
                >
                <X size={16} />
                </button>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider opacity-60">Clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className={`p-5 rounded-full mb-4 transition-colors ${isDark ? 'bg-gray-700 text-purple-400 group-hover:bg-gray-600 group-hover:text-purple-300' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700'}`}>
                <UploadCloud size={40} className={error ? 'text-red-500' : ''} />
            </div>
            <p className="text-base font-bold text-center">
                Clic para subir imagen
            </p>
            <p className={`text-xs mt-1 ${mutedTextColor}`}>PNG, JPG, WEBP (Max 5MB)</p>
          </div>
        )}
      </div>
      {error && <p className={`mt-2 text-xs font-bold flex items-center gap-1 ${errorColor}`}><X size={12}/> {error}</p>}
    </div>
  );
}



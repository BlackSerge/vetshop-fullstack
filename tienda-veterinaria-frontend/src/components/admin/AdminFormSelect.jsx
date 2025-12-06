// src/components/admin/AdminFormSelect.jsx
import { useThemeStore } from '../../store/useThemeStore';


export default function AdminFormSelect({
  label,
  name,
  options, // Array de { value: 'valor', label: 'Etiqueta Visible' }
  value,
  onChange,
  error,
  disabled = false,
  ...props
}) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // <--- DEFINIR VARIABLES DE ESTILO DINÁMICAS ---
  const selectBaseClasses = `mt-1 block w-full rounded-md shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500`;
  const selectThemeClasses = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const disabledClasses = disabled ? 'opacity-75 cursor-not-allowed' : '';
  const labelColor = isDark ? 'text-gray-200' : 'text-gray-700';
  const errorColor = 'text-red-500';
  // ---------------------------------------------

  return (
    <div>
      {label && (
        <label htmlFor={name} className={`block text-sm font-medium ${labelColor}`}>
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${selectBaseClasses} ${selectThemeClasses} ${disabledClasses}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={`mt-1 text-sm ${errorColor}`}>{error}</p>}
    </div>
  );
}
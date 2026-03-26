import React from 'react';
import { useThemeStore } from '@/shared';

interface SelectOption {
  value: string;
  label: string;
}

interface AdminFormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  className?: string;
}

const AdminFormSelect = ({ 
  label, 
  options, 
  error, 
  className = "", 
  disabled,
  ...props 
}: AdminFormSelectProps) => {
  const { theme } = useThemeStore() as any;
  const isDark = theme === 'dark';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id || props.name} className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <select 
          disabled={disabled}
          className={`
            w-full pl-4 pr-10 py-3 rounded-xl border outline-none transition-all appearance-none
            ${isDark 
              ? 'bg-gray-800 border-gray-600 text-white focus:ring-purple-500 placeholder-gray-500' 
              : 'bg-white border-gray-200 text-gray-900 focus:ring-purple-500 placeholder-gray-400'
            }
            focus:ring-2 focus:border-transparent
            disabled:opacity-60 disabled:cursor-not-allowed
            shadow-sm
            ${className}
          `} 
          {...props}
        >
          {options.map((opt) => (
            <option 
                key={opt.value} 
                value={opt.value}
                className={isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
            >
              {opt.label}
            </option>
          ))}
        </select>
        
      
        <div className={`absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">
            {error}
        </p>
      )}
    </div>
  );
};

export default AdminFormSelect;



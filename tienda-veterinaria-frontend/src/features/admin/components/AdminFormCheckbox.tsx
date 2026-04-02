import { ChangeEvent, InputHTMLAttributes } from 'react';
import { useThemeStore } from '@/shared'; 

interface AdminFormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export default function AdminFormCheckbox({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  ...props
}: AdminFormCheckboxProps): JSX.Element {
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === 'dark';

  const checkboxBaseClasses = `h-4 w-4 rounded focus:ring-purple-500`;
  const checkboxThemeClasses = isDark ? 'border-gray-600 bg-gray-700 text-purple-400' : 'border-gray-300 bg-white text-purple-600';
  const disabledClasses = disabled ? 'opacity-75 cursor-not-allowed' : '';
  const labelColor = isDark ? 'text-gray-200' : 'text-gray-700';

  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`${checkboxBaseClasses} ${checkboxThemeClasses} ${disabledClasses}`}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={name} className={`font-medium ${labelColor}`}>
          {label}
        </label>
      </div>
    </div>
  );
}



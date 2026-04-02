import { ChangeEvent, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useThemeStore } from '@/shared';

type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time';

interface AdminFormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  name: string;
  type?: InputType;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  textarea?: boolean;
  step?: string;
}

export default function AdminFormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  readOnly = false,
  textarea = false,
  ...props
}: AdminFormInputProps): JSX.Element {
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === 'dark';

  const inputBaseClasses = `mt-1 block w-full rounded-md shadow-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500`;
  const inputThemeClasses = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const disabledClasses = disabled ? 'opacity-75 cursor-not-allowed' : '';
  const readOnlyClasses = readOnly ? 'bg-gray-100 dark:bg-gray-600' : '';
  const labelColor = isDark ? 'text-gray-200' : 'text-gray-700';
  const errorColor = 'text-red-500';

  return (
    <div>
      {label && (
        <label htmlFor={name} className={`block text-sm font-medium ${labelColor}`}>
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${inputBaseClasses} ${inputThemeClasses} ${disabledClasses} ${readOnlyClasses} h-24`}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${inputBaseClasses} ${inputThemeClasses} ${disabledClasses} ${readOnlyClasses}`}
          {...props}
        />
      )}
      {error && <p className={`mt-1 text-sm ${errorColor}`}>{error}</p>}
    </div>
  );
}



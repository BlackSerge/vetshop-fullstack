// src/components/admin/AdminTable.jsx
import { useThemeStore } from '../../store/useThemeStore';
import LoadingSpinner from '../LoadingSpinner'; 

export default function AdminTable({ headers, data, renderRowActions, isLoading }) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const tableBgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const tableTextColor = isDark ? 'text-gray-200' : 'text-gray-800';
  const headerBgClass = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const headerTextColor = isDark ? 'text-gray-300' : 'text-gray-500'; 
  const rowHoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const dividerColor = isDark ? 'divide-gray-700' : 'divide-gray-200'; 
  
  if (isLoading) {
    return (
      <div className={`rounded-lg shadow overflow-hidden ${tableBgClass} ${tableTextColor}`}>
        <div className="p-4 flex justify-center items-center h-48">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`p-6 text-center rounded-lg shadow ${tableBgClass} ${tableTextColor}`}>
        <p>No hay datos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow overflow-hidden ${tableBgClass} ${tableTextColor}`}>
      
      {/* --- CAMBIO AQUÍ: Wrapper para scroll horizontal --- */}
      <div className="overflow-x-auto w-full">
      
          <table className={`min-w-full divide-y ${dividerColor}`}>
            <thead className={headerBgClass}>
              <tr>
                {headers.map((headerConfig, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${headerTextColor}`}
                  >
                    {headerConfig.label || headerConfig.field}
                  </th>
                ))}
                {renderRowActions && (
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${headerTextColor}`}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor}`}>
              {data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className={rowHoverClass}>
                  {headers.map((headerConfig, colIndex) => {
                    const fieldName = headerConfig.field;
                    let displayValue = row[fieldName];

                    if (typeof displayValue === 'boolean') {
                      displayValue = displayValue ? 'Sí' : 'No';
                    }
                    else if (typeof displayValue === 'object' && displayValue !== null && 'nombre' in displayValue) {
                        displayValue = displayValue.nombre;
                    }
                    else if (displayValue === null || displayValue === undefined || displayValue === '') {
                        displayValue = '—';
                    }

                    return (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                        {displayValue}
                      </td>
                    );
                  })}
                  {renderRowActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
      
      </div>
      {/* --- FIN CAMBIO --- */}

    </div>
  );
}
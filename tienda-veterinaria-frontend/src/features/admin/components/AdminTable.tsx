import React, { ReactNode } from 'react';
import { useThemeStore } from '@/shared';
import SkeletonLoader from '@/features/products/components/ProductCardSkeleton';

interface TableHeader {
  field: string;
  label: string;
}

interface AdminTableProps {
  headers: TableHeader[];
  data: Record<string, any>[];
  renderRowActions?: (row: Record<string, any>) => ReactNode;
  isLoading?: boolean;
}

export default function AdminTable({ 
  headers, 
  data, 
  renderRowActions, 
  isLoading = false 
}: AdminTableProps): JSX.Element {
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === 'dark';
  const tableContainerClass = isDark 
    ? 'bg-gray-900 border-gray-700 shadow-xl shadow-black/20' 
    : 'bg-white border-gray-100 shadow-xl shadow-purple-100/30';
  const headerBgClass = isDark 
    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300' 
    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600';
  const rowHoverClass = isDark 
    ? 'hover:bg-gray-800/80' 
    : 'hover:bg-purple-50/50';
  const dividerColor = isDark ? 'divide-gray-800' : 'divide-gray-100';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-800';

  if (isLoading) {
    return (
      <div className={`rounded-3xl overflow-hidden border ${tableContainerClass}`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
             <div className="h-6 w-1/3 bg-gray-400/20 rounded animate-pulse"></div>
        </div>
        <div className="p-4">
            <SkeletonLoader type="table" count={5} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`p-16 text-center rounded-3xl border flex flex-col items-center justify-center ${tableContainerClass}`}>
        <div className="text-4xl mb-4 opacity-50">📂</div>
        <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No hay datos disponibles.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl overflow-hidden border transition-all duration-300 ${tableContainerClass}`}>

      <div className="overflow-x-auto w-full scrollbar-thin">
      
          <table className={`min-w-full divide-y ${dividerColor}`}>
            <thead>
              <tr className={headerBgClass}>
                {headers.map((headerConfig, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-5 text-left text-xs font-black uppercase tracking-wider whitespace-nowrap first:pl-8 last:pr-8"
                  >
                    {headerConfig.label || headerConfig.field}
                  </th>
                ))}
                {renderRowActions ? (
                  <th scope="col" className="px-6 py-5 text-right text-xs font-black uppercase tracking-wider whitespace-nowrap last:pr-8">
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor} ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              {data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className={`transition-colors duration-150 ${rowHoverClass}`}>
                  {headers.map((headerConfig, colIndex) => {
                    const fieldName = headerConfig.field;
                    let displayValue = row[fieldName];

                    if (typeof displayValue === 'boolean') {
                      displayValue = displayValue ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                           Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                           No
                        </span>
                      );
                    }
                    else if (typeof displayValue === 'object' && displayValue !== null && !React.isValidElement(displayValue) && 'nombre' in displayValue) {
                        displayValue = displayValue.nombre;
                    }
                    else if (displayValue === null || displayValue === undefined || displayValue === '') {
                        displayValue = <span className="opacity-30">—</span>;
                    }

                    return (
                      <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm font-medium first:pl-8 ${textPrimary}`}>
                        {displayValue}
                      </td>
                    );
                  })}
                  {renderRowActions ? (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 last:pr-8">
                      {renderRowActions(row)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
      
      </div>
    </div>
  );
}



import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/shared/store/useThemeStore';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  title?: string;
}

export default function ConfirmModal({  isOpen, onClose, onConfirm, message, title = "Confirmar Acción" }: ConfirmModalProps) {
  const theme = useThemeStore((state: any) => state.theme);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl border ${
            isDark 
            ? 'bg-gray-900 border-gray-800 text-white shadow-black/50' 
            : 'bg-white border-gray-100 text-gray-900 shadow-purple-500/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
  
          <div className="h-2 bg-gradient-to-r from-red-500 via-purple-500 to-red-500 animate-gradient-x" />
          
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                    <AlertCircle size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight">{title}</h3>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acción requerida</p>
                </div>
                <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                    <X size={20} />
                </button>
            </div>

            <p className={`text-base font-medium leading-relaxed mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onClose} 
                className={`flex-1 py-3 px-6 rounded-2xl font-bold transition-all active:scale-95 ${
                    isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={onConfirm} 
                className="flex-1 py-3 px-6 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all text-center"
              >
                Confirmar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

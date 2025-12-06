import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const modalBgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const btnDangerClass = isDark ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-500 hover:bg-red-600 text-white';
  const btnCancelClass = isDark ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`relative p-8 rounded-lg shadow-xl max-w-sm w-full ${modalBgClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold mb-4">Confirmar Acción</h3>
          <p className="mb-6">{message}</p>
          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className={`py-2 px-4 rounded-md font-semibold ${btnCancelClass}`}>
              Cancelar
            </button>
            <button onClick={onConfirm} className={`py-2 px-4 rounded-md font-semibold ${btnDangerClass}`}>
              Confirmar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
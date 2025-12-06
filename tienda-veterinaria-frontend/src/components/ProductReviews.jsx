// src/components/ProductReviews.jsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import LoadingSpinner from './LoadingSpinner';
import { Link } from 'react-router-dom';

export default function ProductReviews({ productId, reviews = [], onReviewAdded }) {
  const { isAuthenticated } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estilos
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textTitle = isDark ? "text-white" : "text-gray-900";
  const inputBg = isDark ? "bg-gray-900 border-gray-600 text-white focus:border-purple-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500";
  const btnPrimary = "bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md transition-all active:scale-95";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Escribe un comentario.");
    
    setSubmitting(true);
    try {
      await api.post(`/productos/items/${productId}/reviews/`, { rating, comment });
      toast.success("¡Reseña publicada!");
      setComment('');
      setRating(5);
      if (onReviewAdded) onReviewAdded(); // Recargar producto padre
    } catch (err) {
      const msg = err.response?.data?.[0] || "Error al publicar reseña.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mt-12 p-6 md:p-8 rounded-2xl border shadow-sm ${cardBg}`}>
      <div className="flex items-center justify-between mb-8">
        <h3 className={`text-2xl font-bold ${textTitle}`}>Opiniones ({reviews.length})</h3>
        {/* Promedio visual rápido */}
        {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-full">
                <Star size={16} fill="currentColor" />
                <span>
                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
            </div>
        )}
      </div>

      {/* LISTA DE RESEÑAS */}
      <div className="space-y-6 mb-10 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {reviews.length === 0 ? (
            <div className="text-center py-8 opacity-60">
                <p>Aún no hay opiniones.</p>
                <p className="text-sm">¡Sé el primero en comentar!</p>
            </div>
        ) : (
            reviews.map((rev) => (
                <div key={rev.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                                {rev.user_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${textTitle}`}>{rev.user_name}</p>
                                <div className="flex text-yellow-400 text-xs">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-sm leading-relaxed pl-11 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{rev.comment}</p>
                </div>
            ))
        )}
      </div>

      {/* FORMULARIO */}
      {isAuthenticated ? (
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
              <h4 className={`text-lg font-bold mb-4 ${textTitle}`}>Escribir una reseña</h4>
              <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-3 mb-4">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Calificación:</span>
                      <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className={`transition-transform hover:scale-125 p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                  <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="¿Qué te pareció el producto?"
                      rows="3"
                      className={`w-full p-3 rounded-lg border outline-none transition-all mb-4 text-sm ${inputBg}`}
                      required
                  />
                  
                  <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className={`px-6 py-2 rounded-lg text-sm ${btnPrimary} disabled:opacity-50`}
                      >
                          {submitting ? <LoadingSpinner /> : "Publicar Opinión"}
                      </button>
                  </div>
              </form>
          </div>
      ) : (
           <div className="text-center p-8 rounded-xl border-2 border-purple-500/30 dark:border-purple-500/50 bg-purple-50/50 dark:bg-purple-900/10">
              <p className="text-black dark:text-white text-base font-bold mb-2">
                  ¿Compraste este producto?
              </p>
              <p className="text-sm text-black dark:text-gray-300 font-medium">
                  <Link to="/login" className="text-purple-700 dark:text-purple-400 font-bold hover:underline">Inicia sesión</Link> para compartir tu experiencia con otros usuarios.
              </p>
          </div>
      )}
    </div>
  );
}
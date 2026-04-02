import { useState } from 'react';
import { toast } from 'react-toastify';
import { productService } from '../services/productService';

export const useProductReview = (productId: string | number, onReviewAdded?: () => void) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!comment.trim()) {
        toast.error("Escribe un comentario.");
        return;
    }
    
    setSubmitting(true);
    try {
      await productService.createProductReview(productId, { rating, comment });
      toast.success("¡Reseña publicada!");
      setComment('');
      setRating(5);
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      const msg = err.response?.data?.[0] || "Error al publicar reseña.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return { rating, setRating, comment, setComment, submitting, submitReview };
};


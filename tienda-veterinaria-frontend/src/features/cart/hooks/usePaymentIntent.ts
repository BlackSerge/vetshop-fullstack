// src/hooks/usePaymentIntent.ts
import { useState, useEffect, useCallback } from "react";
import { orderService } from "../services/orderService";

export const usePaymentIntent = (cartId: number | null, cartItemsLength: number) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPaymentIntent = useCallback(async () => {
      if (!cartId) return;
      setLoading(true);
      setError(null);
      try {
          const data = await orderService.createPaymentIntent(cartId);
          if (data.clientSecret) {
              setClientSecret(data.clientSecret);
          } else {
              setError("El servidor no devolvió una clave de pago válida.");
          }
      } catch (err) {
          console.error("Error creating payment intent:", err);
          setError("No se pudo conectar con el servidor de pagos. Verifica que el Backend esté corriendo.");
      } finally {
          setLoading(false);
      }
  }, [cartId]);

  useEffect(() => {
    if (cartItemsLength > 0 && !clientSecret && cartId) {
        fetchPaymentIntent();
    }
  }, [cartItemsLength, clientSecret, cartId, fetchPaymentIntent]);

  return { clientSecret, loading, error, fetchPaymentIntent };
};


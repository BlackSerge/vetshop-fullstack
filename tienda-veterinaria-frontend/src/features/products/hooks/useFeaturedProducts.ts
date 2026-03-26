// src/hooks/useFeaturedProducts.ts
import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { Product } from "../types";

export const useFeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (err) {
      console.error("Error cargando destacados:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  return { featuredProducts, loading, error, fetchFeatured };
};


import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Search, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowRightFromLine } from "lucide-react";
import { Helmet } from 'react-helmet-async';

// --- STORES ---
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";

// --- API & HOOKS ---
import api from "../api/axios";
import { useProducts, useCategories, useBrands } from "../hooks/useProductQueries";

// --- COMPONENTS ---
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import AdminFormSelect from "../components/admin/AdminFormSelect";

export default function ProductsPage() {
  const navigate = useNavigate();
  
  // --- ZUSTAND ---
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.count);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // --- STATES DE UI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [animateCart, setAnimateCart] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // --- FILTROS ACTIVOS (React Query) ---
  const [activeFilters, setActiveFilters] = useState({
    categorySlug: "todos",
    search: "",
    priceMin: "",
    priceMax: "",
    brand: "Todas",
    petType: "todos",
    sort: "",
  });

  // --- FILTROS SIDEBAR (Estado local) ---
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [selectedBrandInput, setSelectedBrandInput] = useState("Todas");
  const [selectedCategorySlugSidebar, setSelectedCategorySlugSidebar] = useState("todos");
  const [selectedPetTypeInput, setSelectedPetTypeInput] = useState("todos");
  const [sortOptionInput, setSortOptionInput] = useState("");

  const searchContainerRef = useRef(null);
  const searchQueryTimeout = useRef(null);

  // --- REACT QUERY DATA FETCHING ---
  // 1. Categorías
  const { data: categoriesData } = useCategories();
  const categories = [{ id: "all", nombre: "Todos", slug: "todos" }, ...(categoriesData || [])];

  // 2. Marcas
  const { data: brandsData } = useBrands();
  const availableBrands = ["Todas", ...(brandsData || []).filter(brand => brand && brand.trim() !== "")];

  // 3. Productos
  const { 
    data: productsData, 
    isLoading: loading, 
    isPlaceholderData 
  } = useProducts(activeFilters, currentPage, PAGE_SIZE);

  const productos = productsData?.results || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / PAGE_SIZE);

  // --- STYLE HELPERS ---
  const colors = {
    bg: isDark ? "bg-gray-900" : "bg-gray-50",
    cardBg: isDark ? "bg-gray-800" : "bg-white",
    text: isDark ? "text-gray-100" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-600",
    border: isDark ? "border-gray-700" : "border-gray-200",
    primary: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30",
    pill: isDark 
        ? "bg-purple-900/40 text-purple-200 border-purple-700" 
        : "bg-purple-200 text-purple-900 border-purple-300 font-semibold", 
  };
  
  const textTitle = isDark ? "text-white" : "text-gray-900"; 

  const petTypesOptions = [
    { value: "todos", label: "Todos" },
    { value: "perro", label: "Perro" },
    { value: "gato", label: "Gato" },
    { value: "ave", label: "Ave" },
    { value: "roedor", label: "Roedor" },
    { value: "reptil", label: "Reptil" },
    { value: "otros", label: "Otros" },
  ];

  // --- HANDLERS ---
  
  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) setPriceMinInput(value);
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) setPriceMaxInput(value);
  };

  const handleAddToCart = (product) => {
    addItem(product);
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 1200);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchQueryTimeout.current) clearTimeout(searchQueryTimeout.current);

    searchQueryTimeout.current = setTimeout(async () => {
      if (query.length >= 2) {
        setActiveFilters(prev => ({ ...prev, search: query }));
        setCurrentPage(1);
      } else if (activeFilters.search !== "") {
        setActiveFilters(prev => ({ ...prev, search: "" }));
        setCurrentPage(1);
      }

      if (query.length >= 1) {
        try {
            const response = await api.get(`/productos/items/?search=${query}&page_size=5`);
            const matches = response.data.results.map((p) => p.nombre);
            setSuggestions([...new Set(matches)]);
        } catch { setSuggestions([]); }
      } else {
          setSuggestions([]);
      }
    }, 300);
  };

  const handleSuggestionClick = (name) => {
    setSearchQuery(name);
    setSuggestions([]);
    setActiveFilters(prev => ({ ...prev, search: name }));
    setCurrentPage(1);
  };

  const applySidebarFilters = () => {
    setActiveFilters(prev => ({
      ...prev,
      categorySlug: selectedCategorySlugSidebar,
      priceMin: priceMinInput,
      priceMax: priceMaxInput,
      brand: selectedBrandInput,
      petType: selectedPetTypeInput,
      sort: sortOptionInput,
    }));
    setCurrentPage(1);
    if(window.innerWidth < 1024) setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    const defaultFilters = {
        categorySlug: "todos",
        search: "",
        priceMin: "",
        priceMax: "",
        brand: "Todas",
        petType: "todos",
        sort: "",
    };
    setSearchQuery("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setSelectedBrandInput("Todas");
    setSelectedCategorySlugSidebar("todos");
    setSelectedPetTypeInput("todos");
    setSortOptionInput("");
    setSuggestions([]);
    
    setActiveFilters(defaultFilters);
    setCurrentPage(1);
    if(window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleCategoryButtonClick = (categorySlug) => {
    setSelectedCategorySlugSidebar(categorySlug);
    setActiveFilters(prev => ({ ...prev, categorySlug: categorySlug }));
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages !== 1) range.push(totalPages);

    return range.map((x, i) => (
      <button
        key={i}
        onClick={() => typeof x === "number" && setCurrentPage(x)}
        disabled={x === "..."}
        className={`w-10 h-10 rounded-full font-medium transition-all ${
          x === currentPage
            ? colors.primary
            : x === "..."
            ? "cursor-default opacity-50"
            : `${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"} ${colors.text}`
        }`}
      >
        {x}
      </button>
    ));
  };

  const hasActiveFilters = Object.entries(activeFilters).some(
    ([key, value]) => {
        if (key === 'sort') return false;
        return (value !== "" && value !== "Todas" && value !== "todos");
    }
  );

  return (
    <section className={`min-h-screen py-6 md:py-8 w-full ${colors.bg} transition-colors duration-300 pb-20 lg:pb-8`}>
      <Helmet>
        <title>Catálogo de Productos | VetShop</title>
      </Helmet>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6 relative">
        
        {/* --- MOBILE TOGGLE BAR --- */}
        <div className="lg:hidden flex items-center justify-between mb-4">
             <div className="flex-1">
                 <h1 className={`text-2xl font-bold ${colors.text}`}>Tienda</h1>
             </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-sm transition-all active:scale-95 ${colors.cardBg} ${colors.text} border ${colors.border}`}
            >
              <SlidersHorizontal size={22} className="text-purple-600" />
              <span className="text-base">Filtros</span>
            </button>
        </div>

        {/* --- SIDEBAR --- */}
        <AnimatePresence>
            {sidebarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </AnimatePresence>

        <motion.aside
            className={`
                fixed lg:sticky top-0 lg:top-24 left-0 h-full lg:h-[calc(100vh-8rem)]
                z-50 lg:z-30 overflow-hidden flex-shrink-0
                ${colors.cardBg} ${colors.text} lg:border ${colors.border} lg:rounded-xl
                shadow-2xl lg:shadow-none
            `}
            initial={false}
            animate={{ 
                width: sidebarOpen ? (window.innerWidth >= 1024 ? "18rem" : "85%") : "0rem",
                x: (window.innerWidth < 1024 && !sidebarOpen) ? "-100%" : "0%"
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
            <div className="w-full h-full overflow-y-auto p-5 sm:p-6 scrollbar-thin">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={22} className="text-purple-600"/> Filtros</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={26} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Categories */}
                    <div>
                        <label className="block text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">Categoría</label>
                        <AdminFormSelect
                            name="category"
                            options={categories.map(c => ({ value: c.slug, label: c.nombre }))}
                            value={selectedCategorySlugSidebar}
                            onChange={(e) => setSelectedCategorySlugSidebar(e.target.value)}
                            className="focus:ring-purple-600 w-full text-base py-3"
                        />
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <p className={`font-semibold text-xs uppercase tracking-wide mb-1 ${textTitle}`}>Precio</p>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={priceMinInput}
                                    onChange={handleMinPriceChange}
                                    className={`w-full pl-8 pr-3 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors 
                                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                            <span className="text-gray-400 font-bold">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={priceMaxInput}
                                    onChange={handleMaxPriceChange}
                                    className={`w-full pl-8 pr-3 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors
                                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">Marca</label>
                        <AdminFormSelect
                            name="brand"
                            options={availableBrands.map(b => ({ value: b, label: b }))}
                            value={selectedBrandInput}
                            onChange={(e) => setSelectedBrandInput(e.target.value)}
                            className="focus:ring-purple-600 w-full text-base py-3"
                        />
                    </div>

                    {/* Pet Type */}
                    <div>
                        <label className="block text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">Tipo de Mascota</label>
                        <AdminFormSelect
                            name="petTypeFull"
                            options={petTypesOptions}
                            value={selectedPetTypeInput}
                            onChange={(e) => setSelectedPetTypeInput(e.target.value)}
                            className="focus:ring-purple-600 w-full text-base py-3"
                        />
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">Ordenar por</label>
                        <AdminFormSelect
                            options={[
                                { value: "", label: "Relevancia" },
                                { value: "price-asc", label: "Precio: Bajo a Alto" },
                                { value: "price-desc", label: "Precio: Alto a Bajo" },
                                { value: "name-asc", label: "Nombre (A-Z)" },
                            ]}
                            value={sortOptionInput}
                            onChange={(e) => setSortOptionInput(e.target.value)}
                            className="focus:ring-purple-600 w-full text-base py-3"
                        />
                    </div>
                </div>

                <div className="pt-6 pb-2 mt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <button onClick={applySidebarFilters} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${colors.primary}`}>
                        Aplicar Filtros
                    </button>
                    <button onClick={clearAllFilters} className={`w-full py-3 text-sm font-medium opacity-70 hover:opacity-100 hover:text-red-500 transition-colors`}>
                        Limpiar todos los filtros
                    </button>
                </div>
            </div>
        </motion.aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 min-w-0" ref={searchContainerRef}>
          
          <div className="mb-8 space-y-6">
            <div className="relative flex items-center justify-center lg:h-14">
                {!sidebarOpen && (
                    <motion.button 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSidebarOpen(true)}
                        className={`absolute left-0 hidden lg:flex p-3 rounded-xl border shadow-sm items-center gap-2 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors ${colors.cardBg} ${colors.border}`}
                        title="Mostrar filtros"
                    >
                        <ArrowRightFromLine size={20} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-semibold">Filtros</span>
                    </motion.button>
                )}

                <div className="relative w-full max-w-2xl mx-auto">
                    <div className="relative group">
                        {/* SEARCH INPUT */}
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            className={`w-full pl-12 pr-12 py-4 sm:py-3.5 rounded-2xl border transition-all shadow-sm outline-none text-lg ${
                                isDark 
                                ? "bg-gray-800 border-gray-700 focus:border-purple-500 text-white placeholder-gray-500" 
                                : "bg-white border-gray-300 focus:border-purple-500 text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-purple-100"
                            }`}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={24} />
                        {searchQuery && (
                            <button 
                                onClick={() => { setSearchQuery(""); setSuggestions([]); setActiveFilters(prev => ({...prev, search: ""})) }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-2"
                            >
                                <X size={22} />
                            </button>
                        )}
                    </div>
                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.ul
                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`absolute top-full mt-2 w-full rounded-xl shadow-xl z-30 overflow-hidden border ${colors.cardBg} ${colors.border}`}
                            >
                                {suggestions.map((s, i) => (
                                    <li 
                                        key={i} onClick={() => handleSuggestionClick(s)} 
                                        className={`px-5 py-4 sm:py-3 cursor-pointer transition-colors flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${colors.text} border-b last:border-0 border-gray-100 dark:border-gray-800`}
                                    >
                                        <Search size={18} className="opacity-50" /> <span className="text-lg sm:text-base">{s}</span>
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="flex flex-wrap justify-center gap-2 items-center text-sm"
                    >
                        <span className={`text-xs font-bold uppercase tracking-wide mr-1 ${colors.textMuted}`}>Activos:</span>
                        {activeFilters.categorySlug !== "todos" && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 ${colors.pill}`}>
                                {categories.find(c => c.slug === activeFilters.categorySlug)?.nombre || activeFilters.categorySlug}
                            </span>
                        )}
                        {activeFilters.petType !== "todos" && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.pill}`}>
                                {petTypesOptions.find(p => p.value === activeFilters.petType)?.label || activeFilters.petType}
                            </span>
                        )}
                        {activeFilters.brand !== "Todas" && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.pill}`}>
                                {activeFilters.brand}
                            </span>
                        )}
                        {(activeFilters.priceMin || activeFilters.priceMax) && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.pill}`}>
                                ${activeFilters.priceMin || "0"} - ${activeFilters.priceMax || "..."}
                            </span>
                        )}
                        {activeFilters.search && (
                             <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.pill}`}>
                                "{activeFilters.search}"
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="text-red-500 hover:text-red-600 font-semibold text-xs ml-2 underline decoration-red-300 py-2 px-2">
                            Borrar todos
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 purple-scrollbar px-1 -mx-4 sm:mx-0 pl-4 sm:pl-0">
                {/* CATEGORY BUTTONS */}
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryButtonClick(cat.slug)}
                        className={`whitespace-nowrap px-7 py-3.5 sm:px-5 sm:py-2 rounded-full text-base font-semibold transition-all duration-200 border shadow-sm ${
                            activeFilters.categorySlug === cat.slug
                                ? "bg-purple-600 border-purple-600 text-white shadow-purple-200 dark:shadow-none transform scale-105"
                                : `${colors.cardBg} ${colors.border} ${colors.text} hover:border-purple-400 hover:text-purple-600`
                        }`}
                    >
                        {cat.nombre}
                    </button>
                ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
                {productos.length > 0 ? (
                    // MANTENIENDO EL GRID ORIGINAL: 1 col en movil (tarjetas grandes), más cols en desk
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {productos.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    // Efecto de opacidad si es data vieja (paginación)
                                    className={isPlaceholderData ? 'opacity-50 transition-opacity' : 'opacity-100 transition-opacity'}
                                >
                                    <ProductCard product={product} onAdd={handleAddToCart} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="text-6xl mb-4 grayscale opacity-50">😿</div>
                        <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>Sin resultados</h3>
                        <p className={colors.textMuted}>No encontramos productos con los filtros seleccionados.</p>
                        <button onClick={clearAllFilters} className="mt-6 px-6 py-3 bg-purple-100 text-purple-700 rounded-full font-bold hover:bg-purple-200 transition-colors">
                            Limpiar todos los filtros
                        </button>
                    </div>
                )}
            </>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-3 mb-10">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isPlaceholderData}
                    className={`p-3 rounded-full border shadow-sm ${currentPage === 1 ? `opacity-30 cursor-not-allowed ${colors.border}` : `hover:bg-purple-50 dark:hover:bg-gray-700 ${colors.border}`} ${colors.text}`}
                >
                    <ChevronLeft size={24} />
                </button>
                
                <div className="flex gap-2">
                    {renderPagination()}
                </div>

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isPlaceholderData}
                    className={`p-3 rounded-full border shadow-sm ${currentPage === totalPages ? `opacity-30 cursor-not-allowed ${colors.border}` : `hover:bg-purple-50 dark:hover:bg-gray-700 ${colors.border}`} ${colors.text}`}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
          )}
          
          <div className={`text-center mt-6 text-sm ${colors.textMuted} pb-20 lg:pb-0`}>
             Mostrando {productos.length} de {productsCount} productos
          </div>

        </div>

        {/* --- FLOATING CART --- */}
        <motion.div 
            animate={animateCart ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}} 
            className="fixed bottom-6 right-6 lg:top-24 lg:right-8 z-50 flex flex-col gap-2"
        >
          <button 
            onClick={() => navigate("/cart")} 
            className={`relative p-4 lg:p-4 rounded-full shadow-2xl transition-transform hover:-translate-y-1 ${colors.primary} shadow-purple-900/40`}
            aria-label="Ver carrito"
          >
            <ShoppingCart className="w-7 h-7 lg:w-6 lg:h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-gray-800 animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </motion.div>
        
      </div>
    </section>
  );
}
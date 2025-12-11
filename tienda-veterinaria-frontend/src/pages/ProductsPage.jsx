import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Search, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowRightFromLine } from "lucide-react";
import { Helmet } from 'react-helmet-async';

// --- STORES ---
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";

// --- API ---
import api from "../api/axios";

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

  // --- STATES ---
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [animateCart, setAnimateCart] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sidebar Logic: Open by default on Desktop (>= 1024px), Closed on Mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsCount, setProductsCount] = useState(0);
  const PAGE_SIZE = 12;

  // Sidebar inputs states
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [selectedBrandInput, setSelectedBrandInput] = useState("Todas");
  const [selectedCategorySlugSidebar, setSelectedCategorySlugSidebar] = useState("todos");
  const [selectedPetTypeInput, setSelectedPetTypeInput] = useState("todos");
  const [sortOptionInput, setSortOptionInput] = useState("");
  const [availableBrands, setAvailableBrands] = useState(["Todas"]);

  const petTypesOptions = [
    { value: "todos", label: "Todos" },
    { value: "perro", label: "Perro" },
    { value: "gato", label: "Gato" },
    { value: "ave", label: "Ave" },
    { value: "roedor", label: "Roedor" },
    { value: "reptil", label: "Reptil" },
    { value: "otros", label: "Otros" },
  ];

  const [activeFilters, setActiveFilters] = useState({
    categorySlug: "todos",
    search: "",
    priceMin: "",
    priceMax: "",
    brand: "Todas",
    petType: "todos",
    sort: "",
    page: 1,
  });

  const searchContainerRef = useRef(null);
  const mainContentRef = useRef(null);
  const searchQueryTimeout = useRef(null);
  
  // --- STYLE HELPERS (GLASSMORPHISM) ---
  const glassPanel = isDark 
    ? "bg-gray-900/80 border-gray-700/50 text-white backdrop-blur-xl" 
    : "bg-white/80 border-white/50 text-gray-900 backdrop-blur-xl";
    
  const colors = {
    text: isDark ? "text-gray-100" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-600",
    primary: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30",
    pill: isDark 
        ? "bg-purple-900/40 text-purple-200 border-purple-700" 
        : "bg-purple-200 text-purple-900 border-purple-300 font-semibold", 
  };
  
  const textTitle = isDark ? "text-white" : "text-gray-900"; 

  // Listener para ajustar sidebar si cambia el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) {
            // Opcional: Si quieres que se abra automático al agrandar la pantalla
            // setSidebarOpen(true);
        } else {
            setSidebarOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCH PRODUCTS ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    // Solo hacer scroll si no es la carga inicial o si se cambia de página
    if (currentPage > 1 && window.scrollY > 400 && mainContentRef.current) {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const params = new URLSearchParams();

    if (activeFilters.categorySlug && activeFilters.categorySlug !== "todos") {
      params.append("categoria", activeFilters.categorySlug);
    }
    if (activeFilters.search) params.append("search", activeFilters.search);
    if (activeFilters.priceMin) params.append("priceMin", activeFilters.priceMin);
    if (activeFilters.priceMax) params.append("priceMax", activeFilters.priceMax);
    if (activeFilters.brand !== "Todas") params.append("brand", activeFilters.brand);
    
    if (activeFilters.petType && activeFilters.petType !== "todos") {
      params.append("petType", activeFilters.petType.toLowerCase());
    }
    
    if (activeFilters.sort) {
      let backendSort = "";
      switch (activeFilters.sort) {
        case "price-asc": backendSort = "effective_price"; break;
        case "price-desc": backendSort = "-effective_price"; break;
        case "name-asc": backendSort = "nombre"; break;
        case "name-desc": backendSort = "-nombre"; break;
        default: break;
      }
      if (backendSort) params.append("ordering", backendSort);
    }
    
    params.append("page", currentPage);
    params.append("page_size", PAGE_SIZE);

    try {
      const response = await api.get(`/productos/items/?${params.toString()}`);
      setProductos(response.data.results);
      setProductsCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, currentPage, PAGE_SIZE]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load initial filters
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get("/productos/brands/");
        setAvailableBrands(["Todas", ...response.data.sort()]);
      } catch (error) { console.error(error); }
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get("/productos/categorias/");
        const fetchedCategoriesArray = response.data.results || response.data;
        const allCategories = [{ id: "all", nombre: "Todos", slug: "todos" }, ...fetchedCategoriesArray];
        setCategories(allCategories);
        if(activeFilters.categorySlug !== selectedCategorySlugSidebar) {
          setSelectedCategorySlugSidebar(activeFilters.categorySlug); 
        }
      } catch (error) { console.error(error); }
    };

    fetchBrands();
    fetchCategories();
  }, []);

  // --- HANDLERS ---
  
  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
        setPriceMinInput(value);
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
        setPriceMaxInput(value);
    }
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
        setActiveFilters(prev => ({ ...prev, search: query, page: 1 }));
      } else if (activeFilters.search !== "") {
        setActiveFilters(prev => ({ ...prev, search: "", page: 1 }));
      }

      if (query.length >= 1) {
        try {
            const response = await api.get(`/productos/items/?search=${query}&page_size=5`);
            const matches = response.data.results.map((p) => p.nombre);
            setSuggestions([...new Set(matches)]);
        } catch (error) { setSuggestions([]); }
      } else {
          setSuggestions([]);
      }
    }, 300);
  };

  const handleSuggestionClick = (name) => {
    setSearchQuery(name);
    setSuggestions([]);
    setActiveFilters(prev => ({ ...prev, search: name, page: 1 }));
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
      page: 1,
    }));
    setSelectedCategorySlug(selectedCategorySlugSidebar);
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
        page: 1,
    };
    setSelectedCategorySlug("todos");
    setSelectedCategorySlugSidebar("todos");
    setSearchQuery("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setSelectedBrandInput("Todas");
    setSelectedPetTypeInput("todos");
    setSortOptionInput("");
    setSuggestions([]);
    setActiveFilters(defaultFilters);
    if(window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleCategoryButtonClick = (categorySlug) => {
    setSelectedCategorySlug(categorySlug);
    setSelectedCategorySlugSidebar(categorySlug);
    setActiveFilters(prev => ({ ...prev, categorySlug: categorySlug, page: 1 }));
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
            : `${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50"} ${colors.text} bg-white/10`
        }`}
      >
        {x}
      </button>
    ));
  };

  const hasActiveFilters = Object.entries(activeFilters).some(
    ([key, value]) => {
        if (key === 'page') return false; 
        if (key === 'sort') return false;
        return (value !== "" && value !== "Todas" && value !== "todos" && value !== "Todos");
    }
  );

  return (
    <section className="relative min-h-screen w-full py-8 md:py-12 overflow-x-hidden font-sans pb-24 lg:pb-8">
      <Helmet>
        <title>Catálogo de Productos | VetShop</title>
      </Helmet>

      {/* BACKGROUNDS (Consistent with other pages) */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0 fixed"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out fixed ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="relative z-10 container mx-auto px-4 flex flex-col lg:flex-row gap-6">
        
        {/* --- SIDEBAR --- */}
        <AnimatePresence>
            {sidebarOpen && window.innerWidth < 1024 && (
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
                ${glassPanel} lg:border lg:rounded-3xl shadow-2xl lg:shadow-none
            `}
            initial={false}
            animate={{ 
                width: sidebarOpen ? (window.innerWidth >= 1024 ? "18rem" : "85%") : "0rem",
                x: (window.innerWidth < 1024 && !sidebarOpen) ? "-100%" : "0%"
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
            <div className="w-full h-full overflow-y-auto p-6 scrollbar-thin">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={22} className="text-purple-500"/> Filtros</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Categories */}
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Categoría</label>
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
                        <p className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Precio</p>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-base">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={priceMinInput}
                                    onChange={handleMinPriceChange}
                                    className={`w-full pl-8 pr-3 py-3 rounded-xl border bg-white/5 backdrop-blur-sm outline-none focus:ring-2 focus:ring-purple-500 transition-colors 
                                    ${isDark ? 'border-gray-600 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                            <span className="font-bold opacity-50">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-base">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={priceMaxInput}
                                    onChange={handleMaxPriceChange}
                                    className={`w-full pl-8 pr-3 py-3 rounded-xl border bg-white/5 backdrop-blur-sm outline-none focus:ring-2 focus:ring-purple-500 transition-colors
                                    ${isDark ? 'border-gray-600 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Marca</label>
                        <AdminFormSelect
                            name="brand"
                            options={availableBrands.map(b => ({ value: b, label: b }))}
                            value={selectedBrandInput}
                            onChange={(e) => setSelectedBrandInput(e.target.value)}
                            className="focus:ring-purple-600 w-full text-base py-3"
                        />
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Ordenar por</label>
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

                <div className="pt-6 pb-2 mt-6 border-t border-gray-200/20 space-y-3">
                    <button onClick={applySidebarFilters} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${colors.primary}`}>
                        Aplicar Filtros
                    </button>
                    <button onClick={clearAllFilters} className={`w-full py-3 text-sm font-medium opacity-70 hover:opacity-100 hover:text-red-500 transition-colors`}>
                        Limpiar todo
                    </button>
                </div>
            </div>
        </motion.aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 min-w-0" ref={mainContentRef}>
          
          {/* HEADER & SEARCH AREA */}
          <div className="mb-8 space-y-6">
            
            {/* CLEAN TITLE */}
            <div className="text-center md:text-left pt-2 pb-2">
                <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${colors.text} drop-shadow-sm`}>
                    Nuestra <span className="text-purple-600 dark:text-purple-400">Colección</span>
                </h1>
                <p className={`mt-2 text-sm md:text-base ${colors.textMuted} max-w-lg mx-auto md:mx-0`}>
                    Encuentra lo mejor para tu mascota entre nuestra selección premium.
                </p>
            </div>

            <div className="relative w-full max-w-3xl mx-auto md:mx-0">
                <div className="flex gap-3">
                    
                    {/* DESKTOP FILTER TOGGLE (Shows only when sidebar is closed) */}
                    {!sidebarOpen && (
                         <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSidebarOpen(true)}
                            className={`hidden lg:flex items-center justify-center p-3.5 rounded-2xl border shadow-sm transition-colors backdrop-blur-md ${
                                isDark 
                                ? "bg-gray-800/60 border-gray-600 text-white hover:bg-gray-700" 
                                : "bg-white/80 border-white/60 text-gray-700 hover:bg-white"
                            }`}
                            title="Mostrar Filtros"
                        >
                            <ArrowRightFromLine size={24} className="text-purple-600 dark:text-purple-400" />
                        </motion.button>
                    )}

                    {/* SEARCH INPUT - UNIFIED */}
                    <div ref={searchContainerRef} className="relative flex-1 group">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border transition-all shadow-sm outline-none text-base font-medium backdrop-blur-md ${
                                isDark 
                                ? "bg-gray-800/60 border-gray-600 focus:border-purple-500 text-white placeholder-gray-400" 
                                : "bg-white/80 border-white/60 focus:border-purple-500 text-gray-900 placeholder-gray-500 hover:bg-white focus:bg-white"
                            }`}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={22} />
                        {searchQuery && (
                            <button 
                                onClick={() => { setSearchQuery(""); setSuggestions([]); setActiveFilters(prev => ({...prev, search: ""})) }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                            >
                                <X size={18} />
                            </button>
                        )}
                        
                        {/* SUGGESTIONS */}
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <motion.ul
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`absolute top-full mt-2 w-full rounded-2xl shadow-2xl z-30 overflow-hidden border backdrop-blur-xl ${glassPanel}`}
                                >
                                    {suggestions.map((s, i) => (
                                        <li 
                                            key={i} onClick={() => handleSuggestionClick(s)} 
                                            className={`px-5 py-3 cursor-pointer transition-colors flex items-center gap-3 hover:bg-purple-500/10 border-b last:border-0 border-gray-100/10`}
                                        >
                                            <Search size={16} className="opacity-50" /> <span className="text-sm font-medium">{s}</span>
                                        </li>
                                    ))}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* MOBILE FILTER TOGGLE */}
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSidebarOpen(true)}
                        className={`flex lg:hidden items-center justify-center p-3.5 rounded-2xl border shadow-sm transition-colors backdrop-blur-md ${
                             isDark 
                             ? "bg-gray-800/60 border-gray-600 text-white hover:bg-gray-700" 
                             : "bg-white/80 border-white/60 text-gray-700 hover:bg-white"
                        }`}
                        title="Filtros"
                    >
                        <SlidersHorizontal size={24} className="text-purple-600 dark:text-purple-400" />
                    </motion.button>
                </div>
            </div>

            {/* ACTIVE FILTERS PILLS */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="flex flex-wrap gap-2 items-center text-sm"
                    >
                        <span className={`text-xs font-bold uppercase tracking-wide mr-1 ${colors.textMuted}`}>Filtros:</span>
                        {activeFilters.categorySlug !== "todos" && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${colors.pill}`}>
                                {categories.find(c => c.slug === activeFilters.categorySlug)?.nombre || activeFilters.categorySlug}
                            </span>
                        )}
                        {activeFilters.brand !== "Todas" && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.pill}`}>
                                {activeFilters.brand}
                            </span>
                        )}
                        {(activeFilters.priceMin || activeFilters.priceMax) && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.pill}`}>
                                ${activeFilters.priceMin || "0"} - ${activeFilters.priceMax || "..."}
                            </span>
                        )}
                        {activeFilters.search && (
                             <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.pill}`}>
                                "{activeFilters.search}"
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="text-red-500 hover:text-red-600 font-bold text-xs ml-1 underline decoration-2 underline-offset-2">
                            Limpiar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HORIZONTAL CATEGORIES */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 purple-scrollbar px-1 -mx-4 sm:mx-0 pl-4 sm:pl-0">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryButtonClick(cat.slug)}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border shadow-sm backdrop-blur-md ${
                            selectedCategorySlug === cat.slug
                                ? "bg-purple-600 border-purple-600 text-white shadow-purple-500/30 transform scale-105"
                                : `${isDark ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-700' : 'bg-white/60 border-white/40 hover:bg-white'} ${colors.text}`
                        }`}
                    >
                        {cat.nombre}
                    </button>
                ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
                {productos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                        <AnimatePresence mode="popLayout">
                            {productos.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ProductCard product={product} onAdd={handleAddToCart} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10">
                        <div className="text-6xl mb-4 grayscale opacity-50">😿</div>
                        <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>Sin resultados</h3>
                        <p className={`text-sm ${colors.textMuted}`}>Intenta ajustar tus filtros de búsqueda.</p>
                        <button onClick={clearAllFilters} className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg">
                            Ver todos los productos
                        </button>
                    </div>
                )}
            </>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-3 mb-10">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-3 rounded-full border shadow-sm transition-all ${currentPage === 1 ? `opacity-30 cursor-not-allowed ${isDark ? 'border-gray-700' : 'border-gray-200'}` : `hover:bg-purple-500/10 ${isDark ? 'border-gray-600' : 'border-gray-300 bg-white/50'}`} ${colors.text}`}
                >
                    <ChevronLeft size={24} />
                </button>
                
                <div className="flex gap-2">
                    {renderPagination()}
                </div>

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-3 rounded-full border shadow-sm transition-all ${currentPage === totalPages ? `opacity-30 cursor-not-allowed ${isDark ? 'border-gray-700' : 'border-gray-200'}` : `hover:bg-purple-500/10 ${isDark ? 'border-gray-600' : 'border-gray-300 bg-white/50'}`} ${colors.text}`}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
          )}
          
          <div className={`text-center mt-6 text-sm ${colors.textMuted} opacity-70`}>
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
            className={`relative p-4 rounded-full shadow-2xl transition-transform hover:-translate-y-1 ${colors.primary} shadow-purple-900/40 ring-4 ring-white/10`}
            aria-label="Ver carrito"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </motion.div>
        
      </div>
    </section>
  );
}
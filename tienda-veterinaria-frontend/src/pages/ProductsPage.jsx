// src/pages/ProductsPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Search, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowRightFromLine, ArrowLeftFromLine } from "lucide-react";
import { Helmet } from 'react-helmet-async';
// --- STORES ---
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatPrice } from "../utils/format";

// --- API ---
import api from "../api/axios";


// --- COMPONENTES ---
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import AdminFormSelect from "../components/admin/AdminFormSelect";
import AdminFormInput from "../components/admin/AdminFormInput";

export default function ProductsPage() {
  const navigate = useNavigate();
  
  // --- ZUSTAND ---
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.count);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // --- ESTADOS ---
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [animateCart, setAnimateCart] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sidebar CERRADO por defecto
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsCount, setProductsCount] = useState(0);
  const PAGE_SIZE = 12;

  // Estados sidebar inputs
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
  
  // --- HELPERS DE ESTILO ---
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

  // --- FETCH PRODUCTS ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    if (window.scrollY > 400 && mainContentRef.current) {
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

  // Cargar filtros iniciales
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
  
  // Validacion de precios (No negativos) - Lógica OK
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
            : `${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"} ${colors.text}`
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
    <section className={`min-h-screen py-8 w-full ${colors.bg} transition-colors duration-300`}>

      <Helmet>
        <title>Catálogo de Productos | VetShop</title>
      </Helmet>
      
     
   

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6 relative">
        
        {/* --- TOGGLE BARRA MOBILE --- */}
        <div className="lg:hidden flex items-center justify-between mb-4">
             <div className="flex-1">
                 <h1 className={`text-2xl font-bold ${colors.text}`}>Tienda</h1>
             </div>
            <button
            onClick={() => setSidebarOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all ${colors.cardBg} ${colors.text} border ${colors.border}`}
            >
            <SlidersHorizontal size={18} />
            <span>Filtros</span>
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
                width: sidebarOpen ? (window.innerWidth >= 1024 ? "18rem" : "80%") : (window.innerWidth >= 1024 ? "0rem" : "0rem"),
                x: (window.innerWidth < 1024 && !sidebarOpen) ? "-100%" : "0%"
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
             <div className="w-full h-full overflow-y-auto p-6 scrollbar-thin">
                <div className="flex justify-between items-center mb-6 lg:mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={20}/> Filtros</h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                     <button onClick={() => setSidebarOpen(false)} className="hidden lg:block p-1 hover:text-purple-500 transition-colors" title="Ocultar filtros">
                        <ArrowLeftFromLine size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Categorías */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Categoría</label>
                        <AdminFormSelect
                            name="category"
                            options={categories.map(c => ({ value: c.slug, label: c.nombre }))}
                            value={selectedCategorySlugSidebar}
                            onChange={(e) => setSelectedCategorySlugSidebar(e.target.value)}
                            className="focus:ring-purple-600 focus:border-purple-600"
                        />
                    </div>

                    {/* Precios (Lógica Correcta) */}
                   <div className="space-y-1">
                        <p className={`font-semibold text-xs uppercase tracking-wider mb-1 ${textTitle}`}>Precio</p>
                        <div className="flex items-center gap-2">
                            <div className="relative w-24"> 
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="Min" 
                                    value={priceMinInput} 
                                    onChange={handleMinPriceChange} 
                                    className={`w-full pl-5 pr-2 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors 
                                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>

                            <span className="text-gray-400">-</span>

                            <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="Max" 
                                    value={priceMaxInput} 
                                    onChange={handleMaxPriceChange} 
                                    className={`w-full pl-5 pr-2 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors
                                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Marca */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Marca</label>
                        <AdminFormSelect
                            name="brand"
                            options={availableBrands.map(b => ({ value: b, label: b }))}
                            value={selectedBrandInput}
                            onChange={(e) => setSelectedBrandInput(e.target.value)}
                            className="focus:ring-purple-600"
                        />
                    </div>

                    {/* Mascota */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Mascota</label>
                        <AdminFormSelect
                            name="petTypeFull"
                            options={petTypesOptions}
                            value={selectedPetTypeInput}
                            onChange={(e) => setSelectedPetTypeInput(e.target.value)}
                            className="focus:ring-purple-600"
                        />
                    </div>
                    
                    {/* Ordenar */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Ordenar</label>
                        <AdminFormSelect
                            options={[
                                { value: "", label: "Relevancia" },
                                { value: "price-asc", label: "Precio: Bajo a Alto" },
                                { value: "price-desc", label: "Precio: Alto a Bajo" },
                                { value: "name-asc", label: "Nombre (A-Z)" },
                            ]}
                            value={sortOptionInput}
                            onChange={(e) => setSortOptionInput(e.target.value)}
                            className="focus:ring-purple-600"
                        />
                    </div>
                </div>

                <div className="pt-6 pb-2 mt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <button onClick={applySidebarFilters} className={`w-full py-3 rounded-lg font-bold transition-transform active:scale-95 ${colors.primary}`}>
                        Aplicar Filtros
                    </button>
                    <button onClick={clearAllFilters} className={`w-full py-2 text-sm font-medium opacity-70 hover:opacity-100 hover:text-red-500 transition-colors`}>
                        Limpiar Todo
                    </button>
                </div>
            </div>
        </motion.aside>


        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="flex-1 min-w-0" ref={mainContentRef}>
          
          <div className="mb-8 space-y-5">
            <div className="relative flex items-center justify-center h-14">
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

                <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            className={`w-full pl-11 pr-10 py-3 rounded-xl border transition-all shadow-sm outline-none ${
                                isDark 
                                ? "bg-gray-800 border-gray-700 focus:border-purple-500 text-white placeholder-gray-500" 
                                : "bg-white border-gray-300 focus:border-purple-500 text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-purple-100"
                            }`}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                        {searchQuery && (
                            <button 
                                onClick={() => { setSearchQuery(""); setSuggestions([]); setActiveFilters(prev => ({...prev, search: ""})) }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.ul
                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`absolute top-full mt-1 w-full rounded-xl shadow-xl z-30 overflow-hidden border ${colors.cardBg} ${colors.border}`}
                            >
                                {suggestions.map((s, i) => (
                                    <li 
                                        key={i} onClick={() => handleSuggestionClick(s)} 
                                        className={`px-5 py-3 cursor-pointer transition-colors flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${colors.text}`}
                                    >
                                        <Search size={14} className="opacity-50" /> {s}
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
                            <span className={`px-3 py-1 rounded-md text-xs border ${colors.pill}`}>
                                Categoria: {categories.find(c => c.slug === activeFilters.categorySlug)?.nombre || activeFilters.categorySlug}
                            </span>
                        )}
                        {activeFilters.petType !== "todos" && (
                            <span className={`px-3 py-1 rounded-md text-xs border ${colors.pill}`}>
                                Mascota: {petTypesOptions.find(p => p.value === activeFilters.petType)?.label || activeFilters.petType}
                            </span>
                        )}
                        {activeFilters.brand !== "Todas" && (
                            <span className={`px-3 py-1 rounded-md text-xs border ${colors.pill}`}>
                                Marca: {activeFilters.brand}
                            </span>
                        )}
                        {(activeFilters.priceMin || activeFilters.priceMax) && (
                            <span className={`px-3 py-1 rounded-md text-xs border ${colors.pill}`}>
                                Precio: {activeFilters.priceMin || "0"} - {activeFilters.priceMax || "..."}
                            </span>
                        )}
                        {activeFilters.search && (
                             <span className={`px-3 py-1 rounded-md text-xs border ${colors.pill}`}>
                                "{activeFilters.search}"
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="text-red-500 hover:text-red-700 font-medium text-xs ml-2 underline decoration-red-300">
                            Borrar todos
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 purple-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryButtonClick(cat.slug)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                            selectedCategorySlug === cat.slug
                                ? "bg-purple-600 border-purple-600 text-white shadow-md"
                                : `${colors.cardBg} ${colors.border} ${colors.text} hover:border-purple-400 hover:text-purple-600`
                        }`}
                    >
                        {cat.nombre}
                    </button>
                ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
                {productos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {productos.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
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
                        <button onClick={clearAllFilters} className="mt-6 px-6 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold hover:bg-purple-200 transition-colors">
                            Limpiar todos los filtros
                        </button>
                    </div>
                )}
            </>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full border ${currentPage === 1 ? `opacity-30 cursor-not-allowed ${colors.border}` : `hover:bg-purple-50 dark:hover:bg-gray-700 ${colors.border}`} ${colors.text}`}
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-1">
                    {renderPagination()}
                </div>

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full border ${currentPage === totalPages ? `opacity-30 cursor-not-allowed ${colors.border}` : `hover:bg-purple-50 dark:hover:bg-gray-700 ${colors.border}`} ${colors.text}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
          )}
          
          <div className={`text-center mt-6 text-xs ${colors.textMuted}`}>
             Mostrando {productos.length} de {productsCount} productos
          </div>

        </div>

        <motion.div 
            animate={animateCart ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}} 
            className="fixed top-24 right-8 z-40 hidden lg:flex flex-col gap-2"
        >
          <button 
            onClick={() => navigate("/cart")} 
            className={`relative p-4 rounded-full shadow-2xl transition-transform hover:-translate-y-1 ${colors.primary}`}
            aria-label="Ver carrito"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-800">
                {cartCount}
              </span>
            )}
          </button>
        </motion.div>
        
      </div>
    </section>
  );
}
export interface paths {
    "/api/carrito/cart/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Recupera el carrito actual o crea uno anónimo. */
        get: operations["carrito_cart_retrieve"];
        /** @description Actualiza la cantidad de un ítem en el carrito. */
        put: operations["carrito_cart_update"];
        /** @description Añade un producto al carrito. */
        post: operations["carrito_cart_create"];
        /** @description Elimina un ítem del carrito o vacía todo el carrito. */
        delete: operations["carrito_cart_destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carrito/cart/items/{item_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Recupera el carrito actual o crea uno anónimo. */
        get: operations["carrito_cart_items_retrieve"];
        /** @description Actualiza la cantidad de un ítem en el carrito. */
        put: operations["carrito_cart_items_update"];
        /** @description Añade un producto al carrito. */
        post: operations["carrito_cart_items_create"];
        /** @description Elimina un ítem del carrito o vacía todo el carrito. */
        delete: operations["carrito_cart_items_destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/admin/users/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Administración: lista todos los usuarios. */
        get: operations["cuentas_admin_users_list"];
        put?: never;
        /** @description Administración: lista todos los usuarios. */
        post: operations["cuentas_admin_users_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/admin/users/{id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Administración: detalle, edición y eliminación de usuarios. */
        get: operations["cuentas_admin_users_retrieve"];
        /** @description Administración: detalle, edición y eliminación de usuarios. */
        put: operations["cuentas_admin_users_update"];
        post?: never;
        /** @description Administración: detalle, edición y eliminación de usuarios. */
        delete: operations["cuentas_admin_users_destroy"];
        options?: never;
        head?: never;
        /** @description Administración: detalle, edición y eliminación de usuarios. */
        patch: operations["cuentas_admin_users_partial_update"];
        trace?: never;
    };
    "/api/cuentas/cambiar-contrasena/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Cambia la contraseña del usuario autenticado. */
        post: operations["cuentas_cambiar_contrasena_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/logout/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Registra un logout del usuario. */
        post: operations["cuentas_logout_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/perfil/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Obtiene y actualiza el perfil del usuario autenticado. */
        get: operations["cuentas_perfil_retrieve"];
        /** @description Obtiene y actualiza el perfil del usuario autenticado. */
        put: operations["cuentas_perfil_update"];
        post?: never;
        /** @description Obtiene y actualiza el perfil del usuario autenticado. */
        delete: operations["cuentas_perfil_destroy"];
        options?: never;
        head?: never;
        /** @description Obtiene y actualiza el perfil del usuario autenticado. */
        patch: operations["cuentas_perfil_partial_update"];
        trace?: never;
    };
    "/api/cuentas/registro/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Registra un nuevo usuario. */
        post: operations["cuentas_registro_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/restablecer-contrasena/confirmar/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Confirma el restablecimiento de contraseña con token. */
        post: operations["cuentas_restablecer_contrasena_confirmar_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/restablecer-contrasena/solicitar/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Solicita un correo para restablecimiento de contraseña. */
        post: operations["cuentas_restablecer_contrasena_solicitar_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/token/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Login personalizado que incluye:
         *     - Tokens JWT
         *     - Datos del usuario
         *     - Fusión de carrito anónimo
         */
        post: operations["cuentas_token_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/token/refresh/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Takes a refresh type JSON web token and returns an access type JSON web
         *     token if the refresh token is valid.
         */
        post: operations["cuentas_token_refresh_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas/token/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Takes a token and indicates if it is valid.  This view provides no
         *     information about a token's fitness for a particular use.
         */
        post: operations["cuentas_token_verify_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pedidos/admin/orders/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Lista todos los pedidos (solo admin). */
        get: operations["pedidos_admin_orders_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pedidos/admin/stats/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retorna estadísticas de ventas para el dashboard admin. */
        get: operations["pedidos_admin_stats_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pedidos/create-payment-intent/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Crea un PaymentIntent en Stripe para iniciar el checkout. */
        post: operations["pedidos_create_payment_intent_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pedidos/my-orders/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Lista los pedidos del usuario autenticado. */
        get: operations["pedidos_my_orders_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pedidos/webhook/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Endpoint de webhook de Stripe para procesar eventos de pago. */
        post: operations["pedidos_webhook_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/admin/categorias/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: lista y crea categorías. */
        get: operations["productos_admin_categorias_list"];
        put?: never;
        /** @description Admin: lista y crea categorías. */
        post: operations["productos_admin_categorias_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/admin/categorias/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: ve, edita y elimina categorías. */
        get: operations["productos_admin_categorias_retrieve"];
        /** @description Admin: ve, edita y elimina categorías. */
        put: operations["productos_admin_categorias_update"];
        post?: never;
        /** @description Admin: ve, edita y elimina categorías. */
        delete: operations["productos_admin_categorias_destroy"];
        options?: never;
        head?: never;
        /** @description Admin: ve, edita y elimina categorías. */
        patch: operations["productos_admin_categorias_partial_update"];
        trace?: never;
    };
    "/api/productos/admin/imagenes/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: lista y crea (sube) imágenes. */
        get: operations["productos_admin_imagenes_list"];
        put?: never;
        /** @description Admin: lista y crea (sube) imágenes. */
        post: operations["productos_admin_imagenes_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/admin/imagenes/{id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: ve, edita y elimina imágenes. */
        get: operations["productos_admin_imagenes_retrieve"];
        /** @description Admin: ve, edita y elimina imágenes. */
        put: operations["productos_admin_imagenes_update"];
        post?: never;
        /** @description Admin: ve, edita y elimina imágenes. */
        delete: operations["productos_admin_imagenes_destroy"];
        options?: never;
        head?: never;
        /** @description Admin: ve, edita y elimina imágenes. */
        patch: operations["productos_admin_imagenes_partial_update"];
        trace?: never;
    };
    "/api/productos/admin/items/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: lista y crea productos. */
        get: operations["productos_admin_items_list"];
        put?: never;
        /** @description Admin: lista y crea productos. */
        post: operations["productos_admin_items_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/admin/items/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin: ve, edita y elimina productos. */
        get: operations["productos_admin_items_retrieve"];
        /** @description Admin: ve, edita y elimina productos. */
        put: operations["productos_admin_items_update"];
        post?: never;
        /** @description Admin: ve, edita y elimina productos. */
        delete: operations["productos_admin_items_destroy"];
        options?: never;
        head?: never;
        /** @description Admin: ve, edita y elimina productos. */
        patch: operations["productos_admin_items_partial_update"];
        trace?: never;
    };
    "/api/productos/brands/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Lista todas las marcas únicas. */
        get: operations["productos_brands_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/categorias/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Lista categorías activas (público). */
        get: operations["productos_categorias_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/categorias/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Detalle de categoría (público). */
        get: operations["productos_categorias_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/items/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Lista productos públicos con filtros y búsqueda. */
        get: operations["productos_items_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/items/{product_id}/reviews/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Crea un review para un producto. */
        post: operations["productos_items_reviews_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/items/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Detalle de producto (público). */
        get: operations["productos_items_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AdminDashboardStatsResponse: {
            /** Format: double */
            total_sales: number;
            total_orders: number;
            total_users: number;
            total_products: number;
            /** Format: double */
            period_sales: number;
            period_orders: number;
            /** Format: double */
            period_avg_value: number;
            active_customers: number;
            trends: {
                [key: string]: unknown;
            };
            top_products: unknown[];
            chart_data: {
                [key: string]: unknown;
            };
            orders_by_status: unknown[];
            sales_by_category: unknown[];
            period_days: number;
        };
        AdminUser: {
            readonly id: number;
            /**
             * Nombre de usuario
             * @description Requerido. 150 carácteres como máximo. Únicamente letras, dígitos y @/./+/-/_
             */
            username: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            email: string;
            /** Nombre */
            first_name?: string;
            /** Apellidos */
            last_name?: string;
            /**
             * Es staff
             * @description Indica si el usuario puede entrar en este sitio de administración.
             */
            is_staff?: boolean;
            /**
             * Activo
             * @description Indica si el usuario debe ser tratado como activo. Desmarque esta opción en lugar de borrar la cuenta.
             */
            is_active?: boolean;
            /**
             * Fecha de alta
             * Format: date-time
             */
            readonly date_joined: string;
            /**
             * Es Cliente VIP
             * @description Indica si el usuario tiene estatus VIP (Descuentos, etc.)
             */
            is_vip?: boolean;
        };
        AdminUserDetail: {
            readonly id: number;
            /**
             * Nombre de usuario
             * @description Requerido. 150 carácteres como máximo. Únicamente letras, dígitos y @/./+/-/_
             */
            username: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            email: string;
            /** Nombre */
            first_name?: string;
            /** Apellidos */
            last_name?: string;
            /**
             * Es staff
             * @description Indica si el usuario puede entrar en este sitio de administración.
             */
            is_staff?: boolean;
            /**
             * Activo
             * @description Indica si el usuario debe ser tratado como activo. Desmarque esta opción en lugar de borrar la cuenta.
             */
            is_active?: boolean;
            /**
             * Es Cliente VIP
             * @description Indica si el usuario tiene estatus VIP (Descuentos, etc.)
             */
            is_vip?: boolean;
            /**
             * Fecha de alta
             * Format: date-time
             */
            readonly date_joined: string;
            /**
             * Último inicio de sesión
             * Format: date-time
             */
            readonly last_login: string | null;
            readonly activity_logs: components["schemas"]["UserActivityLog"][];
            readonly total_orders: number;
            /** Format: double */
            readonly total_spent: number;
            /** Format: date-time */
            readonly last_order_date: string | null;
        };
        /** @enum {unknown} */
        BlankEnum: "";
        Cart: {
            readonly id: number;
            /** Usuario */
            readonly user: number | null;
            /** Format: uuid */
            readonly session_key: string;
            readonly items: components["schemas"]["CartItem"][];
            /** Format: decimal */
            readonly total_price: string;
            /**
             * Fecha de Creación
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * Última Actualización
             * Format: date-time
             */
            readonly updated_at: string;
        };
        CartItem: {
            readonly id: number;
            product_id: number;
            readonly product_name: string;
            readonly product_slug: string;
            readonly product_main_image: string;
            /** Cantidad */
            quantity?: number;
            /**
             * Precio Unitario
             * Format: decimal
             */
            readonly price: string;
            readonly subtotal: string;
        };
        CartItemMutation: {
            product_id?: number;
            item_id?: number;
            quantity?: number;
        };
        Categoria: {
            readonly id: number;
            /** Nombre de la Categoría */
            nombre: string;
            /** Slug de la Categoría */
            slug?: string;
            /** Descripción */
            descripcion?: string;
            /** Activa */
            is_active?: boolean;
        };
        CreatePaymentIntentRequest: {
            cart_id?: number;
        };
        CreatePaymentIntentResponse: {
            clientSecret: string;
        };
        CustomUser: {
            readonly id: number;
            /**
             * Nombre de usuario
             * @description Requerido. 150 carácteres como máximo. Únicamente letras, dígitos y @/./+/-/_
             */
            readonly username: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            readonly email: string;
            /** Nombre */
            first_name?: string;
            /** Apellidos */
            last_name?: string;
            /**
             * Fecha de alta
             * Format: date-time
             */
            readonly date_joined: string;
            /**
             * Es staff
             * @description Indica si el usuario puede entrar en este sitio de administración.
             */
            readonly is_staff: boolean;
            /**
             * Estado de superusuario
             * @description Indica que este usuario tiene todos los permisos sin asignárselos explícitamente.
             */
            readonly is_superuser: boolean;
            /**
             * Es Cliente VIP
             * @description Indica si el usuario tiene estatus VIP (Descuentos, etc.)
             */
            readonly is_vip: boolean;
        };
        ImagenProducto: {
            readonly id: number;
            imagen?: string | null;
            alt_text?: string;
            is_feature?: boolean;
            order?: number;
        };
        ImagenProductoAdmin: {
            readonly id: number;
            producto: number;
            imagen?: string | null;
            alt_text?: string;
            is_feature?: boolean;
            readonly order: number;
        };
        MessageResponse: {
            message: string;
        };
        /** @enum {unknown} */
        NullEnum: null;
        Order: {
            readonly id: number;
            /** Format: date-time */
            readonly created_at: string;
            status?: components["schemas"]["StatusEnum"];
            /** Format: decimal */
            total: string;
            readonly items: components["schemas"]["OrderItem"][];
        };
        OrderItem: {
            readonly id: number;
            readonly product_name: string;
            quantity?: number;
            /** Format: decimal */
            price: string;
        };
        PaginatedCategoriaList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Categoria"][];
        };
        PaginatedImagenProductoAdminList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["ImagenProductoAdmin"][];
        };
        PaginatedProductoCreateUpdateList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["ProductoCreateUpdate"][];
        };
        PaginatedProductoList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Producto"][];
        };
        PasswordChange: {
            old_password: string;
            new_password: string;
            new_password_confirm: string;
        };
        PasswordResetConfirm: {
            uidb64: string;
            token: string;
            new_password: string;
            new_password_confirm: string;
        };
        PasswordResetRequest: {
            /** Format: email */
            email: string;
        };
        PatchedAdminUser: {
            readonly id?: number;
            /**
             * Nombre de usuario
             * @description Requerido. 150 carácteres como máximo. Únicamente letras, dígitos y @/./+/-/_
             */
            username?: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            email?: string;
            /** Nombre */
            first_name?: string;
            /** Apellidos */
            last_name?: string;
            /**
             * Es staff
             * @description Indica si el usuario puede entrar en este sitio de administración.
             */
            is_staff?: boolean;
            /**
             * Activo
             * @description Indica si el usuario debe ser tratado como activo. Desmarque esta opción en lugar de borrar la cuenta.
             */
            is_active?: boolean;
            /**
             * Fecha de alta
             * Format: date-time
             */
            readonly date_joined?: string;
            /**
             * Es Cliente VIP
             * @description Indica si el usuario tiene estatus VIP (Descuentos, etc.)
             */
            is_vip?: boolean;
        };
        PatchedCategoria: {
            readonly id?: number;
            /** Nombre de la Categoría */
            nombre?: string;
            /** Slug de la Categoría */
            slug?: string;
            /** Descripción */
            descripcion?: string;
            /** Activa */
            is_active?: boolean;
        };
        PatchedCustomUser: {
            readonly id?: number;
            /**
             * Nombre de usuario
             * @description Requerido. 150 carácteres como máximo. Únicamente letras, dígitos y @/./+/-/_
             */
            readonly username?: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            readonly email?: string;
            /** Nombre */
            first_name?: string;
            /** Apellidos */
            last_name?: string;
            /**
             * Fecha de alta
             * Format: date-time
             */
            readonly date_joined?: string;
            /**
             * Es staff
             * @description Indica si el usuario puede entrar en este sitio de administración.
             */
            readonly is_staff?: boolean;
            /**
             * Estado de superusuario
             * @description Indica que este usuario tiene todos los permisos sin asignárselos explícitamente.
             */
            readonly is_superuser?: boolean;
            /**
             * Es Cliente VIP
             * @description Indica si el usuario tiene estatus VIP (Descuentos, etc.)
             */
            readonly is_vip?: boolean;
        };
        PatchedImagenProductoAdmin: {
            readonly id?: number;
            producto?: number;
            imagen?: string | null;
            alt_text?: string;
            is_feature?: boolean;
            readonly order?: number;
        };
        PatchedProductoCreateUpdate: {
            readonly id?: number;
            /** Nombre del Producto */
            nombre?: string;
            /** Descripción Corta */
            descripcion_corta?: string;
            /** Descripción Larga */
            descripcion_larga?: string;
            /** Format: decimal */
            precio?: string;
            /**
             * Precio de Oferta
             * Format: decimal
             */
            precio_oferta?: string | null;
            /** Categoría */
            categoria?: number | null;
            readonly categoria_info?: components["schemas"]["SimpleCategoria"];
            /** SKU (Stock Keeping Unit) */
            sku?: string;
            /** Cantidad en Stock */
            stock?: number;
            /** Activo */
            is_active?: boolean;
            /** Destacado (Home) */
            is_featured?: boolean;
            marca?: string | null;
            /** Tipo de Mascota */
            tipo_mascota?: (components["schemas"]["TipoMascotaEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            /** Slug del Producto */
            readonly slug?: string;
        };
        Producto: {
            readonly id: number;
            /** Nombre del Producto */
            nombre: string;
            /** Slug del Producto */
            readonly slug: string;
            /** Descripción Corta */
            descripcion_corta?: string;
            /** Descripción Larga */
            descripcion_larga?: string;
            /** Format: decimal */
            precio: string;
            /**
             * Precio de Oferta
             * Format: decimal
             */
            precio_oferta?: string | null;
            /** Format: double */
            readonly get_precio_actual: number;
            /** Categoría */
            categoria?: number | null;
            readonly categoria_info: components["schemas"]["SimpleCategoria"];
            /** SKU (Stock Keeping Unit) */
            sku?: string;
            /** Cantidad en Stock */
            stock?: number;
            /** Activo */
            is_active?: boolean;
            /** Destacado (Home) */
            is_featured?: boolean;
            /**
             * Fecha de Creación
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * Última Actualización
             * Format: date-time
             */
            readonly updated_at: string;
            readonly imagenes: components["schemas"]["ImagenProducto"][];
            marca?: string | null;
            /** Tipo de Mascota */
            tipo_mascota?: (components["schemas"]["TipoMascotaEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            /** Format: double */
            readonly rating_average: number;
            readonly review_count: number;
            readonly reviews: components["schemas"]["Review"][];
        };
        ProductoCreateUpdate: {
            readonly id: number;
            /** Nombre del Producto */
            nombre: string;
            /** Descripción Corta */
            descripcion_corta?: string;
            /** Descripción Larga */
            descripcion_larga?: string;
            /** Format: decimal */
            precio: string;
            /**
             * Precio de Oferta
             * Format: decimal
             */
            precio_oferta?: string | null;
            /** Categoría */
            categoria?: number | null;
            readonly categoria_info: components["schemas"]["SimpleCategoria"];
            /** SKU (Stock Keeping Unit) */
            sku?: string;
            /** Cantidad en Stock */
            stock?: number;
            /** Activo */
            is_active?: boolean;
            /** Destacado (Home) */
            is_featured?: boolean;
            marca?: string | null;
            /** Tipo de Mascota */
            tipo_mascota?: (components["schemas"]["TipoMascotaEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            /** Slug del Producto */
            readonly slug: string;
        };
        Review: {
            readonly id: number;
            readonly user_name: string;
            rating: number;
            comment?: string;
            /** Format: date-time */
            readonly created_at: string;
        };
        SimpleCategoria: {
            readonly id: number;
            /** Nombre de la Categoría */
            readonly nombre: string;
            /** Slug de la Categoría */
            readonly slug: string;
        };
        /**
         * @description * `PENDING` - Pendiente
         *     * `PAID` - Pagado
         *     * `SHIPPED` - Enviado
         *     * `CANCELLED` - Cancelado
         * @enum {string}
         */
        StatusEnum: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
        StripeWebhookPayload: {
            id?: string;
            type: string;
            data: {
                [key: string]: unknown;
            };
        };
        /**
         * @description * `perro` - Perro
         *     * `gato` - Gato
         *     * `ave` - Ave
         *     * `roedor` - Roedor
         *     * `reptil` - Reptil
         *     * `otros` - Otros
         * @enum {string}
         */
        TipoMascotaEnum: "perro" | "gato" | "ave" | "roedor" | "reptil" | "otros";
        TokenObtainPair: {
            username: string;
            password: string;
            readonly access: string;
            readonly refresh: string;
        };
        TokenRefresh: {
            readonly access: string;
            refresh: string;
        };
        TokenVerify: {
            token: string;
        };
        UserActivityLog: {
            readonly id: number;
            action: string;
            details?: string | null;
            ip_address?: string | null;
            /** Format: date-time */
            readonly timestamp: string;
        };
        UserRegistration: {
            username: string;
            /**
             * Correo Electrónico
             * Format: email
             */
            email: string;
            password: string;
            password2: string;
            first_name?: string;
            last_name?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    carrito_cart_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CartItemMutation"];
                "application/x-www-form-urlencoded": components["schemas"]["CartItemMutation"];
                "multipart/form-data": components["schemas"]["CartItemMutation"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CartItemMutation"];
                "application/x-www-form-urlencoded": components["schemas"]["CartItemMutation"];
                "multipart/form-data": components["schemas"]["CartItemMutation"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_items_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_items_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CartItemMutation"];
                "application/x-www-form-urlencoded": components["schemas"]["CartItemMutation"];
                "multipart/form-data": components["schemas"]["CartItemMutation"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_items_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CartItemMutation"];
                "application/x-www-form-urlencoded": components["schemas"]["CartItemMutation"];
                "multipart/form-data": components["schemas"]["CartItemMutation"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    carrito_cart_items_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    cuentas_admin_users_list: {
        parameters: {
            query?: {
                /** @description Un término de búsqueda. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUser"][];
                };
            };
        };
    };
    cuentas_admin_users_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminUser"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminUser"];
                "multipart/form-data": components["schemas"]["AdminUser"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUser"];
                };
            };
        };
    };
    cuentas_admin_users_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserDetail"];
                };
            };
        };
    };
    cuentas_admin_users_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminUser"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminUser"];
                "multipart/form-data": components["schemas"]["AdminUser"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUser"];
                };
            };
        };
    };
    cuentas_admin_users_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    cuentas_admin_users_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedAdminUser"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedAdminUser"];
                "multipart/form-data": components["schemas"]["PatchedAdminUser"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUser"];
                };
            };
        };
    };
    cuentas_cambiar_contrasena_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChange"];
                "application/x-www-form-urlencoded": components["schemas"]["PasswordChange"];
                "multipart/form-data": components["schemas"]["PasswordChange"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageResponse"];
                };
            };
        };
    };
    cuentas_logout_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MessageResponse"];
                "application/x-www-form-urlencoded": components["schemas"]["MessageResponse"];
                "multipart/form-data": components["schemas"]["MessageResponse"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageResponse"];
                };
            };
        };
    };
    cuentas_perfil_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomUser"];
                };
            };
        };
    };
    cuentas_perfil_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CustomUser"];
                "application/x-www-form-urlencoded": components["schemas"]["CustomUser"];
                "multipart/form-data": components["schemas"]["CustomUser"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomUser"];
                };
            };
        };
    };
    cuentas_perfil_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    cuentas_perfil_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedCustomUser"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedCustomUser"];
                "multipart/form-data": components["schemas"]["PatchedCustomUser"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomUser"];
                };
            };
        };
    };
    cuentas_registro_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserRegistration"];
                "application/x-www-form-urlencoded": components["schemas"]["UserRegistration"];
                "multipart/form-data": components["schemas"]["UserRegistration"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserRegistration"];
                };
            };
        };
    };
    cuentas_restablecer_contrasena_confirmar_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordResetConfirm"];
                "application/x-www-form-urlencoded": components["schemas"]["PasswordResetConfirm"];
                "multipart/form-data": components["schemas"]["PasswordResetConfirm"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageResponse"];
                };
            };
        };
    };
    cuentas_restablecer_contrasena_solicitar_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordResetRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PasswordResetRequest"];
                "multipart/form-data": components["schemas"]["PasswordResetRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageResponse"];
                };
            };
        };
    };
    cuentas_token_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenObtainPair"];
                "application/x-www-form-urlencoded": components["schemas"]["TokenObtainPair"];
                "multipart/form-data": components["schemas"]["TokenObtainPair"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenObtainPair"];
                };
            };
        };
    };
    cuentas_token_refresh_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenRefresh"];
                "application/x-www-form-urlencoded": components["schemas"]["TokenRefresh"];
                "multipart/form-data": components["schemas"]["TokenRefresh"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenRefresh"];
                };
            };
        };
    };
    cuentas_token_verify_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenVerify"];
                "application/x-www-form-urlencoded": components["schemas"]["TokenVerify"];
                "multipart/form-data": components["schemas"]["TokenVerify"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenVerify"];
                };
            };
        };
    };
    pedidos_admin_orders_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"][];
                };
            };
        };
    };
    pedidos_admin_stats_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminDashboardStatsResponse"];
                };
            };
        };
    };
    pedidos_create_payment_intent_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreatePaymentIntentRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["CreatePaymentIntentRequest"];
                "multipart/form-data": components["schemas"]["CreatePaymentIntentRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePaymentIntentResponse"];
                };
            };
        };
    };
    pedidos_my_orders_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"][];
                };
            };
        };
    };
    pedidos_webhook_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StripeWebhookPayload"];
                "application/x-www-form-urlencoded": components["schemas"]["StripeWebhookPayload"];
                "multipart/form-data": components["schemas"]["StripeWebhookPayload"];
            };
        };
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No response body */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    productos_admin_categorias_list: {
        parameters: {
            query?: {
                /** @description Un número de página dentro del conjunto de resultados paginado. */
                page?: number;
                /** @description Número de resultados a devolver por página. */
                page_size?: number;
                /** @description Un término de búsqueda. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedCategoriaList"];
                };
            };
        };
    };
    productos_admin_categorias_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Categoria"];
                "application/x-www-form-urlencoded": components["schemas"]["Categoria"];
                "multipart/form-data": components["schemas"]["Categoria"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Categoria"];
                };
            };
        };
    };
    productos_admin_categorias_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Categoria"];
                };
            };
        };
    };
    productos_admin_categorias_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Categoria"];
                "application/x-www-form-urlencoded": components["schemas"]["Categoria"];
                "multipart/form-data": components["schemas"]["Categoria"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Categoria"];
                };
            };
        };
    };
    productos_admin_categorias_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    productos_admin_categorias_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedCategoria"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedCategoria"];
                "multipart/form-data": components["schemas"]["PatchedCategoria"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Categoria"];
                };
            };
        };
    };
    productos_admin_imagenes_list: {
        parameters: {
            query?: {
                /** @description Un número de página dentro del conjunto de resultados paginado. */
                page?: number;
                /** @description Número de resultados a devolver por página. */
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedImagenProductoAdminList"];
                };
            };
        };
    };
    productos_admin_imagenes_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["ImagenProductoAdmin"];
                "application/x-www-form-urlencoded": components["schemas"]["ImagenProductoAdmin"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImagenProductoAdmin"];
                };
            };
        };
    };
    productos_admin_imagenes_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImagenProductoAdmin"];
                };
            };
        };
    };
    productos_admin_imagenes_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["ImagenProductoAdmin"];
                "application/x-www-form-urlencoded": components["schemas"]["ImagenProductoAdmin"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImagenProductoAdmin"];
                };
            };
        };
    };
    productos_admin_imagenes_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    productos_admin_imagenes_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": components["schemas"]["PatchedImagenProductoAdmin"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedImagenProductoAdmin"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImagenProductoAdmin"];
                };
            };
        };
    };
    productos_admin_items_list: {
        parameters: {
            query?: {
                /** @description Un número de página dentro del conjunto de resultados paginado. */
                page?: number;
                /** @description Número de resultados a devolver por página. */
                page_size?: number;
                /** @description Un término de búsqueda. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedProductoCreateUpdateList"];
                };
            };
        };
    };
    productos_admin_items_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductoCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["ProductoCreateUpdate"];
                "multipart/form-data": components["schemas"]["ProductoCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoCreateUpdate"];
                };
            };
        };
    };
    productos_admin_items_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Producto"];
                };
            };
        };
    };
    productos_admin_items_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductoCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["ProductoCreateUpdate"];
                "multipart/form-data": components["schemas"]["ProductoCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoCreateUpdate"];
                };
            };
        };
    };
    productos_admin_items_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    productos_admin_items_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedProductoCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedProductoCreateUpdate"];
                "multipart/form-data": components["schemas"]["PatchedProductoCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoCreateUpdate"];
                };
            };
        };
    };
    productos_brands_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    productos_categorias_list: {
        parameters: {
            query?: {
                /** @description Un número de página dentro del conjunto de resultados paginado. */
                page?: number;
                /** @description Número de resultados a devolver por página. */
                page_size?: number;
                /** @description Un término de búsqueda. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedCategoriaList"];
                };
            };
        };
    };
    productos_categorias_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Categoria"];
                };
            };
        };
    };
    productos_items_list: {
        parameters: {
            query?: {
                /** @description Qué campo usar para ordenar los resultados. */
                ordering?: string;
                /** @description Un número de página dentro del conjunto de resultados paginado. */
                page?: number;
                /** @description Número de resultados a devolver por página. */
                page_size?: number;
                /** @description Un término de búsqueda. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedProductoList"];
                };
            };
        };
    };
    productos_items_reviews_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Review"];
                "application/x-www-form-urlencoded": components["schemas"]["Review"];
                "multipart/form-data": components["schemas"]["Review"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Review"];
                };
            };
        };
    };
    productos_items_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Producto"];
                };
            };
        };
    };
}

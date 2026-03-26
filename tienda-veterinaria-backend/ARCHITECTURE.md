# Architecture Overview - VetShop Backend

Este documento resume la arquitectura actual del backend tras la refactorización por fases.

## 1) Enfoque arquitectónico

El backend está organizado por **features** y cada módulo sigue una estructura en capas:

- `views.py` → capa HTTP (controladores delgados)
- `serializers.py` → validación/transformación de datos
- `services.py` → lógica de negocio y transacciones
- `selectors.py` → consultas ORM reutilizables/optimizadas
- `exceptions.py` → errores tipados por dominio

## 2) Módulos de dominio

- `usuarios`: autenticación JWT, perfil, administración de usuarios.
- `productos`: categorías, catálogo, reseñas, media.
- `carrito`: carrito anónimo y autenticado, merge por sesión.
- `pedidos`: checkout, integración Stripe, órdenes y métricas admin.

## 3) Flujo de request (alto nivel)

1. Cliente frontend consume endpoint REST.
2. `view` valida request y delega al `service`.
3. `service` ejecuta reglas de negocio y usa `selectors`.
4. Si ocurre un error de dominio, se lanza excepción tipada.
5. `view` transforma resultado/excepción a respuesta HTTP.

## 4) Integración frontend-backend

- Autenticación por Bearer JWT.
- Carrito anónimo con header `X-Cart-Session`.
- Checkout con Stripe PaymentIntent (`/api/pedidos/create-payment-intent/`).
- Confirmación de pago por webhook Stripe (`/api/pedidos/webhook/`).

## 5) Integraciones externas

- **PostgreSQL**: persistencia principal.
- **Stripe**: cobro y verificación de eventos de pago.
- **Cloudinary**: almacenamiento de media.
- **SMTP/Email backend**: notificaciones (ej. confirmación de compra).

## 6) Objetivos logrados con el refactor

- Separación de responsabilidades por capa.
- Menor acoplamiento entre módulos.
- Mejor mantenibilidad y testabilidad.
- Mejoras de performance por centralización de queries.
- Base más segura para evolucionar reglas de negocio.

## 7) Siguientes mejoras recomendadas

- Exponer documentación OpenAPI/Swagger formal (`/api/schema` + `/api/docs`).
- Endurecer políticas de throttling por endpoint crítico.
- Añadir ADRs (Architecture Decision Records) para decisiones futuras.

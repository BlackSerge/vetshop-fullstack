# Tienda Veterinaria Frontend

Aplicación frontend de la tienda veterinaria construida con **React + Vite + TypeScript**, organizada por features y conectada al backend vía API REST.

## Stack tecnológico

- React 19
- Vite 7
- TypeScript
- React Router
- React Query
- Zustand
- Axios
- Tailwind CSS
- Stripe JS (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- Vitest + Testing Library

## Instalación

```bash
npm install
```

## Configuración de entorno

Opcionalmente puedes crear `.env.local` para definir la URL base del backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Si no defines esta variable, el cliente Axios usa detección automática (localhost, IP local o `/api`).

## Scripts principales

```bash
npm run dev       # entorno desarrollo
npm run build     # build producción
npm run preview   # previsualizar build
npm run lint      # linting
npm run test      # tests interactivos
npm run coverage  # tests con cobertura
```

## Estructura base

```text
src/
  features/
    auth/          # login, registro, perfil, recuperación de contraseña
    products/      # listado, detalle, filtros, reviews
    cart/          # carrito, checkout, success
    admin/         # dashboard y gestión administrativa
  shared/
    api/           # cliente Axios e interceptores
    components/    # layout y UI reutilizable
    store/         # estado global compartido
  pages/           # Home y NotFound
  utils/           # utilidades de formato/errores
```

## Flujo funcional

- Navegación pública: home, productos, detalle, carrito.
- Navegación privada: perfil, cambio de contraseña, checkout.
- Navegación admin: panel, productos, categorías, usuarios.
- Integración con pagos: se solicita `clientSecret` al backend para iniciar Stripe Checkout.

## Build

```bash
npm run build
```

Los artefactos se generan en `dist/`.

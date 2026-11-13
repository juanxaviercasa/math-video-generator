# Fase 4 — Calidad y release

## Entregado

- `ErrorBoundary` global con pantalla de recuperación y detalles técnicos expandibles.
- Enlace de salto al contenido principal y `main` navegable por teclado.
- Estados de foco visibles para enlaces, botones, campos y selectores.
- Estado de API anunciado mediante `role="status"` y `aria-live`.
- Política CSP para el frontend publicado en Cloudflare Pages.
- Eliminación de los dos warnings heredados de aserciones no nulas del backend.
- Build del frontend copia `_headers` y `_redirects` a `frontend/dist`.

## Checks de release

```bash
npm run lint
npm run type-check --workspace frontend
npm run build --workspace backend
npm run build --workspace frontend
```

El CI también genera Prisma antes de ejecutar las pruebas del backend. Las variables de base de datos y Redis siguen siendo requisitos del entorno de producción, no del build estático del frontend.

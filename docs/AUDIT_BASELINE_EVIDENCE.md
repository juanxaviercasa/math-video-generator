# Evidencia de línea base de auditoría

Fecha de auditoría: 2026-08-19.

## Estado Git

- Rama: `improvements/production-mvp`.
- Estado: limpio al momento de la comprobación.

## Dependencias y build

- El monorepo usa scripts `npm` y `package-lock.json` en la raíz.
- `backend/package.json` declara `bull`, `redis`, `@prisma/client` y Prisma, pero la implementación auditada de jobs usa mapas en memoria y `setImmediate`.
- `deploy/Dockerfile` ejecuta `pnpm install --frozen-lockfile`, aunque no se encontró `pnpm-lock.yaml` en la estructura revisada.
- Solo se encontró `deploy/Dockerfile`; `deploy/docker-compose.yml` referencia `frontend/Dockerfile`, que no fue encontrado en la comprobación de archivos.
- El Dockerfile de runtime Node Alpine copia backend compilado y dependencias, pero no instala Manim, Python, FFmpeg, FFprobe, LaTeX ni `edge-tts`.

## Verificaciones ejecutadas

- `npm test`: 54 pruebas aprobadas, 0 fallos.
- `npm run build:backend`: aprobado.
- `npm run build:frontend`: aprobado.
- Vite emitió advertencia de bundle grande: `mathlive` genera un chunk minificado de aproximadamente 783 kB y el bundle supera el umbral recomendado de 500 kB.

## Interpretación

La línea base indica que la calidad de compilación y las pruebas unitarias actuales son buenas para los módulos cubiertos, pero no prueban despliegue real, disponibilidad de dependencias multimedia, persistencia de jobs, seguridad de archivos, sincronización audiovisual ni recuperación ante reinicios. El éxito de 54 pruebas no contradice los riesgos de integración y operación detectados.

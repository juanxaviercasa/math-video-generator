# Puesta en marcha de Math Video Generator

Este documento describe la configuración mínima para ejecutar el proyecto con generación real, cuentas de usuario y biblioteca persistente. El modo demo está desactivado por defecto y no debe activarse en producción.

## Componentes requeridos

| Componente | Uso | Verificación |
|---|---|---|
| Node.js 22 o compatible | Frontend y backend | `node --version` |
| PostgreSQL | Usuarios, trabajos y biblioteca | `DATABASE_URL` válido |
| FFmpeg | Procesamiento, audio, miniaturas y metadatos | `ffmpeg -version` |
| Manim | Render matemático | `manim --version` |
| Un proveedor de IA | Pasos y narración opcionales | Clave en `.env` |

## Configuración local

Copia `.env.example` a `.env` y reemplaza los valores sensibles. `JWT_SECRET` debe ser una cadena aleatoria de al menos 32 caracteres. `APP_URL` debe coincidir con el origen real del frontend; en desarrollo normalmente es `http://localhost:5173`.

```bash
cp .env.example .env
npm ci
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
```

Si `npm ci` se ejecuta en un entorno que bloquea scripts de instalación, la generación de Prisma debe ejecutarse manualmente. El backend puede compilar sin el cliente generado para permitir trabajo de interfaz, pero el registro, login y biblioteca requieren que Prisma esté generado y que PostgreSQL esté disponible.

## Ejecución

```bash
npm run dev:backend
npm run dev:frontend
```

La API queda disponible en `http://localhost:3001` y el frontend en `http://localhost:5173`. Antes de probar generación real, confirma que `/health` responde y que FFmpeg y Manim son detectables por el proceso backend.

## Verificación antes de entregar

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```

La auditoría actual mantiene vulnerabilidades moderadas heredadas de dependencias transitorias. No se recomienda ejecutar `npm audit fix --force` sin revisar el cambio de versión de Bull y React Router, porque puede introducir incompatibilidades.

## Criterios de aceptación de producción

La cuenta debe poder registrarse, iniciar sesión y cerrar sesión usando una cookie HttpOnly. Una solicitud de generación debe devolver HTTP 202, mostrar progreso y terminar únicamente si existen el MP4 y la miniatura. Un video completado debe tener URLs bajo `/media`, no rutas absolutas del sistema. La biblioteca debe mostrar únicamente trabajos del usuario autenticado y conservarlos después de reiniciar el backend mediante PostgreSQL.

La configuración definitiva todavía debe incorporar almacenamiento duradero para archivos multimedia. Mientras los artefactos vivan en `/tmp`, un reinicio o limpieza del servidor puede eliminarlos aunque los metadatos permanezcan en la base de datos.

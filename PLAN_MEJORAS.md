# Plan de mejoras hacia un producto sólido

## Objetivo

Convertir Math Video Generator desde un prototipo local en un producto confiable para docentes y tutores: genera microlecciones matemáticas verificables, editables, accesibles y reutilizables.

## Orden de ejecución

| Fase | Objetivo | Condición para avanzar |
|---|---|---|
| 1 | Línea base segura y trazabilidad | Rama de trabajo, auditoría guardada y compilación base confirmada. |
| 2 | Contratos, validación y errores | Toda entrada inválida se rechaza con respuesta estructurada y la UI explica el problema. |
| 3 | Pipeline honesto y confiable | Nunca se declara éxito sin MP4 y miniatura válidos; dependencias y fallos son visibles. |
| 4 | Trabajos asíncronos, persistencia y autenticación | Un trabajo sobrevive a un reinicio y cada video pertenece a un usuario. |
| 5 | Corrección matemática y editor | El usuario puede revisar y editar un guion estructurado antes de renderizar. |
| 6 | Biblioteca, accesibilidad y exportación | El video se puede reproducir, buscar, descargar, compartir y consumir con accesibilidad básica. |
| 7 | Seguridad, costos, pruebas y despliegue | Hay límites, observabilidad, CI, dependencias revisadas y despliegue reproducible. |
| 8 | Validación del producto | El flujo se prueba con usuarios objetivo y se mide el valor real. |

## Reglas de trabajo

Cada cambio debe ser pequeño, verificable y acompañado por una prueba o una comprobación manual reproducible. No se avanzará de fase si la anterior deja errores conocidos sin documentar. Se conservará una rama de trabajo separada de `main` y se harán commits frecuentes con mensajes descriptivos.

## Primer incremento de producto

La primera intervención funcional será estabilizar el contrato de `POST /api/generate-video` y el componente de generación: validación estricta, valores permitidos, respuestas de error consistentes, protección de botones dentro del formulario y estados de polling que no oculten fallos. Después se verificará con compilación, prueba de API y prueba de interfaz.

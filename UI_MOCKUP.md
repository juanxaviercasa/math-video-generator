## 🎬 Estructura de la Interfaz Actualizada

```
┌─────────────────────────────────────────────────────────────────┐
│                     GENERAR NUEVO VIDEO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 Título del Video                                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Ej: Resolver ecuaciones cuadráticas                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📐 Contenido Matemático                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Ej: x² - 5x + 6 = 0                                   │  │
│  │ Factorizar: (x-2)(x-3)=0                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📹 Calidad del Video                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ▼ Media (1080p)                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ 🎙️ Narración en Voz                                     ┃  │
│  ┃ ☑️  Añade una voz en off didáctica explicando cada     ┃  │
│  ┃     paso matemático                                     ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                 │
│  🤖 Proveedor de IA (para narración y análisis)              │
│  ┌─────────────────┬──────────────────┬──────────────┐      │
│  │ 🚀 OpenRouter   │  ✨ Gemini       │  🔧 OpenAI   │      │
│  │   (Gratis)      │    (Gratis)      │  (Pago)      │      │
│  └─────────────────┴──────────────────┴──────────────┘      │
│  OpenRouter y Gemini tienen opciones gratis. OpenAI          │
│  requiere crédito pagado.                                     │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ 🎨 ComfyUI (Fondos)                                     ┃  │
│  ┃ ☐  Añade fondos y escenas visuales generadas por IA    ┃  │
│  ┃     (opcional)                                          ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                 │
│              ┌────────────────────────────────┐               │
│              │  🎬 Generar Video              │               │
│              └────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Vista Responsiva (Mobile)

```
┌──────────────────────┐
│ GENERAR NUEVO VIDEO  │
├──────────────────────┤
│                      │
│ Título del Video     │
│ [input field]        │
│                      │
│ Contenido Matemático │
│ [textarea]           │
│                      │
│ Calidad              │
│ [dropdown]           │
│                      │
│ ┏━━━━━━━━━━━━━━━━━┓ │
│ ┃ 🎙️ Narración    ┃ │
│ ┃ ☑️ Habilitada   ┃ │
│ ┗━━━━━━━━━━━━━━━━━┛ │
│                      │
│ Proveedor IA         │
│ [🚀] [✨] [🔧]      │
│                      │
│ ┏━━━━━━━━━━━━━━━━━┓ │
│ ┃ 🎨 ComfyUI      ┃ │
│ ┃ ☐ Deshabilitado ┃ │
│ ┗━━━━━━━━━━━━━━━━━┛ │
│                      │
│ [Generar Video]      │
│                      │
└──────────────────────┘
```

## 🎨 Esquema de Colores

- **Fondo principal**: `slate-800`
- **Bordes**: `slate-700`
- **Texto principal**: `white`
- **Texto secundario**: `slate-400`
- **Botón activo**: `blue-600`
- **Botón hover**: `blue-700`
- **Fondo alterno**: `slate-700/50`

## ✨ Características de UX

### Estados Visuales
1. **Estado normal**: Todos los controles habilitados, valores por defecto seleccionados
2. **Estado loading**: Todos los inputs deshabilitados, botón muestra spinner
3. **Estado error**: Alerta roja arriba del formulario

### Validaciones
- Título requerido (no vacío)
- Contenido requerido (no vacío)
- Al menos uno de los campos debe tener contenido válido

### Feedback al Usuario
- Barra de progreso en tiempo real (polling cada 1.5s)
- Mensaje de estado actualizado
- URL del video disponible cuando está completado

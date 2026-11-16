# Especificación Técnica de Tipografía y Zonas Seguras para Videos Virales Matemáticos (9:16)

## Contexto y Justificación
En videos verticales para redes sociales (TikTok, Shorts, Reels), el espectador visualiza el contenido en pantallas de smartphones de 6.1 a 6.7 pulgadas. 
Dejar ecuaciones matemáticas con fuentes pequeñas (menos de 22pt) en el centro de tarjetas grandes genera sensación de letra pequeña de documento académico, forzando la vista del usuario y provocando abandono del video.

Por tanto, este estándar define el aprovechamiento óptimo de escala tipográfica y márgenes seguros.

---

## Dimensiones del Canvas Manim (9:16 Vertical)
```python
config.pixel_width = 720
config.pixel_height = 1280
config.frame_rate = 30
config.background_color = "#F6F3EC"  # Estilo Paper Craft / Papiro cálido

self.camera.frame_width = 9.0
self.camera.frame_height = 16.0
```

---

## 1. Zonas Seguras y Distribución Vertical
| Zona | Rango Coordenadas Manim | Función / Restricción de Interfaz |
| :--- | :--- | :--- |
| **Peligro Superior** | $Y > +4.8$ | Notch, cámara frontal, batería, señal, barra de búsqueda |
| **Top Badge Fijo** | $Y \in [4.0, 4.75]$ | Header de categoría (`OLIMPIADA MATEMÁTICA`, etc.) |
| **Área Central Activa** | $Y \in [-2.85, 4.0]$ | Tarjetas de contenido, gráficas interactivas, deducciones |
| **Peligro Inferior** | $Y < -3.0$ | Subtítulos automáticos, username, caption, selector de audio |
| **Peligro Lateral Derecho** | $X > +3.3$ | Botones de Like, Comentarios, Guardar, Compartir |
| **Peligro Lateral Izquierdo** | $X < -3.7$ | Borde de pantalla |

---

## 2. Geometría Estándar de Tarjetas
- **Centro Horizontal:** $X = -0.2$ o $-0.25$ (desplazado levemente a la izquierda para compensar la columna de botones de TikTok).
- **Ancho:** `7.0` a `7.2` unidades.
- **Radio de esquina (`corner_radius`):** `0.20` a `0.25`.
- **Grosor de borde (`stroke_width`):** `2.2` a `2.5`.

---

## 3. Escala y Dimensionamiento de Textos y Fórmulas
1. **Series o Fórmulas Horizontales Largas:**
   Utilizar `mob.set_width(card.width * 0.90)` (típicamente `6.4` a `6.6` unidades).
   ```python
   prob_seq = MathTex(r"3^3 - 3, \;\; 5^5 - 5, \;\; \dots, \;\; 2007^{2007} - 2007", color="#1B2631")
   prob_seq.set_width(6.5)
   ```
2. **Resultados e Hitos Matemáticos:**
   - Ecuaciones de un solo renglón: `font_size=42` a `54 pt`.
   - Ejemplo: `MathTex(r"\mathbf{M.C.D.} = \mathbf{24}", font_size=54, color="#196F3D")`.
3. **Encabezados Internos de Tarjeta:**
   - `font_size=23` a `26 pt`, peso `BOLD`.
4. **Badges de Propiedades o Pasos:**
   - Ancho: `6.5` a `6.8` unidades.
   - Centrado explícito: `badge.set_x(card_parent.get_x())`.
   - Texto: `badge_txt.set_width(badge.width * 0.92)` o `font_size=22 - 24 pt`.

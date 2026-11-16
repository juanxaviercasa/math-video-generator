# Reglas Obligatorias de Diseño y Tipografía para Videos Virales (9:16)

Este documento contiene las reglas de diseño, maquetación, zonas seguras y tipografía que **DEBEN SEGUIRSE OBLIGATORIAMENTE** en todos los videos matemáticos modelados y renderizados para formato vertical (TikTok, YouTube Shorts, Instagram Reels).

---

## 1. Regla de Oro: Aprovechamiento Total de Tarjetas y Dinamismo Visual (Sin Apretujamientos)
- **Nunca comprimir o aplastar la gráfica:** Las curvas y parábolas deben tener altura suficiente (`y_length >= 3.5` a `3.8` en Manim) para mostrar su curvatura geométrica real y profunda. Nunca aplastar una gráfica para forzar que quepan todos los textos estáticos simultáneamente.
- **Narrativa y Evolución Dinámica de Pantalla:** No es necesario mantener toda la información en pantalla fija. Conforme avanza la deducción matemática, los pasos previos pueden ir **desapareciendo o desplazándose hacia arriba**, permitiendo que:
  - La gráfica se mantenga grande, clara y espaciosa en la parte central.
  - La ecuación principal suba a la parte superior libre ($Y \approx +4.25$, eliminando badges introductorios redundantes durante la lección).
  - La tarjeta de deducción inferior muestre únicamente los 1 a 3 pasos activos con **tipografía gigante (30 pt - 32 pt)**, garantizando legibilidad total en pantallas de celular sin saturar la vista.
- **Aprovechamiento de Ancho:** Las fórmulas matemáticas y deducciones activas deben ocupar entre el **85% y 92% del ancho disponible** de la tarjeta contenedora (`mobject.set_width(card.width * 0.90)` o `card.width * 0.88`).
- **Márgenes de Respiro Internos:** Dejar un acolchado (padding) de entre `0.3` y `0.4` unidades respecto a los bordes laterales de la tarjeta.
- **Centrado Estricto:** Los badges secundarios y llamadas deben centrarse explícitamente o situarse con holgura natural respecto a las curvas.

---

## 2. Escala Tipográfica para Pantallas de Celular
En pantallas móviles (resolución vertical 720x1280 o 1080x1920 con canvas Manim de 9.0x16.0):
- **Encabezados Principales / Badges Superiores:** `21 pt - 25 pt` (negrita BOLD).
- **Títulos de Tarjetas / Subtemas:** `22 pt - 26 pt` (negrita BOLD).
- **Fórmulas y Ecuaciones Clave:**
  - Si es una fórmula larga (ej. series de olimpiada): `prob_seq.set_width(6.4)` a `6.6` unidades.
  - Si es un resultado o ecuación central: `font_size=42` a `54 pt` (ej. $3^3 - 3 = \mathbf{24}$, $\mathbf{M.C.D.} = \mathbf{24}$).
- **Textos Explicativos y Pasos:** `20 pt - 24 pt`.
- **Badges de Reglas y Propiedades:** Ancho de `6.6` a `7.0` unidades, con texto ajustado a `set_width(badge.width * 0.90)` o en 2 líneas si excede los 45 caracteres.

---

## 3. Zonas Seguras Estrictas y Distribución Vertical Completa (Safe Zones 9:16)
- **Aprovechamiento Vertical Total (Cero Huecos Muertos Inferiores ni Etiquetas Pegadas):**
  - **Badges Flotantes de Variables (`a, b, c` o áreas):** $Y \approx +6.80$ (altura `0.66`, grandes y visibles por encima de la tarjeta de ecuación).
  - **Tarjeta de Ecuación Protagonista (`eq_box`):** Centro en $Y \approx +5.62$ (altura `1.44`, borde inferior en $Y \approx +4.90$).
  - **Zona Central (Gráfica o Figura Geométrica + Llaves/Cotas):** $Y \in [-1.15, +4.38]$.
    - **Regla Anti-Colisión Superior:** Dejar un **margen mínimo obligatorio de $\ge 0.50$ unidades** de aire limpio entre cualquier cota/etiqueta superior de la figura (ej. $\frac{b}{2a}$ o corte en el eje $Y$) y el borde inferior de `eq_box` ($Y = +4.90$). Nunca pegar una fracción al borde del recuadro superior.
    - **Regla Anti-Colisión Inferior:** Dejar un **margen mínimo obligatorio de $\ge 0.55$ unidades** de aire limpio entre cualquier llave o etiqueta inferior de la figura (ej. $x + \frac{b}{2a}$) y el borde superior de la tarjeta de deducción (`card_ded`).
  - **Tarjeta de Deducción Inferior (`card_ded`):** Centro en $Y \approx -3.45$ (altura `3.40`, rango $Y \in [-5.15, -1.75]$). Esto aprovecha el espacio inferior del lienzo `9.0 x 16.0` sin dejar bloques vacíos desaprovechados abajo, manteniéndose libre del caption nativo de TikTok/Shorts.
- **Límites Laterales:** $X \in [-3.7, +3.3]$ (libre de botones nativos de la derecha: like, comentar, guardar, compartir).
- **Ancho Estándar de Tarjetas:** `7.0` a `7.2` unidades con centro en $X = -0.2$ o $-0.25$.

---

## 4. Regla de Retención y Marca (Curiosidad al Inicio, Marca al Final)
- **Cero Menciones de Marca en el Gancho Inicial (Primeros 15s):** Al inicio del video (tanto en voz en off como en el badge superior) **NUNCA** se debe mencionar el nombre del canal (`Zénit Matemática` o `Zénit Ciencia`). Los primeros segundos deben dedicarse al **100% a despertar curiosidad o cuestionar un mito escolar** (ej. `"EL SECRETO QUE NO TE ENSEÑARON"`, *"En la escuela nos obligan a memorizar..., pero casi nadie nos dice por qué..."*).
- **Identidad de Marca Exclusiva en el Cierre (Outro / CTA):** El nombre y logotipo giratorio de **`ZÉNIT MATEMÁTICA`** o **`ZÉNIT CIENCIA`** deben aparecer **únicamente en la tarjeta de cierre final**, justo después de haber entregado toda la revelación visual cuando el espectador quiere seguir la cuenta.

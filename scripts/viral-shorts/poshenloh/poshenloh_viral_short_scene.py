# -*- coding: utf-8 -*-
"""
=============================================================================
PROYECTO: SHORT VIRAL DE MATEMÁTICAS - MÉTODO DE PO-SHEN LOH (2019) [VERSIÓN 2.0]
FORMATO: 9:16 VERTICAL (TIKTOK / YOUTUBE SHORTS / REELS)
CUMPLIMIENTO ESTRICTO DE MARCOS Y ZONAS SEGURAS (SAFE ZONES):
  - Margen Superior: Y <= +4.8 (libre de notch, batería y buscador)
  - Margen Inferior: Y >= -3.0 (libre de pie de página, caption, username y botones)
  - Margen Lateral:  X in [-3.7, +3.3] (libre de botones de like, comentario y compartir)
TIPOGRAFÍA MAXIMIZADA PARA MÓVIL:
  - Fórmulas y ecuaciones ampliadas con escala uniforme (font_size=27-46pt).
  - Contención matemática total sin rozar bordes.
DURACIÓN EXACTA: 172.87 SEGUNDOS (Sincronizado con narration_poshenloh.mp3)
MOTOR: MANIM COMMUNITY v0.22.1 + MIKTEX
=============================================================================
"""

import os
import sys
from pathlib import Path
import numpy as np

# Inyectar MiKTeX en el PATH del sistema para renderizado nativo de MathTex
for _miktex_bin in (
    Path.home() / "AppData" / "Local" / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64",
    Path(r"C:\Program Files\MiKTeX\miktex\bin\x64"),
):
    if _miktex_bin.exists() and str(_miktex_bin) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(_miktex_bin) + os.pathsep + os.environ.get("PATH", "")

from manim import *

# Configuración 9:16 Vertical
config.pixel_width = 720
config.pixel_height = 1280
config.frame_rate = 30
config.background_color = "#F6F3EC"  # Papel marfil / Paper Craft cálido

class PoShenLohViralShort(Scene):
    def construct(self):
        # Configuración de cámara para canvas vertical 9:16
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Helper para sincronización estricta con marcas de audio
        def sync_to(target_time):
            current = self.time
            dt = target_time - current
            if dt > 0.02:
                self.wait(dt)

        # -------------------------------------------------------------
        # CAPA BASE: Cuadrícula milimetrada sutil (Estilo Paper Craft)
        # -------------------------------------------------------------
        grid_group = VGroup()
        for gx in np.arange(-4.0, 4.5, 1.0):
            line = Line(
                start=np.array([gx, -8.0, 0]),
                end=np.array([gx, 8.0, 0]),
                stroke_color="#E7E2D5",
                stroke_width=1.0,
                stroke_opacity=0.7
            )
            grid_group.add(line)
        for gy in np.arange(-7.5, 8.0, 1.0):
            line = Line(
                start=np.array([-4.5, gy, 0]),
                end=np.array([4.5, gy, 0]),
                stroke_color="#E7E2D5",
                stroke_width=1.0,
                stroke_opacity=0.7
            )
            grid_group.add(line)
        self.add(grid_group)

        # =============================================================
        # ACTO 1: EL GANCHO HISTÓRICO Y LA RUPTURA (0.00s - 28.76s)
        # =============================================================
        # 0.00s - 9.82s: 4000 años memorizando la fórmula monstruosa o adivinando
        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("EL MITO DE LOS 4.000 AÑOS", font_size=23, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())

        card_fg = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.4,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 2.45, 0]))
        card_fg_title = Text("1. FÓRMULA GENERAL (Monstruosa)", font_size=23, weight=BOLD, color="#7B241C").next_to(card_fg.get_top(), DOWN, buff=0.25)
        card_fg_math = MathTex(r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}", font_size=42, color="#1B2631").next_to(card_fg_title, DOWN, buff=0.25)

        card_tanteo = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.4,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -0.45, 0]))
        card_tanteo_title = Text("2. ASPA SIMPLE / TANTEO", font_size=23, weight=BOLD, color="#7B241C").next_to(card_tanteo.get_top(), DOWN, buff=0.25)
        card_tanteo_math = MathTex(r"(x - ?)(x - ?) = 0 \quad \text{[Adivinar a ciegas]}", color="#1B2631")
        card_tanteo_math.set_width(6.5)
        card_tanteo_math.next_to(card_tanteo_title, DOWN, buff=0.28)

        intro_group = VGroup(top_badge, top_badge_txt, card_fg, card_fg_title, card_fg_math, card_tanteo, card_tanteo_title, card_tanteo_math)
        self.play(FadeIn(intro_group), run_time=1.5)

        # 5.2s: Cruces rojas eliminando los métodos tradicionales
        sync_to(5.2)
        cross1 = VGroup(
            Line(card_fg.get_corner(UL) + RIGHT*0.4 + DOWN*0.2, card_fg.get_corner(DR) + LEFT*0.4 + UP*0.2, stroke_color="#C0392B", stroke_width=6.0),
            Line(card_fg.get_corner(DL) + RIGHT*0.4 + UP*0.2, card_fg.get_corner(UR) + LEFT*0.4 + DOWN*0.2, stroke_color="#C0392B", stroke_width=6.0)
        )
        cross2 = VGroup(
            Line(card_tanteo.get_corner(UL) + RIGHT*0.4 + DOWN*0.2, card_tanteo.get_corner(DR) + LEFT*0.4 + UP*0.2, stroke_color="#C0392B", stroke_width=6.0),
            Line(card_tanteo.get_corner(DL) + RIGHT*0.4 + UP*0.2, card_tanteo.get_corner(UR) + LEFT*0.4 + DOWN*0.2, stroke_color="#C0392B", stroke_width=6.0)
        )
        tag_obsoleto = RoundedRectangle(
            corner_radius=0.18, width=5.6, height=0.85,
            stroke_color="#922B21", stroke_width=2.5,
            fill_color="#C0392B", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.30, 0]))
        tag_obsoleto_txt = Text("¡INNECESARIO! ❌", font_size=24, weight=BOLD, color=WHITE).move_to(tag_obsoleto.get_center())

        self.play(Create(cross1), Create(cross2), FadeIn(tag_obsoleto), FadeIn(tag_obsoleto_txt), run_time=1.2)

        # 9.82s: Transición a Po-Shen Loh (2019)
        sync_to(9.82)
        self.play(
            FadeOut(intro_group), FadeOut(cross1), FadeOut(cross2), FadeOut(tag_obsoleto), FadeOut(tag_obsoleto_txt),
            run_time=0.8
        )

        badge_poshen = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=5.2,
            stroke_color="#1F618D", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.8, 0]))

        badge_header = RoundedRectangle(
            corner_radius=0.15, width=6.8, height=0.65,
            stroke_color="#1B4F72", stroke_width=1.8,
            fill_color="#EBF5FB", fill_opacity=0.95
        ).move_to(badge_poshen.get_top() + DOWN * 0.50)
        badge_header_txt = Text("REVOLUCIÓN MATEMÁTICA (2019)", font_size=21, weight=BOLD, color="#1B4F72").move_to(badge_header.get_center())

        poshen_name = Text("Prof. Po-Shen Loh", font_size=32, weight=BOLD, color="#154360").next_to(badge_header, DOWN, buff=0.40)
        poshen_univ = Text("Carnegie Mellon University", font_size=21, slant=ITALIC, color="#5D6D7E").next_to(poshen_name, DOWN, buff=0.18)
        poshen_secret = Text("El Atajo Visual por Simetría", font_size=25, weight=BOLD, color="#D35400").next_to(poshen_univ, DOWN, buff=0.35)

        poshen_bullets = VGroup(
            Text("• Cero fórmulas complejas de memoria", font_size=20, color="#2C3E50"),
            Text("• Cero tanteos ni adivinanzas a ciegas", font_size=20, color="#2C3E50"),
            Text("• Funciona con cualquier ecuación", font_size=20, color="#2C3E50")
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).next_to(poshen_secret, DOWN, buff=0.30)

        poshen_group = VGroup(badge_poshen, badge_header, badge_header_txt, poshen_name, poshen_univ, poshen_secret, poshen_bullets)
        self.play(FadeIn(poshen_group), run_time=1.2)

        # 18.47s - 28.76s: Promesa de 2 minutos
        sync_to(18.47)
        card_promesa = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.35,
            stroke_color="#27AE60", stroke_width=2.5,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.40, 0]))
        promesa_title = Text("EN LOS PRÓXIMOS 2 MINUTOS:", font_size=21, weight=BOLD, color="#196F3D").next_to(card_promesa.get_top(), DOWN, buff=0.20)
        promesa_math = Text("Aprenderás a resolver cuadráticas con simetría.", font_size=19, color="#1E8449").next_to(promesa_title, DOWN, buff=0.18)
        promesa_group = VGroup(card_promesa, promesa_title, promesa_math)
        self.play(FadeIn(promesa_group), run_time=1.0)

        # =============================================================
        # ACTO 2: MONTAJE DEL ESCENARIO VISUAL (28.76s - 55.32s)
        # =============================================================
        # 28.76s: Presentación de la ecuación x^2 - 6x + 5 = 0
        sync_to(28.76)
        self.play(FadeOut(poshen_group), FadeOut(promesa_group), run_time=0.8)

        # Zona Superior Fija: Ecuación Protagonista (Elevada y Centrada a la perfección)
        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=0.96,
            stroke_color="#2C3E50", stroke_width=2.6,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 5.48, 0]))
        eq_text = MathTex("x^2", "-", "6x", "+", "5", "=", "0", font_size=54, color="#1B2631").move_to(eq_box.get_center())

        self.play(Create(eq_box), Write(eq_text), run_time=1.2)

        # 34.10s: La curva perfecta: La Parábola (GRÁFICA GIGANTE, AMPLIA, CORTE EN Y = 5)
        sync_to(34.10)
        axes = Axes(
            x_range=[-0.8, 6.8, 1],
            y_range=[-4.5, 5.5, 1],
            x_length=6.6,
            y_length=5.4,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.5,
                "include_tip": True,
                "tip_width": 0.16,
                "tip_height": 0.16,
            },
        ).move_to(np.array([-0.10, 2.05, 0]))

        # NÚMEROS DE EJES GRANDES (font_size = 28)
        axes.get_x_axis().add_numbers([2, 4, 6], font_size=28, color="#2C3E50")
        tick_3 = MathTex(r"3", font_size=28, color="#C0392B").next_to(axes.c2p(3, 0), DOWN, buff=0.16).shift(LEFT * 0.16)
        axes.get_y_axis().add_numbers([5, -4], font_size=26, color="#2C3E50")

        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[0.0, 6.0],
            color="#E67E22",
            stroke_width=5.0,
        )

        dot_y_intercept = Dot(axes.c2p(0, 5), color="#D35400", radius=0.15)
        lbl_y_intercept = MathTex(r"(0, 5)", font_size=26, color="#D35400").next_to(dot_y_intercept, RIGHT, buff=0.18)

        tag_curva = MathTex(r"\mathbf{y = x^2 - 6x + 5}", font_size=28, color="#D35400").move_to(axes.c2p(4.7, 3.3))
        curve_arrow = Arrow(
            start=tag_curva.get_bottom() + DOWN*0.06,
            end=axes.c2p(5.2, 1.8),
            color="#D35400",
            stroke_width=3.2,
            buff=0.10
        )

        self.play(FadeIn(axes), FadeIn(tick_3), run_time=1.0)
        self.play(Create(parabola), FadeIn(dot_y_intercept), FadeIn(lbl_y_intercept), FadeIn(tag_curva), Create(curve_arrow), run_time=1.8)

        # 40.40s: Cortar el suelo (el eje X donde y = 0)
        sync_to(40.40)
        ground_line = Line(
            start=axes.c2p(-0.6, 0),
            end=axes.c2p(6.4, 0),
            color="#27AE60",
            stroke_width=3.8
        )
        ground_label = Text("Suelo (y = 0)", font_size=21, weight=BOLD, color="#1E8449").next_to(axes.c2p(0.3, 0), UP, buff=0.15)

        dot_q1 = Dot(axes.c2p(1, 0), color="#E67E22", radius=0.14)
        dot_q2 = Dot(axes.c2p(5, 0), color="#E67E22", radius=0.14)
        q1_label = MathTex(r"?", font_size=30, color="#C0392B").next_to(dot_q1, DOWN, buff=0.16)
        q2_label = MathTex(r"?", font_size=30, color="#C0392B").next_to(dot_q2, DOWN, buff=0.16)

        self.play(Create(ground_line), FadeIn(ground_label), run_time=1.0)
        self.play(FadeIn(dot_q1), FadeIn(dot_q2), FadeIn(q1_label), FadeIn(q2_label), run_time=1.0)

        # 49.17s: El error tradicional
        sync_to(49.17)
        card_tanteo_warn = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.45,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.10, 0]))
        warn_title = Text("ERROR TRADICIONAL:", font_size=20, weight=BOLD, color="#922B21").next_to(card_tanteo_warn.get_top(), DOWN, buff=0.20)
        warn_desc = Text("Buscar dos raíces desconectadas por pura adivinanza.", font_size=19, color="#7B241C").next_to(warn_title, DOWN, buff=0.18)
        warn_group = VGroup(card_tanteo_warn, warn_title, warn_desc)
        self.play(FadeIn(warn_group), run_time=1.0)

        # =============================================================
        # ACTO 3: SIMETRÍA Y CENTRO x0 = 3 (55.32s - 82.86s)
        # =============================================================
        sync_to(55.32)
        self.play(FadeOut(warn_group), FadeOut(q1_label), FadeOut(q2_label), run_time=0.8)

        sym_line = DashedLine(
            start=axes.c2p(3, -4.3),
            end=axes.c2p(3, 3.5),
            dash_length=0.15,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.8,
        )
        sym_label = Text("Eje de Simetría (Espejo)", font_size=20, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 3.5), UP, buff=0.10)

        self.play(Create(sym_line), FadeIn(sym_label), run_time=1.5)

        # 1:03.77s: El centro de la curva está en el medio
        sync_to(63.77)
        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.15)
        center_label = Text("Centro", font_size=23, weight=BOLD, color="#1F618D").next_to(dot_center, UP, buff=0.18)
        self.play(FadeIn(dot_center), FadeIn(center_label), run_time=1.0)

        # 1:09.45s: Cálculo del centro: -b / 2a = 6 / 2 = 3
        # REVELAR VARIABLES a=1 y b=-6 ENCIMA DE LA ECUACIÓN (GIGANTES Y NÍTIDAS)
        sync_to(69.45)
        badge_a = RoundedRectangle(
            corner_radius=0.14, width=1.55, height=0.55,
            stroke_color="#2980B9", stroke_width=2.5,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-1.85, 6.35, 0]))
        txt_a = MathTex(r"\mathbf{a = 1}", font_size=28, color="#1B4F72").move_to(badge_a.get_center())

        badge_b = RoundedRectangle(
            corner_radius=0.14, width=1.75, height=0.55,
            stroke_color="#D35400", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.98
        ).move_to(np.array([-0.35, 6.35, 0]))
        txt_b = MathTex(r"\mathbf{b = -6}", font_size=28, color="#922B21").move_to(badge_b.get_center())

        card_ded = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=2.90,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.45, 0]))

        ded_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=24, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -1.30, 0]))

        step1 = MathTex(r"\text{1. Centro: } x_0 = -\frac{b}{2a} = -\frac{-6}{2(1)} = \mathbf{3}", font_size=34, color="#1B2631").move_to(np.array([-0.2, -2.25, 0]))

        self.play(FadeIn(badge_a), FadeIn(txt_a), FadeIn(badge_b), FadeIn(txt_b), FadeIn(card_ded), FadeIn(ded_title), run_time=1.0)
        self.play(Write(step1), run_time=2.0)

        # 1:19.32s: Resaltar el centro 3
        sync_to(79.32)
        dot_center_glow = Circle(radius=0.26, color="#2980B9", stroke_width=3.6).move_to(axes.c2p(3, 0))
        self.play(Create(dot_center_glow), FadeOut(dot_center_glow), run_time=0.8)

        # =============================================================
        # ACTO 4: LA DISTANCIA SIMÉTRICA u (82.86s - 100.17s)
        # =============================================================
        sync_to(82.86)
        arrow_left = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=3.6, buff=0)
        label_u_left = MathTex(r"-u", font_size=28, color="#C0392B").next_to(arrow_left.get_center(), UP, buff=0.15)
        r1_coord = MathTex(r"3 - u", font_size=28, color="#C0392B").next_to(dot_q1, DOWN, buff=0.18)

        self.play(GrowArrow(arrow_left), FadeIn(label_u_left), FadeIn(r1_coord), run_time=1.5)

        # 1:31.63s: La otra respuesta en 3 + u (derecha)
        sync_to(91.63)
        arrow_right = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=3.6, buff=0)
        label_u_right = MathTex(r"+u", font_size=28, color="#27AE60").next_to(arrow_right.get_center(), UP, buff=0.15)
        r2_coord = MathTex(r"3 + u", font_size=28, color="#27AE60").next_to(dot_q2, DOWN, buff=0.18)

        self.play(GrowArrow(arrow_right), FadeIn(label_u_right), FadeIn(r2_coord), run_time=1.2)

        # 1:35.42s: Escribir raíces simétricas en la tarjeta (Desplazamiento dinámico)
        sync_to(95.42)
        step2 = MathTex(r"\text{2. Raíces: } x_1 = 3 - u, \quad x_2 = 3 + u", font_size=33, color="#154360").move_to(np.array([-0.2, -2.85, 0]))
        self.play(step1.animate.move_to(np.array([-0.2, -1.95, 0])), Write(step2), run_time=1.5)

        # =============================================================
        # ACTO 5: EL PRODUCTO DE VIETA Y DIFERENCIA DE CUADRADOS (100.17s - 128.47s)
        # =============================================================
        sync_to(100.17)
        # REVELAR VARIABLE c = 5 ENCIMA DE LA ECUACIÓN (DORADO, GIGANTE)
        badge_c = RoundedRectangle(
            corner_radius=0.14, width=1.55, height=0.55,
            stroke_color="#B7950B", stroke_width=2.5,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([1.15, 6.35, 0]))
        txt_c = MathTex(r"\mathbf{c = 5}", font_size=28, color="#7D6608").move_to(badge_c.get_center())

        highlight_c = RoundedRectangle(
            corner_radius=0.12, width=0.90, height=0.78,
            stroke_color="#F39C12", stroke_width=2.6,
            fill_color="#FEF9E7", fill_opacity=0.4
        ).move_to(eq_text[4].get_center())

        self.play(FadeIn(badge_c), FadeIn(txt_c), Create(highlight_c), run_time=1.0)

        # 1:06.56s: Propiedad del producto (Evolución: desaparecen pasos previos y entra cálculo grande)
        sync_to(106.56)
        step3 = MathTex(r"\text{3. Producto: } (3 - u)(3 + u) = 5", font_size=34, color="#C0392B").move_to(np.array([-0.2, -1.98, 0]))
        self.play(FadeOut(step1), FadeOut(step2), Write(step3), run_time=1.5)

        # 1:22.46s: Resta de cuadrados: 9 - u^2 = 5
        sync_to(122.46)
        step4 = MathTex(r"\text{4. Diferencia: } 9 - u^2 = 5 \implies u^2 = \mathbf{4}", font_size=34, color="#D35400").move_to(np.array([-0.2, -2.85, 0]))
        self.play(Write(step4), run_time=2.0)

        # =============================================================
        # ACTO 6: PROFUNDIDAD DEL VÉRTICE Y DISTANCIA u (128.47s - 150.36s)
        # =============================================================
        sync_to(128.47)
        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.16)
        depth_arrow = Arrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=3.8, buff=0)
        depth_card = RoundedRectangle(
            corner_radius=0.18, width=3.3, height=0.74,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([1.5, 0.50, 0]))
        depth_txt = MathTex(r"\text{Profundidad } u^2 = 4", font_size=23, color="#922B21").move_to(depth_card.get_center())

        self.play(
            GrowArrow(depth_arrow), FadeIn(dot_vertex),
            FadeIn(depth_card), FadeIn(depth_txt),
            run_time=2.0
        )

        # 2:26.25s: Si u^2 = 4, distancia u vale 2 (Desplazamiento ascendente)
        sync_to(146.25)
        step5_u = MathTex(r"\text{5. Distancia: } u = \sqrt{4} = \mathbf{2}", font_size=34, color="#27AE60").move_to(np.array([-0.2, -3.20, 0]))
        self.play(
            step3.animate.move_to(np.array([-0.2, -1.75, 0])),
            step4.animate.move_to(np.array([-0.2, -2.48, 0])),
            Write(step5_u),
            run_time=1.8
        )

        # =============================================================
        # ACTO 7: LAS SOLUCIONES EXACTAS Y VERIFICACIÓN (150.36s - 163.25s)
        # =============================================================
        sync_to(150.36)
        r1_solved = MathTex(r"x_1 = 1", font_size=28, color="#1E8449").next_to(dot_q1, DOWN, buff=0.18)
        r2_solved = MathTex(r"x_2 = 5", font_size=28, color="#1E8449").next_to(dot_q2, DOWN, buff=0.18)

        ring1 = Circle(radius=0.28, color="#27AE60", stroke_width=4.0).move_to(axes.c2p(1, 0))
        ring2 = Circle(radius=0.28, color="#27AE60", stroke_width=4.0).move_to(axes.c2p(5, 0))

        self.play(
            Transform(r1_coord, r1_solved),
            Transform(r2_coord, r2_solved),
            Create(ring1), Create(ring2),
            dot_q1.animate.set_color("#27AE60"),
            dot_q2.animate.set_color("#27AE60"),
            run_time=2.0
        )

        # 2:36.47s: Recuadro de Solución Final (Quedan solo paso clave y solución gigante)
        sync_to(156.47)
        sol_box = RoundedRectangle(
            corner_radius=0.18, width=6.8, height=0.78,
            stroke_color="#27AE60", stroke_width=2.6,
            fill_color="#E8F8F5", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.85, 0]))

        sol_math = MathTex(r"\textbf{Solución:} \;\; x_1 = 3 - 2 = \mathbf{1}, \quad x_2 = 3 + 2 = \mathbf{5}", font_size=30, color="#196F3D")
        sol_math.move_to(sol_box.get_center())

        self.play(
            FadeOut(step3), FadeOut(step4),
            step5_u.animate.move_to(np.array([-0.2, -1.85, 0])),
            Create(sol_box), Write(sol_math),
            run_time=1.5
        )

        # =============================================================
        # ACTO 8: CIERRE, LLAMADA A LA ACCIÓN Y LOGO (163.25s - 172.87s)
        # =============================================================
        sync_to(163.25)
        all_scene_objects = VGroup(
            eq_box, eq_text, badge_a, txt_a, badge_b, txt_b, badge_c, txt_c, highlight_c,
            axes, tick_3, parabola, dot_y_intercept, lbl_y_intercept, tag_curva, curve_arrow,
            ground_line, ground_label, dot_q1, dot_q2, r1_coord, r2_coord, ring1, ring2,
            sym_line, sym_label, dot_center, center_label, arrow_left, arrow_right,
            label_u_left, label_u_right,
            dot_vertex, depth_arrow, depth_card, depth_txt,
            card_ded, ded_title,
            step5_u, sol_box, sol_math
        )
        self.play(FadeOut(all_scene_objects), run_time=1.0)

        # Tarjeta de Cierre Viral (Y in [-2.7, 4.1])
        outro_card = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=6.8,
            stroke_color="#1F618D", stroke_width=3.0,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.7, 0]))

        outro_header = RoundedRectangle(
            corner_radius=0.18, width=6.6, height=0.75,
            stroke_color="#1B4F72", stroke_width=2.0,
            fill_color="#EBF5FB", fill_opacity=0.95
        ).move_to(outro_card.get_top() + DOWN * 0.55)
        outro_header_txt = Text("ZÉNIT MATEMÁTICA", font_size=24, weight=BOLD, color="#1B4F72").move_to(outro_header.get_center())

        sub_header = Text("¿Te sirvió este atajo?", font_size=23, weight=BOLD, color="#D35400").next_to(outro_header, DOWN, buff=0.35)

        cta_row1 = VGroup(
            Dot(color="#2980B9", radius=0.08),
            Text("Guarda este video para tu examen", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row2 = VGroup(
            Dot(color="#E67E22", radius=0.08),
            Text("Compártelo a quien sufre con la fórmula", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row3 = VGroup(
            Dot(color="#27AE60", radius=0.08),
            Text("Sígueme para más matemáticas visuales", font_size=20, weight=BOLD, color="#196F3D")
        ).arrange(RIGHT, buff=0.22)

        cta_items = VGroup(cta_row1, cta_row2, cta_row3).arrange(DOWN, aligned_edge=LEFT, buff=0.30).next_to(sub_header, DOWN, buff=0.35)

        # Logo geométrico 3D estilo poliedro
        poly_center = outro_card.get_bottom() + UP * 1.5
        circle_logo = Circle(radius=0.9, color="#2980B9", stroke_width=2.2).move_to(poly_center)
        
        poly_lines = VGroup()
        angles = np.linspace(0, 2*np.pi, 6, endpoint=False)
        pts = [poly_center + np.array([np.cos(a)*0.8, np.sin(a)*0.8, 0]) for a in angles]
        for i in range(len(pts)):
            poly_lines.add(Line(pts[i], pts[(i+1)%len(pts)], stroke_color="#2980B9", stroke_width=2.0))
            poly_lines.add(Line(pts[i], poly_center, stroke_color="#7FB3D5", stroke_width=1.5))
            poly_lines.add(Line(pts[i], pts[(i+2)%len(pts)], stroke_color="#A9CCE3", stroke_width=1.0))

        logo_name = Text("Z É N I T", font_size=20, weight=BOLD, color="#154360").next_to(circle_logo, DOWN, buff=0.18)

        outro_group = VGroup(outro_card, outro_header, outro_header_txt, sub_header, cta_items, circle_logo, poly_lines, logo_name)
        self.play(FadeIn(outro_group), run_time=1.5)

        # Rotación suave del poliedro hasta el final exacto del video (172.87s)
        rem_time = 172.87 - self.time
        if rem_time > 0.1:
            self.play(Rotate(poly_lines, angle=2*np.pi, about_point=poly_center), run_time=rem_time, rate_func=linear)

# -*- coding: utf-8 -*-
"""
=============================================================================
PROYECTO: SHORT VIRAL DE MATEMÁTICAS - EL SECRETO GEOMÉTRICO DE (a + b)^2
MODELO: modelo_math_4 (Binomio al Cuadrado a Dos Voces: Hombre + Mujer)
FORMATO: 9:16 VERTICAL (TIKTOK / YOUTUBE SHORTS / REELS)
CUMPLIMIENTO ESTRICTO DE REGLAS DE ORO (AGENTS.md):
  - Regla #4: CERO menciones de marca al inicio (100% curiosidad); ZÉNIT MATEMÁTICA solo al final.
  - Regla #3: Badges en Y = +6.82, eq_box en Y = +5.62 (borde inf. +4.90),
    Figura central en Y in [-1.10, +4.30] con >= 0.55u de aire arriba y abajo,
    y card_ded en Y = -3.45 (Y in [-5.15, -1.75]) aprovechando la zona inferior.
DURACIÓN EXACTA: 97.94 SEGUNDOS (Sincronizado con narration_binomio_cuadrado.mp3)
MOTOR: MANIM COMMUNITY + MIKTEX
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


class BinomioCuadradoViralShort(Scene):
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
        # ACTO 1: GANCHO DE CURIOSIDAD - CERO MARCA AL INICIO (0.00s - 25.75s)
        # =============================================================
        top_hook_badge = RoundedRectangle(
            corner_radius=0.16, width=7.2, height=0.72,
            stroke_color="#7B241C", stroke_width=2.6,
            fill_color="#FDEDEC", fill_opacity=0.98
        ).move_to(np.array([-0.2, 6.65, 0]))
        top_hook_txt = Text("EL SECRETO QUE NO TE ENSEÑARON", font_size=22, weight=BOLD, color="#7B241C").move_to(top_hook_badge.get_center())

        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.44,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 5.42, 0]))
        eq_main = MathTex(r"\mathbf{(a + b)^2 = \; ?}", font_size=52, color="#1B2631").move_to(eq_box.get_center())

        card_ded = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=3.40,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -3.45, 0]))
        ded_title = Text("¿QUÉ SIGNIFICA REALMENTE?", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        self.play(
            FadeIn(top_hook_badge), FadeIn(top_hook_txt),
            Create(eq_box), Write(eq_main),
            FadeIn(card_ded), FadeIn(ded_title),
            run_time=1.4
        )

        # 3.05s: En la escuela nos lo enseñan de memoria... y muchos creen por error que es solo a^2 + b^2
        sync_to(3.05)
        myth_card = RoundedRectangle(
            corner_radius=0.22, width=6.6, height=2.20,
            stroke_color="#C0392B", stroke_width=3.0,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 2.00, 0]))
        myth_title = Text("EL ERROR CLÁSICO EN EXÁMENES:", font_size=20, weight=BOLD, color="#922B21").move_to(np.array([-0.2, 2.68, 0]))
        myth_eq = MathTex(r"(a + b)^2 = a^2 + b^2", font_size=48, color="#C0392B").move_to(np.array([-0.2, 1.65, 0]))
        cross_1 = Line(np.array([-2.4, 2.15, 0]), np.array([2.0, 1.15, 0]), stroke_color="#C0392B", stroke_width=6.0)
        cross_2 = Line(np.array([-2.4, 1.15, 0]), np.array([2.0, 2.15, 0]), stroke_color="#C0392B", stroke_width=6.0)

        hook_step1 = Text("¡FALSO! Olvidar lo que hay detrás cuesta puntos.", font_size=20, weight=BOLD, color="#C0392B").set_width(6.30).move_to(np.array([-0.2, -3.05, 0]))

        self.play(FadeIn(myth_card), FadeIn(myth_title), Write(myth_eq), run_time=1.4)
        self.play(Create(cross_1), Create(cross_2), Write(hook_step1), run_time=1.0)

        # 13.27s: Esto se puede explicar de forma algebraica o de forma geométrica
        sync_to(13.27)
        path_alg = RoundedRectangle(corner_radius=0.14, width=3.1, height=0.95, stroke_color="#2980B9", stroke_width=2.5, fill_color="#EBF5FB", fill_opacity=0.98).move_to(np.array([-1.85, -4.20, 0]))
        txt_alg = Text("1. Álgebra", font_size=22, weight=BOLD, color="#1B4F72").move_to(path_alg.get_center())

        path_geo = RoundedRectangle(corner_radius=0.14, width=3.1, height=0.95, stroke_color="#D35400", stroke_width=2.8, fill_color="#FEF9E7", fill_opacity=0.98).move_to(np.array([1.45, -4.20, 0]))
        txt_geo = Text("2. Geometría", font_size=22, weight=BOLD, color="#D35400").move_to(path_geo.get_center())

        self.play(FadeIn(path_alg), FadeIn(txt_alg), FadeIn(path_geo), FadeIn(txt_geo), run_time=1.1)

        # 17.28s (Voz Femenina): Veremos la geometría por su sutileza visual, y porque las sociedades antiguas hicieron de la geometría las REGLAS...
        sync_to(17.28)
        self.play(
            FadeOut(myth_card), FadeOut(myth_title), FadeOut(myth_eq),
            FadeOut(cross_1), FadeOut(cross_2),
            FadeOut(path_alg), FadeOut(txt_alg),
            path_geo.animate.move_to(np.array([-0.2, -4.20, 0])).set_width(5.2),
            txt_geo.animate.move_to(np.array([-0.2, -4.20, 0])),
            run_time=0.6
        )

        #Las 4 figuras clásicas del video original: Línea, Triángulo, Pentágono, Hexágono + REGLAS
        fig_line = Line(np.array([-2.95, 2.30, 0]), np.array([-2.05, 3.00, 0]), stroke_color="#F39C12", stroke_width=5.0)
        fig_tri = RegularPolygon(n=3, stroke_color="#27AE60", stroke_width=4.0, fill_color="#A9DFBF", fill_opacity=0.75).scale(0.62).move_to(np.array([-0.95, 2.65, 0]))
        fig_pent = RegularPolygon(n=5, stroke_color="#2980B9", stroke_width=4.0, fill_color="#AED6F1", fill_opacity=0.75).scale(0.62).move_to(np.array([0.65, 2.65, 0]))
        fig_hex = RegularPolygon(n=6, stroke_color="#8E44AD", stroke_width=4.0, fill_color="#D7BDE2", fill_opacity=0.75).scale(0.62).move_to(np.array([2.25, 2.65, 0]))
        reglas_txt = Text("REGLAS GEOMÉTRICAS", font_size=34, weight=BOLD, color="#1B2631").move_to(np.array([-0.2, 1.05, 0]))

        self.play(
            Create(fig_line), DrawBorderThenFill(fig_tri),
            DrawBorderThenFill(fig_pent), DrawBorderThenFill(fig_hex),
            run_time=1.8
        )
        self.play(FadeIn(reglas_txt, scale=1.15), run_time=0.9)

        # =============================================================
        # ACTO 2: EL CUADRADO INICIAL DE LADO a (25.75s - 40.46s)
        # =============================================================
        sync_to(25.75)
        self.play(
            FadeOut(top_hook_badge), FadeOut(top_hook_txt),
            FadeOut(fig_line), FadeOut(fig_tri), FadeOut(fig_pent), FadeOut(fig_hex), FadeOut(reglas_txt),
            FadeOut(hook_step1), FadeOut(path_geo), FadeOut(txt_geo),
            run_time=0.5
        )

        # Elevar eq_box a Y = +5.62 y mostrar 3 badges flotantes en Y = +6.82
        self.play(eq_box.animate.move_to(np.array([-0.2, 5.62, 0])), run_time=0.35)

        badge_top_1 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#1B4F72", stroke_width=2.4,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-2.60, 6.82, 0]))
        txt_top_1 = MathTex(r"\mathbf{\text{Lado } = a}", font_size=25, color="#1B4F72").move_to(badge_top_1.get_center())

        badge_top_2 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#2980B9", stroke_width=2.4,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-0.20, 6.82, 0]))
        txt_top_2 = MathTex(r"\mathbf{\text{Área } = a^2}", font_size=25, color="#2980B9").move_to(badge_top_2.get_center())

        badge_top_3 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#D35400", stroke_width=2.4,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([2.20, 6.82, 0]))
        txt_top_3 = MathTex(r"\mathbf{\text{Crece } = +b}", font_size=25, color="#D35400").move_to(badge_top_3.get_center())

        ded_title_act2 = Text("PASO 1: EL CUADRADO DE PARTIDA", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        # Cuadrado inicial de lado L_a = 2.40, ubicado en (-0.75, 1.25) -> X in [-1.95, +0.45], Y in [0.05, 2.45]
        sq_a2 = Square(
            side_length=2.40,
            stroke_color="#154360", stroke_width=3.6,
            fill_color="#1B4F72", fill_opacity=0.92
        ).move_to(np.array([-0.75, 1.25, 0]))
        lbl_q_side = MathTex(r"\mathbf{?}", font_size=38, color="#C0392B").next_to(sq_a2, DOWN, buff=0.18)

        self.play(
            FadeIn(badge_top_1), FadeIn(txt_top_1),
            FadeIn(badge_top_2), FadeIn(txt_top_2),
            FadeIn(badge_top_3), FadeIn(txt_top_3),
            Transform(ded_title, ded_title_act2),
            DrawBorderThenFill(sq_a2), FadeIn(lbl_q_side),
            run_time=1.3
        )

        # 29.00s: Diremos que mide lado a, lo que significa que su área es a al cuadrado
        sync_to(29.00)
        lbl_a_bot = MathTex(r"\mathbf{a}", font_size=38, color="#154360").next_to(sq_a2, DOWN, buff=0.18)
        lbl_a_left = MathTex(r"\mathbf{a}", font_size=38, color="#154360").next_to(sq_a2, LEFT, buff=0.20)
        lbl_a2_in = MathTex(r"\mathbf{a^2}", font_size=54, color=WHITE).move_to(sq_a2.get_center())

        step_sq_a = MathTex(r"\text{1. Cuadrado de lado } \mathbf{a} \implies \text{Área} = \mathbf{a^2}", font_size=34, color="#1B4F72").move_to(np.array([-0.2, -3.00, 0]))

        self.play(
            Transform(lbl_q_side, lbl_a_bot),
            FadeIn(lbl_a_left),
            Write(lbl_a2_in),
            Write(step_sq_a),
            run_time=1.5
        )

        # 33.57s: ¿Qué pasaría si este cuadrado se hace más grande? Vemos que ha crecido, pero ¿cuánto?
        # Cuadrado grande de lado L_a + L_b = 2.40 + 1.15 = 3.55
        # Esquina inferior izquierda en (-1.95, 0.05) -> Spans X in [-1.95, +1.60], Y in [0.05, 3.60], centro = (-0.175, 1.825)
        sync_to(33.57)
        big_sq_outline = Square(
            side_length=3.55,
            stroke_color="#D35400", stroke_width=4.0,
            fill_color="#FDEBD0", fill_opacity=0.65
        ).move_to(np.array([-0.175, 1.825, 0]))
        # Mantener sq_a2 encima
        self.bring_to_front(sq_a2, lbl_a2_in)

        lbl_cuanto = Text("¿Cuánto creció?", font_size=24, weight=BOLD, color="#D35400").move_to(np.array([-0.175, 4.05, 0]))
        step_grow = Text("2. El cuadrado crece hacia arriba y a la derecha", font_size=22, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -4.05, 0]))

        self.play(
            Create(big_sq_outline),
             self.bring_to_front(sq_a2, lbl_a2_in) if False else Wait(0.01),
            FadeIn(lbl_cuanto),
            Write(step_grow),
            run_time=1.6
        )
        self.bring_to_front(sq_a2, lbl_a2_in)

        # =============================================================
        # ACTO 3: EL LADO SOBRANTE b Y DIVISIÓN DE LA FIGURA EN "L" (40.46s - 52.51s)
        # =============================================================
        sync_to(40.46)
        self.play(FadeOut(step_sq_a), FadeOut(step_grow), FadeOut(lbl_cuanto), run_time=0.45)

        ded_title_act3 = Text("PASO 2: DIVIDIR LA REGIÓN NUEVA", font_size=20, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -2.12, 0]))
        lbl_b_bot = MathTex(r"\mathbf{b}", font_size=38, color="#D35400").move_to(np.array([1.025, -0.35, 0]))
        step_l_shape = MathTex(r"\text{Lado sobrante } = \mathbf{b} \implies \text{Lado total } = \mathbf{a + b}", font_size=33, color="#1B2631").move_to(np.array([-0.2, -3.05, 0]))

        self.play(
            Transform(ded_title, ded_title_act3),
            FadeIn(lbl_b_bot, scale=1.3),
            Write(step_l_shape),
            run_time=1.3
        )

        # 48.52s: Entonces busquemos dividirla en figuras más fáciles para todos
        sync_to(48.52)
        # Rectángulo superior (a x b): X in [-1.95, 0.45], Y in [2.45, 3.60], centro = (-0.75, 3.025)
        rect_top_ab = Rectangle(
            width=2.40, height=1.15,
            stroke_color="#1F618D", stroke_width=3.4,
            fill_color="#2980B9", fill_opacity=0.90
        ).move_to(np.array([-0.75, 3.025, 0]))

        # Rectángulo derecho (b x a): X in [0.45, 1.60], Y in [0.05, 2.45], centro = (1.025, 1.25)
        rect_right_ab = Rectangle(
            width=1.15, height=2.40,
            stroke_color="#1F618D", stroke_width=3.4,
            fill_color="#2980B9", fill_opacity=0.90
        ).move_to(np.array([1.025, 1.25, 0]))

        # Cuadrado pequeño esquina (b x b): X in [0.45, 1.60], Y in [2.45, 3.60], centro = (1.025, 3.025)
        sq_b2 = Square(
            side_length=1.15,
            stroke_color="#B7950B", stroke_width=3.6,
            fill_color="#F1C40F", fill_opacity=0.95
        ).move_to(np.array([1.025, 3.025, 0]))

        # Etiquetas exteriores completas (con >= 0.60u de respiro respecto a eq_box)
        lbl_a_top = MathTex(r"\mathbf{a}", font_size=36, color="#154360").next_to(rect_top_ab, UP, buff=0.16)
        lbl_b_top = MathTex(r"\mathbf{b}", font_size=36, color="#B7950B").next_to(sq_b2, UP, buff=0.16)
        lbl_b_left_top = MathTex(r"\mathbf{b}", font_size=36, color="#1F618D").next_to(rect_top_ab, LEFT, buff=0.20)
        lbl_b_right_top = MathTex(r"\mathbf{b}", font_size=36, color="#B7950B").next_to(sq_b2, RIGHT, buff=0.20)
        lbl_a_right_bot = MathTex(r"\mathbf{a}", font_size=36, color="#1F618D").next_to(rect_right_ab, RIGHT, buff=0.20)

        step_split_easy = Text("¡Aparecen 2 rectángulos iguales y 1 cuadrado pequeño!", font_size=19, weight=BOLD, color="#196F3D").set_width(6.35).move_to(np.array([-0.2, -4.10, 0]))

        self.play(
            FadeIn(rect_top_ab), FadeIn(rect_right_ab), FadeIn(sq_b2),
            FadeIn(lbl_a_top), FadeIn(lbl_b_top),
            FadeIn(lbl_b_left_top), FadeIn(lbl_b_right_top), FadeIn(lbl_a_right_bot),
            FadeIn(step_split_easy),
            run_time=1.8
        )

        # =============================================================
        # ACTO 4: CÁLCULO DE LAS ÁREAS ab Y b^2 (52.51s - 68.30s)
        # =============================================================
        sync_to(52.51)
        self.play(FadeOut(step_l_shape), FadeOut(step_split_easy), run_time=0.45)

        ded_title_act4 = Text("PASO 3: ÁREA DE CADA PIEZA NUEVA", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))
        txt_b1_p = MathTex(r"\mathbf{1\;\text{Cuad. } a^2}", font_size=23, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_b2_p = MathTex(r"\mathbf{2\;\text{Rect. } ab}", font_size=23, color="#2980B9").move_to(badge_top_2.get_center())
        txt_b3_p = MathTex(r"\mathbf{1\;\text{Cuad. } b^2}", font_size=23, color="#B7950B").move_to(badge_top_3.get_center())

        self.play(
            Transform(ded_title, ded_title_act4),
            Transform(txt_top_1, txt_b1_p),
            Transform(txt_top_2, txt_b2_p),
            Transform(txt_top_3, txt_b3_p),
            run_time=0.9
        )

        # 58.80s: Entonces el área de cada rectángulo será a por b igual a ab
        sync_to(58.80)
        lbl_ab_top = MathTex(r"\mathbf{ab}", font_size=42, color=WHITE).move_to(rect_top_ab.get_center())
        lbl_ab_right = MathTex(r"\mathbf{ab}", font_size=42, color=WHITE).move_to(rect_right_ab.get_center())
        step_area_ab = MathTex(r"\text{2. Dos rectángulos: } \quad a \cdot b = \mathbf{ab} \;\text{(cada uno)}", font_size=33, color="#2980B9").move_to(np.array([-0.2, -3.00, 0]))

        self.play(
            Write(lbl_ab_top), Write(lbl_ab_right),
            Write(step_area_ab),
            run_time=1.5
        )

        # 62.77s: Y ese cuadrado pequeño es de lado b, así que su área será b por b igual a b al cuadrado
        sync_to(62.77)
        lbl_b2_in = MathTex(r"\mathbf{b^2}", font_size=42, color="#7D6608").move_to(sq_b2.get_center())
        step_area_b2 = MathTex(r"\text{3. Esquina pequeña: } \quad b \cdot b = \mathbf{b^2}", font_size=34, color="#B7950B").move_to(np.array([-0.2, -4.12, 0]))

        self.play(
            Write(lbl_b2_in),
            Write(step_area_b2),
            run_time=1.5
        )

        # =============================================================
        # ACTO 5: SUMA DE LAS 4 PIEZAS Y FÓRMULA FINAL (68.30s - 88.46s)
        # =============================================================
        sync_to(68.30)
        self.play(FadeOut(step_area_ab), FadeOut(step_area_b2), run_time=0.45)

        ded_title_act5 = Text("PASO 4: SUMA TOTAL DEL CUADRADO GRANDE", font_size=19, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))

        # Llaves exteriores (a + b) abajo y a la izquierda con holgura amplia (>= 0.60u) respecto a card_ded
        full_sq_grp = VGroup(sq_a2, rect_top_ab, rect_right_ab, sq_b2)
        brace_ab_bot = Brace(full_sq_grp, DOWN, buff=0.14, color="#9A7D0A")
        lbl_ab_brace_bot = MathTex(r"\mathbf{a + b}", font_size=36, color="#9A7D0A").next_to(brace_ab_bot, DOWN, buff=0.10)

        brace_ab_left = Brace(full_sq_grp, LEFT, buff=0.14, color="#9A7D0A")
        lbl_ab_brace_left = MathTex(r"\mathbf{a + b}", font_size=36, color="#9A7D0A").next_to(brace_ab_left, LEFT, buff=0.12)

        self.play(
            Transform(ded_title, ded_title_act5),
            FadeOut(lbl_q_side), FadeOut(lbl_b_bot),
            FadeOut(lbl_a_left), FadeOut(lbl_b_left_top),
            GrowFromCenter(brace_ab_bot), FadeIn(lbl_ab_brace_bot),
            GrowFromCenter(brace_ab_left), FadeIn(lbl_ab_brace_left),
            run_time=1.5
        )

        # 74.03s: Si sumamos todas sus áreas interiores obtenemos a^2 + ab + ab + b^2
        sync_to(74.03)
        step_sum_all = MathTex(
            r"(a + b)^2 = \mathbf{a^2} + \mathbf{ab} + \mathbf{ab} + \mathbf{b^2}",
            font_size=36, color="#1B2631"
        ).move_to(np.array([-0.2, -2.95, 0]))
        eq_sum_top = MathTex(
            r"(a + b)^2 = a^2 + ab + ab + b^2",
            font_size=40, color="#1B2631"
        ).move_to(eq_box.get_center())

        self.play(Write(step_sum_all), Transform(eq_main, eq_sum_top), run_time=1.6)

        # 80.31s: Al juntar los dos rectángulos iguales nace la famosa fórmula: (a + b)^2 = a^2 + 2ab + b^2
        sync_to(80.31)
        sol_box = RoundedRectangle(
            corner_radius=0.18, width=6.7, height=1.32,
            stroke_color="#27AE60", stroke_width=3.2,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -4.22, 0]))
        sol_tex = MathTex(
            r"\mathbf{(a + b)^2 = a^2 + 2ab + b^2}",
            font_size=42, color="#196F3D"
        ).move_to(sol_box.get_center())
        eq_final_top = MathTex(
            r"\mathbf{(a + b)^2 = a^2 + 2ab + b^2}",
            font_size=44, color="#196F3D"
        ).move_to(eq_box.get_center())

        hl_rects = VGroup(
            SurroundingRectangle(rect_top_ab, color="#F39C12", buff=0.04, stroke_width=4.5),
            SurroundingRectangle(rect_right_ab, color="#F39C12", buff=0.04, stroke_width=4.5),
        )

        self.play(
            Create(hl_rects),
            Create(sol_box), Write(sol_tex),
            Transform(eq_main, eq_final_top),
            eq_box.animate.set_stroke("#27AE60", width=3.2),
            run_time=1.8
        )

        # =============================================================
        # ACTO 6: CONCLUSIÓN Y CIERRE ZÉNIT MATEMÁTICA (88.46s - 97.94s)
        # =============================================================
        sync_to(88.46)
        self.play(FadeOut(step_sum_all), run_time=0.4)
        note_2ab = Text("¡El 2ab son los 2 rectángulos laterales!", font_size=22, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -2.95, 0]))
        self.play(FadeIn(note_2ab, scale=1.1), run_time=0.9)

        # 94.50s: Guarda este video y síguenos en Zénit Matemática
        sync_to(94.50)
        all_act5 = VGroup(
            eq_box, eq_main,
            badge_top_1, txt_top_1, badge_top_2, txt_top_2, badge_top_3, txt_top_3,
            big_sq_outline, sq_a2, lbl_a2_in,
            rect_top_ab, lbl_ab_top, rect_right_ab, lbl_ab_right,
            sq_b2, lbl_b2_in, hl_rects,
            lbl_a_top, lbl_b_top, lbl_b_right_top, lbl_a_right_bot,
            brace_ab_bot, lbl_ab_brace_bot, brace_ab_left, lbl_ab_brace_left,
            card_ded, ded_title, note_2ab, sol_box, sol_tex
        )
        self.play(FadeOut(all_act5), run_time=0.5)

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

        sub_header = Text("Las matemáticas no se memorizan, ¡se ven!", font_size=21, weight=BOLD, color="#D35400").next_to(outro_header, DOWN, buff=0.35)

        cta_row1 = VGroup(
            Dot(color="#2980B9", radius=0.08),
            Text("Guarda este video para no olvidar el 2ab", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row2 = VGroup(
            Dot(color="#E67E22", radius=0.08),
            Text("Compártelo con tus compañeros", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row3 = VGroup(
            Dot(color="#27AE60", radius=0.08),
            Text("Síguenos para más secretos visuales", font_size=20, weight=BOLD, color="#196F3D")
        ).arrange(RIGHT, buff=0.22)

        cta_items = VGroup(cta_row1, cta_row2, cta_row3).arrange(DOWN, aligned_edge=LEFT, buff=0.30).next_to(sub_header, DOWN, buff=0.35)

        poly_center = outro_card.get_bottom() + UP * 1.5
        circle_logo = Circle(radius=0.9, color="#2980B9", stroke_width=2.2).move_to(poly_center)

        poly_lines = VGroup()
        angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
        pts = [poly_center + np.array([np.cos(a) * 0.8, np.sin(a) * 0.8, 0]) for a in angles]
        for i in range(len(pts)):
            poly_lines.add(Line(pts[i], pts[(i + 1) % len(pts)], stroke_color="#2980B9", stroke_width=2.0))
            poly_lines.add(Line(pts[i], poly_center, stroke_color="#7FB3D5", stroke_width=1.5))
            poly_lines.add(Line(pts[i], pts[(i + 2) % len(pts)], stroke_color="#A9CCE3", stroke_width=1.0))

        logo_name = Text("Z É N I T", font_size=20, weight=BOLD, color="#154360").next_to(circle_logo, DOWN, buff=0.18)

        outro_group = VGroup(outro_card, outro_header, outro_header_txt, sub_header, cta_items, circle_logo, poly_lines, logo_name)
        self.play(FadeIn(outro_group), run_time=0.8)

        rem_time = 97.94 - self.time
        if rem_time > 0.1:
            self.play(Rotate(poly_lines, angle=np.pi, about_point=poly_center), run_time=rem_time, rate_func=linear)

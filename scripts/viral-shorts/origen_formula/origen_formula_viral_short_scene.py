# -*- coding: utf-8 -*-
"""
=============================================================================
PROYECTO: SHORT VIRAL DE MATEMÁTICAS - EL ORIGEN GEOMÉTRICO DE LA FÓRMULA GENERAL
MODELO: modelo_math_3 (Completando el Cuadrado / Al-Khwarizmi + Mundo Real)
FORMATO: 9:16 VERTICAL (TIKTOK / YOUTUBE SHORTS / REELS)
CUMPLIMIENTO ESTRICTO DE REGLAS DE ORO (AGENTS.md):
  - Ecuación Protagonista arriba en Y = +5.48 (font_size = 48-52 pt)
  - Badges Flotantes arriba en Y = +6.38 (font_size = 26-28 pt)
  - Figura Geométrica y Gráfica de Parábola GRANDES y ESPACIOSAS en el centro (Y = 2.05)
  - Tarjeta de Deducción Dinámica en Y = -2.45 con pasos activos en 34-42 pt (sin apretujar)
DURACIÓN EXACTA: 176.33 SEGUNDOS (Sincronizado con narration_origen_formula.mp3)
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


class OrigenFormulaViralShort(Scene):
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
        # ACTO 1: EL GANCHO Y EL MISTERIO DE LOS 1.000 AÑOS (0.00s - 25.68s)
        # =============================================================
        top_hook_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.80,
            stroke_color="#7B241C", stroke_width=2.6,
            fill_color="#FDEDEC", fill_opacity=0.96
        ).move_to(np.array([-0.2, 5.55, 0]))
        top_hook_txt = Text("EL SECRETO DE LA FÓRMULA GENERAL", font_size=23, weight=BOLD, color="#7B241C").move_to(top_hook_badge.get_center())

        card_formula_hook = RoundedRectangle(
            corner_radius=0.26, width=7.2, height=2.55,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 3.45, 0]))
        hook_subtitle = Text("¿Por qué tiene esta forma tan extraña?", font_size=23, weight=BOLD, color="#1B4F72").next_to(card_formula_hook.get_top(), DOWN, buff=0.25)
        hook_formula = MathTex(r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}", font_size=48, color="#1B2631").next_to(hook_subtitle, DOWN, buff=0.28)

        # Signos de interrogación flotantes alrededor de la fórmula
        q_marks = VGroup(
            MathTex(r"?", font_size=42, color="#C0392B").move_to(np.array([-3.1, 3.9, 0])),
            MathTex(r"?", font_size=42, color="#D35400").move_to(np.array([2.7, 3.9, 0])),
            MathTex(r"?", font_size=42, color="#C0392B").move_to(np.array([-3.0, 2.6, 0])),
            MathTex(r"?", font_size=42, color="#D35400").move_to(np.array([2.6, 2.6, 0])),
        )

        self.play(FadeIn(top_hook_badge), FadeIn(top_hook_txt), FadeIn(card_formula_hook), FadeIn(hook_subtitle), Write(hook_formula), run_time=1.4)
        self.play(LaggedStart(*[FadeIn(q, scale=1.3) for q in q_marks], lag_ratio=0.15), run_time=1.0)

        # 11.68s: No la inventaron para torturarte -> Nació hace 1.000 años como un rompecabezas geométrico
        sync_to(11.68)
        card_puzzle_intro = RoundedRectangle(
            corner_radius=0.26, width=7.2, height=3.85,
            stroke_color="#D35400", stroke_width=2.6,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -0.25, 0]))
        puzzle_title = Text("ORIGEN: HACE MÁS DE 1.000 AÑOS", font_size=22, weight=BOLD, color="#D35400").next_to(card_puzzle_intro.get_top(), DOWN, buff=0.24)
        puzzle_desc = Text("Un rompecabezas geométrico sin una esquina", font_size=20, color="#2C3E50").next_to(puzzle_title, DOWN, buff=0.16)

        # Mini vista previa del cuadrado con la esquina faltante
        mini_sq_main = Square(side_length=1.45, stroke_color="#1B4F72", stroke_width=2.5, fill_color="#2980B9", fill_opacity=0.85).move_to(np.array([-0.55, -0.95, 0]))
        mini_strip_r = Rectangle(width=0.65, height=1.45, stroke_color="#1B4F72", stroke_width=2.5, fill_color="#5DADE2", fill_opacity=0.85).next_to(mini_sq_main, RIGHT, buff=0)
        mini_strip_t = Rectangle(width=1.45, height=0.65, stroke_color="#1B4F72", stroke_width=2.5, fill_color="#5DADE2", fill_opacity=0.85).next_to(mini_sq_main, UP, buff=0)
        mini_missing = DashedVMobject(Square(side_length=0.65, stroke_color="#C0392B", stroke_width=3.2), num_dashes=12).next_to(mini_strip_t, RIGHT, buff=0)
        mini_q = MathTex(r"?", font_size=34, color="#C0392B").move_to(mini_missing.get_center())
        mini_puzzle_grp = VGroup(mini_sq_main, mini_strip_r, mini_strip_t, mini_missing, mini_q)

        self.play(FadeIn(card_puzzle_intro), FadeIn(puzzle_title), FadeIn(puzzle_desc), FadeIn(mini_puzzle_grp), run_time=1.3)

        # 20.06s: Promesa en tarjeta inferior verde
        sync_to(20.06)
        card_promesa = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.25,
            stroke_color="#27AE60", stroke_width=2.5,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -3.15, 0]))
        promesa_txt1 = Text("EN LOS PRÓXIMOS 2 MINUTOS:", font_size=21, weight=BOLD, color="#196F3D").next_to(card_promesa.get_top(), DOWN, buff=0.18)
        promesa_txt2 = Text("Verás con tus propios ojos de dónde sale cada pieza.", font_size=19, color="#1E8449").next_to(promesa_txt1, DOWN, buff=0.14)
        promesa_grp = VGroup(card_promesa, promesa_txt1, promesa_txt2)
        self.play(FadeIn(promesa_grp), run_time=0.9)

        # =============================================================
        # ACTO 2: LIMPIANDO EL TERRENO ALGEBRAICO (25.68s - 41.51s)
        # =============================================================
        sync_to(25.68)
        self.play(
            FadeOut(top_hook_badge), FadeOut(top_hook_txt),
            FadeOut(card_formula_hook), FadeOut(hook_subtitle), FadeOut(hook_formula), FadeOut(q_marks),
            FadeOut(card_puzzle_intro), FadeOut(puzzle_title), FadeOut(puzzle_desc), FadeOut(mini_puzzle_grp),
            FadeOut(promesa_grp),
            run_time=0.8
        )

        # ZONA SUPERIOR PROTAGONISTA: Y = 5.62 (altura amplia 1.44) + BADGES FLOTANTES EN Y = 6.82
        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.44,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 5.62, 0]))
        eq_main = MathTex(r"ax^2 + bx + c = 0", font_size=50, color="#1B2631").move_to(eq_box.get_center())

        badge_top_1 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#1B4F72", stroke_width=2.4,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-2.60, 6.82, 0]))
        txt_top_1 = MathTex(r"\mathbf{ax^2: \text{Área}}", font_size=24, color="#1B4F72").move_to(badge_top_1.get_center())

        badge_top_2 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#2980B9", stroke_width=2.4,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-0.20, 6.82, 0]))
        txt_top_2 = MathTex(r"\mathbf{bx: \text{Lados}}", font_size=24, color="#2980B9").move_to(badge_top_2.get_center())

        badge_top_3 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#C0392B", stroke_width=2.4,
            fill_color="#FDEDEC", fill_opacity=0.98
        ).move_to(np.array([2.20, 6.82, 0]))
        txt_top_3 = MathTex(r"\mathbf{c: \text{Constante}}", font_size=24, color="#922B21").move_to(badge_top_3.get_center())

        # Tarjeta de Deducción Inferior bien posicionada en Y = -3.45 (aprovecha espacio inferior y deja aire al centro)
        card_ded = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=3.40,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -3.45, 0]))
        ded_title = Text("PREPARACIÓN ALGEBRAICA", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        self.play(
            Create(eq_box), Write(eq_main),
            FadeIn(badge_top_1), FadeIn(txt_top_1),
            FadeIn(badge_top_2), FadeIn(txt_top_2),
            FadeIn(badge_top_3), FadeIn(txt_top_3),
            FadeIn(card_ded), FadeIn(ded_title),
            run_time=1.2
        )

        # 31.19s: Pasamos la c restando a la derecha
        sync_to(31.19)
        prep_step1 = MathTex(r"\text{1. Pasar } c\text{: } \quad ax^2 + bx = -c", font_size=36, color="#1B2631").move_to(np.array([-0.2, -2.95, 0]))
        self.play(Write(prep_step1), run_time=1.3)

        # 36.51s: Dividimos todo entre a -> x^2 + (b/a)x = -c/a
        sync_to(36.51)
        prep_step2 = MathTex(r"\text{2. Dividir } \div a\text{: } \quad x^2 + \frac{b}{a}x = -\frac{c}{a}", font_size=35, color="#D35400").move_to(np.array([-0.2, -4.10, 0]))
        eq_cleaned = MathTex(r"x^2 + \frac{b}{a}x = -\frac{c}{a}", font_size=42, color="#1B2631").move_to(eq_box.get_center())
        self.play(Write(prep_step2), Transform(eq_main, eq_cleaned), run_time=1.5)

        # =============================================================
        # ACTO 3: TRADUCCIÓN A OJOS GEOMÉTRICOS (41.51s - 59.43s)
        # =============================================================
        sync_to(41.51)
        ded_title_geo = Text("TRADUCCIÓN GEOMÉTRICA DE ÁREAS", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))
        txt_top_1_new = MathTex(r"\mathbf{\text{Cuadrado } x^2}", font_size=23, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_top_2_new = MathTex(r"\mathbf{\text{Rect. } \frac{b}{a}x}", font_size=22, color="#2980B9").move_to(badge_top_2.get_center())
        txt_top_3_new = MathTex(r"\mathbf{\text{Total } = -\frac{c}{a}}", font_size=22, color="#922B21").move_to(badge_top_3.get_center())

        self.play(
            FadeOut(prep_step1), FadeOut(prep_step2),
            Transform(ded_title, ded_title_geo),
            Transform(txt_top_1, txt_top_1_new),
            Transform(txt_top_2, txt_top_2_new),
            Transform(txt_top_3, txt_top_3_new),
            run_time=0.8
        )

        # GEOMETRÍA CENTRAL AMPLIA Y ESPACIOSA CON RESPIRO ARRIBA Y ABAJO
        # Cuadrado principal x^2: Lado = 2.50, esquina inferior izquierda en (-1.95, 0.00)
        # Spans X in [-1.95, +0.55], Y in [0.00, 2.50], centro = (-0.70, 1.25)
        sq_x2 = Rectangle(
            width=2.50, height=2.50,
            stroke_color="#154360", stroke_width=3.5,
            fill_color="#1B4F72", fill_opacity=0.92
        ).move_to(np.array([-0.70, 1.25, 0]))
        lbl_x2_inside = MathTex(r"\mathbf{x^2}", font_size=52, color=WHITE).move_to(sq_x2.get_center())
        lbl_x_left = MathTex(r"\mathbf{x}", font_size=38, color="#154360").next_to(sq_x2, LEFT, buff=0.22)
        lbl_x_bottom = MathTex(r"\mathbf{x}", font_size=38, color="#154360").next_to(sq_x2, DOWN, buff=0.22)

        geo_step1 = MathTex(r"\text{1. } x^2 = \text{Cuadrado de lado } \mathbf{x}", font_size=34, color="#1B4F72").move_to(np.array([-0.2, -3.00, 0]))

        self.play(DrawBorderThenFill(sq_x2), FadeIn(lbl_x2_inside), FadeIn(lbl_x_left), FadeIn(lbl_x_bottom), Write(geo_step1), run_time=1.8)

        # 50.02s: Rectángulo azul (b/a)x pegado a la derecha
        # Ancho = 2.20, Alto = 2.50 -> Spans X in [0.55, 2.75], Y in [0.00, 2.50], centro = (1.65, 1.25)
        sync_to(50.02)
        rect_bax = Rectangle(
            width=2.20, height=2.50,
            stroke_color="#1F618D", stroke_width=3.2,
            fill_color="#3498DB", fill_opacity=0.88
        ).next_to(sq_x2, RIGHT, buff=0)
        lbl_bax_inside = MathTex(r"\mathbf{\frac{b}{a}x}", font_size=40, color=WHITE).move_to(rect_bax.get_center())
        brace_ba_bottom = Brace(rect_bax, DOWN, buff=0.12, color="#1F618D")
        lbl_ba_bottom = MathTex(r"\mathbf{\frac{b}{a}}", font_size=34, color="#1F618D").next_to(brace_ba_bottom, DOWN, buff=0.10)

        geo_step2 = MathTex(r"\text{2. } \frac{b}{a}x = \text{Rectángulo de ancho } \mathbf{\frac{b}{a}}", font_size=34, color="#2980B9").move_to(np.array([-0.2, -4.05, 0]))

        self.play(
            DrawBorderThenFill(rect_bax), FadeIn(lbl_bax_inside),
            GrowFromCenter(brace_ba_bottom), FadeIn(lbl_ba_bottom),
            Write(geo_step2),
            run_time=1.6
        )

        # 56.61s: Toda esta figura junta vale -c/a
        sync_to(56.61)
        highlight_total = SurroundingRectangle(VGroup(sq_x2, rect_bax), color="#D35400", buff=0.08, stroke_width=3.5)
        self.play(Create(highlight_total), FadeOut(highlight_total), run_time=1.4)

        # =============================================================
        # ACTO 4: EL TRUCO DE LOS ANTIGUOS - PARTIR A LA MITAD (59.43s - 90.67s)
        # =============================================================
        sync_to(59.43)
        ded_title_split = Text("EL TRUCO DE LOS ANTIGUOS (SIMETRÍA)", font_size=19, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -2.12, 0]))
        split_explain = MathTex(r"\text{Objetivo: Convertir en un Cuadrado Simétrico}", font_size=31, color="#2C3E50").move_to(np.array([-0.2, -3.05, 0]))
        self.play(
            FadeOut(geo_step1), FadeOut(geo_step2),
            Transform(ded_title, ded_title_split),
            Write(split_explain),
            run_time=1.0
        )

        # 71.28s (1:11.28): Línea de corte vertical exactamente a la mitad del rectángulo azul (X = 1.65)
        sync_to(71.28)
        cut_line = DashedLine(
            start=np.array([1.65, 2.70, 0]),
            end=np.array([1.65, -0.20, 0]),
            dash_length=0.14,
            color="#F39C12",
            stroke_width=4.5
        )
        self.play(Create(cut_line), run_time=0.8)

        # 72.36s (1:12.36): Partir el rectángulo azul en dos tiras de ancho 1.10 (b/2a)
        # Tira derecha queda en X in [0.55, 1.65], Y in [0.00, 2.50], centro = (1.10, 1.25)
        # Tira superior va a X in [-1.95, 0.55], Y in [2.50, 3.60], centro = (-0.70, 3.05)
        sync_to(72.36)
        strip_right = Rectangle(
            width=1.10, height=2.50,
            stroke_color="#1F618D", stroke_width=3.2,
            fill_color="#2980B9", fill_opacity=0.90
        ).move_to(np.array([1.10, 1.25, 0]))
        lbl_strip_right = MathTex(r"\mathbf{\frac{b}{2a}x}", font_size=32, color=WHITE).move_to(strip_right.get_center())

        strip_moving = Rectangle(
            width=1.10, height=2.50,
            stroke_color="#1F618D", stroke_width=3.2,
            fill_color="#3498DB", fill_opacity=0.90
        ).move_to(np.array([2.20, 1.25, 0]))

        strip_top_target = Rectangle(
            width=2.50, height=1.10,
            stroke_color="#1F618D", stroke_width=3.2,
            fill_color="#2980B9", fill_opacity=0.90
        ).move_to(np.array([-0.70, 3.05, 0]))
        lbl_strip_top = MathTex(r"\mathbf{\frac{b}{2a}x}", font_size=32, color=WHITE).move_to(strip_top_target.get_center())

        self.remove(rect_bax, lbl_bax_inside)
        self.add(strip_right, strip_moving)
        self.play(
            FadeOut(cut_line), FadeOut(brace_ba_bottom), FadeOut(lbl_ba_bottom),
            Transform(strip_moving, strip_top_target),
            FadeIn(lbl_strip_right),
            run_time=1.8
        )
        self.play(FadeIn(lbl_strip_top), run_time=0.5)

        # 78.72s (1:18.72): Como partimos b/a en dos, ahora cada tira mide b/2a de ancho
        sync_to(78.72)
        brace_b2a_bottom = Brace(strip_right, DOWN, buff=0.12, color="#1F618D")
        lbl_b2a_bottom = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=32, color="#1F618D").next_to(brace_b2a_bottom, DOWN, buff=0.10)

        brace_b2a_left = Brace(strip_top_target, LEFT, buff=0.12, color="#1F618D")
        lbl_b2a_left = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=32, color="#1F618D").next_to(brace_b2a_left, LEFT, buff=0.10)

        split_step_math = MathTex(r"\text{3. Dos tiras simétricas de grosor } \mathbf{\frac{b}{2a}}", font_size=34, color="#1F618D").move_to(np.array([-0.2, -4.05, 0]))

        self.play(
            GrowFromCenter(brace_b2a_bottom), FadeIn(lbl_b2a_bottom),
            GrowFromCenter(brace_b2a_left), FadeIn(lbl_b2a_left),
            Write(split_step_math),
            run_time=1.5
        )

        # 84.89s (1:24.89): ¡Pero mira qué pasó! Quedó un hueco vacío en la esquina superior derecha
        # Esquina vacía: X in [0.55, 1.65], Y in [2.50, 3.60], centro = (1.10, 3.05), lado = 1.10
        sync_to(84.89)
        missing_hole = DashedVMobject(
            Square(side_length=1.10, stroke_color="#C0392B", stroke_width=4.2),
            num_dashes=16
        ).move_to(np.array([1.10, 3.05, 0]))
        missing_q = MathTex(r"\mathbf{?}", font_size=48, color="#C0392B").move_to(missing_hole.get_center())

        hole_alert = Text("¡Falta la esquina (?) para cerrar el cuadrado!", font_size=21, weight=BOLD, color="#C0392B").move_to(np.array([-0.2, -3.00, 0]))

        self.play(FadeOut(split_explain), run_time=0.4)
        self.play(
            Create(missing_hole), FadeIn(missing_q, scale=1.4),
            FadeIn(hole_alert),
            run_time=1.0
        )

        # =============================================================
        # ACTO 5: COMPLETANDO EL CUADRADO Y NACIMIENTO DE b^2 - 4ac (90.67s - 128.90s)
        # =============================================================
        sync_to(90.67)
        ded_title_complete = Text("COMPLETANDO EL CUADRADO PERFECTO", font_size=19, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))

        # Cotas del hueco vacío arriba y a la derecha (con holgura amplia respecto a eq_box)
        lbl_hole_top = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=28, color="#C0392B").next_to(missing_hole, UP, buff=0.14)
        lbl_hole_right = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=28, color="#C0392B").next_to(missing_hole, RIGHT, buff=0.16)

        self.play(
            Transform(ded_title, ded_title_complete),
            FadeIn(lbl_hole_top), FadeIn(lbl_hole_right),
            run_time=1.0
        )

        # 97.27s (1:37.27): Área del pedacito que falta = (b/2a)^2 = b^2 / 4a^2
        sync_to(97.27)
        step_corner_area = MathTex(r"\text{4. Esquina: } \left(\frac{b}{2a}\right)^2 = \mathbf{\frac{b^2}{4a^2}}", font_size=36, color="#D35400").move_to(np.array([-0.2, -3.15, 0]))
        txt_top_3_corner = MathTex(r"\mathbf{+\frac{b^2}{4a^2}}", font_size=22, color="#B7950B").move_to(badge_top_3.get_center())

        self.play(
            FadeOut(hole_alert), FadeOut(split_step_math),
            badge_top_3.animate.set_stroke("#B7950B").set_fill("#FEF9E7"),
            Transform(txt_top_3, txt_top_3_corner),
            run_time=0.45
        )
        self.play(Write(step_corner_area), run_time=1.15)

        # 106.74s (1:46.74): Metemos la pieza dorada en la esquina y la sumamos en ambos lados de la ecuación
        sync_to(106.74)
        golden_piece = Square(
            side_length=1.10,
            stroke_color="#B7950B", stroke_width=3.6,
            fill_color="#F1C40F", fill_opacity=0.95
        ).move_to(np.array([1.10, 3.95, 0]))  # Empieza un poco arriba y encaja
        lbl_golden_inside = MathTex(r"\mathbf{\frac{b^2}{4a^2}}", font_size=30, color="#7D6608")

        self.play(
            FadeOut(missing_q),
            golden_piece.animate.move_to(np.array([1.10, 3.05, 0])),
            run_time=1.2
        )
        lbl_golden_inside.move_to(golden_piece.get_center())
        self.play(FadeIn(lbl_golden_inside), run_time=0.4)

        # Actualizar ecuación protagonista superior (Y = 5.62) sumando b^2 / 4a^2 en ambos lados
        eq_added_both = MathTex(
            r"x^2 + \frac{b}{a}x + \mathbf{\frac{b^2}{4a^2}} = -\frac{c}{a} + \mathbf{\frac{b^2}{4a^2}}",
            font_size=38, color="#1B2631"
        ).move_to(eq_box.get_center())
        step_balance = MathTex(
            r"x^2 + \frac{b}{a}x + \frac{b^2}{4a^2} = -\frac{c}{a} + \frac{b^2}{4a^2}",
            font_size=34, color="#1B2631"
        ).move_to(np.array([-0.2, -4.20, 0]))

        self.play(Transform(eq_main, eq_added_both), Write(step_balance), run_time=1.5)

        # 114.56s (1:54.56): Ahora el cuadrado completo mide (x + b/2a) por cada lado -> área (x + b/2a)^2
        sync_to(114.56)
        full_square_group = VGroup(sq_x2, strip_right, strip_moving, golden_piece)
        brace_total_bottom = Brace(full_square_group, DOWN, buff=0.14, color="#B7950B")
        lbl_total_bottom = MathTex(r"\mathbf{x + \frac{b}{2a}}", font_size=34, color="#9A7D0A").next_to(brace_total_bottom, DOWN, buff=0.10)

        brace_total_left = Brace(full_square_group, LEFT, buff=0.14, color="#B7950B")
        lbl_total_left = MathTex(r"\mathbf{x + \frac{b}{2a}}", font_size=32, color="#9A7D0A").next_to(brace_total_left, LEFT, buff=0.10)

        step_full_sq = MathTex(
            r"\text{5. Cuadrado: } \left(x + \frac{b}{2a}\right)^2 = -\frac{c}{a} + \frac{b^2}{4a^2}",
            font_size=33, color="#1B4F72"
        ).move_to(np.array([-0.2, -3.00, 0]))

        self.play(
            FadeOut(lbl_x_bottom), FadeOut(brace_b2a_bottom), FadeOut(lbl_b2a_bottom),
            FadeOut(lbl_x_left), FadeOut(brace_b2a_left), FadeOut(lbl_b2a_left),
            FadeOut(step_corner_area), FadeOut(step_balance),
            run_time=0.45
        )
        self.play(
            GrowFromCenter(brace_total_bottom), FadeIn(lbl_total_bottom),
            GrowFromCenter(brace_total_left), FadeIn(lbl_total_left),
            Write(step_full_sq),
            run_time=1.25
        )

        # 121.48s (2:01.48): Al juntar las dos fracciones aparece el mítico b^2 - 4ac sobre 4a^2
        sync_to(121.48)
        step_discriminant = MathTex(
            r"\left(x + \frac{b}{2a}\right)^2 = \mathbf{\frac{b^2 - 4ac}{4a^2}}",
            font_size=38, color="#C0392B"
        ).move_to(np.array([-0.2, -4.15, 0]))
        eq_disc_top = MathTex(
            r"\left(x + \frac{b}{2a}\right)^2 = \frac{b^2 - 4ac}{4a^2}",
            font_size=40, color="#1B2631"
        ).move_to(eq_box.get_center())

        self.play(Write(step_discriminant), Transform(eq_main, eq_disc_top), run_time=1.8)

        # =============================================================
        # ACTO 6: RAÍZ CUADRADA Y DESPEJE FINAL (128.90s - 144.34s)
        # =============================================================
        sync_to(128.90)
        ded_title_final = Text("DESPEJE FINAL DEL LADO X", font_size=21, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))
        step_sqrt = MathTex(
            r"\text{6. Raíz: } x + \frac{b}{2a} = \frac{\pm\sqrt{b^2 - 4ac}}{2a}",
            font_size=33, color="#1B2631"
        ).move_to(np.array([-0.2, -2.92, 0]))

        self.play(
            FadeOut(step_full_sq), FadeOut(step_discriminant),
            Transform(ded_title, ded_title_final),
            run_time=0.45
        )
        self.play(Write(step_sqrt), run_time=1.25)

        # 139.56s (2:19.56): Restamos b/2a -> ¡Fórmula General!
        sync_to(139.56)
        sol_box = RoundedRectangle(
            corner_radius=0.18, width=6.8, height=1.34,
            stroke_color="#27AE60", stroke_width=3.0,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -4.22, 0]))
        sol_formula = MathTex(
            r"\mathbf{x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}}",
            font_size=38, color="#196F3D"
        ).move_to(sol_box.get_center())

        eq_final_top = MathTex(
            r"\mathbf{x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}}",
            font_size=40, color="#196F3D"
        ).move_to(eq_box.get_center())

        self.play(
            Create(sol_box), Write(sol_formula),
            Transform(eq_main, eq_final_top),
            eq_box.animate.set_stroke("#27AE60", width=3.2),
            run_time=1.6
        )

        # =============================================================
        # ACTO 7: EL MUNDO REAL, EL SIGNO +/- Y PARÁBOLAS (144.34s - 171.54s)
        # =============================================================
        sync_to(144.34)
        geo_all = VGroup(
            sq_x2, lbl_x2_inside, strip_right, lbl_strip_right,
            strip_moving, lbl_strip_top, missing_hole, golden_piece, lbl_golden_inside,
            lbl_hole_top, lbl_hole_right,
            brace_total_bottom, lbl_total_bottom, brace_total_left, lbl_total_left
        )
        self.play(
            FadeOut(geo_all),
            FadeOut(step_sqrt), FadeOut(sol_box), FadeOut(sol_formula),
            run_time=0.9
        )

        # Actualizar badges superiores para el Mundo Real
        txt_app_1 = Text("Física", font_size=20, weight=BOLD, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_app_2 = Text("Ingeniería", font_size=20, weight=BOLD, color="#2980B9").move_to(badge_top_2.get_center())
        txt_app_3 = Text("Videojuegos", font_size=20, weight=BOLD, color="#9A7D0A").move_to(badge_top_3.get_center())

        ded_title_real = Text("¿QUÉ SIGNIFICA EL ± EN EL MUNDO REAL?", font_size=19, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        # GRÁFICA AMPLIA DE PARÁBOLA EN EL CENTRO (Y = 1.65, altura = 5.2u)
        axes = Axes(
            x_range=[-4.0, 4.0, 1],
            y_range=[-1.5, 4.8, 1],
            x_length=6.6,
            y_length=5.2,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.6,
                "include_tip": True,
                "tip_width": 0.16,
                "tip_height": 0.16,
            },
        ).move_to(np.array([-0.15, 1.65, 0]))

        parabola_real = axes.plot(
            lambda x: 3.6 - 0.576 * (x ** 2),
            x_range=[-2.5, 2.5],
            color="#2980B9",
            stroke_width=5.2
        )

        dot_r1 = Dot(axes.c2p(-2.5, 0), color="#C0392B", radius=0.16)
        dot_r2 = Dot(axes.c2p(2.5, 0), color="#27AE60", radius=0.16)
        lbl_r1 = MathTex(r"\mathbf{x_1 \; (\text{con } -)}", font_size=28, color="#C0392B").next_to(dot_r1, DOWN, buff=0.20)
        lbl_r2 = MathTex(r"\mathbf{x_2 \; (\text{con } +)}", font_size=28, color="#196F3D").next_to(dot_r2, DOWN, buff=0.20)

        self.play(
            Transform(txt_top_1, txt_app_1),
            Transform(txt_top_2, txt_app_2),
            Transform(txt_top_3, txt_app_3),
            Transform(ded_title, ded_title_real),
            FadeIn(axes), Create(parabola_real),
            FadeIn(dot_r1), FadeIn(dot_r2), FadeIn(lbl_r1), FadeIn(lbl_r2),
            run_time=1.6
        )

        # 148.45s (2:28.45): Tanto un positivo como un negativo al cuadrado dan la misma área
        sync_to(148.45)
        real_step1 = MathTex(r"(+k)^2 = (-k)^2 \implies \text{Dos impactos simétricos}", font_size=32, color="#1B2631").move_to(np.array([-0.2, -3.00, 0]))
        self.play(Write(real_step1), run_time=1.4)

        # 155.11s (2:35.11): En física: cuando algo sube y cuando vuelve a bajar
        sync_to(155.11)
        arrow_up = Arrow(start=axes.c2p(-2.5, 0), end=axes.c2p(-1.3, 2.6), color="#E67E22", stroke_width=4.0, buff=0.05)
        arrow_down = Arrow(start=axes.c2p(1.3, 2.6), end=axes.c2p(2.5, 0), color="#E67E22", stroke_width=4.0, buff=0.05)
        real_step2 = MathTex(r"\text{Física: Instante de subida } (x_1) \text{ y caída } (x_2)", font_size=31, color="#D35400").move_to(np.array([-0.2, -4.00, 0]))
        self.play(GrowArrow(arrow_up), GrowArrow(arrow_down), Write(real_step2), run_time=1.4)

        # 160.38s (2:40.38): Cohetes / Tiro libre, Puentes colgantes y Videojuegos
        sync_to(160.38)
        # Dibujar cables de puente colgante sobre la parábola para visual espectacular
        bridge_pillars = VGroup(
            Line(axes.c2p(-2.2, 0), axes.c2p(-2.2, 3.8), stroke_color="#D35400", stroke_width=4.5),
            Line(axes.c2p(2.2, 0), axes.c2p(2.2, 3.8), stroke_color="#D35400", stroke_width=4.5),
        )
        bridge_cables = VGroup(*[
            Line(axes.c2p(xv, 0), axes.c2p(xv, 3.6 - 0.576 * (xv ** 2)), stroke_color="#F39C12", stroke_width=2.0, stroke_opacity=0.85)
            for xv in np.linspace(-1.8, 1.8, 7)
        ])

        app_summary = VGroup(
            Text("• Cohetes espaciales y tiros libres", font_size=22, weight=BOLD, color="#1B4F72"),
            Text("• Resistencia de puentes colgantes", font_size=22, weight=BOLD, color="#D35400"),
            Text("• Física de saltos en videojuegos", font_size=22, weight=BOLD, color="#196F3D"),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to(np.array([-0.2, -3.55, 0]))

        self.play(
            FadeOut(real_step1), FadeOut(real_step2),
            run_time=0.45
        )
        self.play(
            Create(bridge_pillars), Create(bridge_cables),
            FadeIn(app_summary),
            run_time=1.40
        )

        # =============================================================
        # ACTO 8: CIERRE VIRAL Y LLAMADA A LA ACCIÓN (171.54s - 176.33s)
        # =============================================================
        sync_to(171.54)
        all_act7 = VGroup(
            eq_box, eq_main,
            badge_top_1, txt_top_1, badge_top_2, txt_top_2, badge_top_3, txt_top_3,
            axes, parabola_real, dot_r1, dot_r2, lbl_r1, lbl_r2,
            arrow_up, arrow_down, bridge_pillars, bridge_cables,
            card_ded, ded_title, app_summary
        )
        self.play(FadeOut(all_act7), run_time=0.7)

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
            Text("Guarda este video para no olvidarlo", font_size=20, color="#2C3E50")
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
        self.play(FadeIn(outro_group), run_time=1.0)

        rem_time = 176.33 - self.time
        if rem_time > 0.1:
            self.play(Rotate(poly_lines, angle=np.pi, about_point=poly_center), run_time=rem_time, rate_func=linear)

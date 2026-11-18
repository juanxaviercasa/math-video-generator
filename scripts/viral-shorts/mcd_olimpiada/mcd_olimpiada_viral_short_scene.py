# -*- coding: utf-8 -*-
"""
=============================================================================
PROYECTO: SHORT VIRAL DE MATEMÁTICAS - ENIGMA DE OLIMPIADA Y MCD (2007^2007)
FORMATO: 9:16 VERTICAL (TIKTOK / YOUTUBE SHORTS / REELS)
CUMPLIMIENTO ESTRICTO DE MARCOS Y ZONAS SEGURAS (SAFE ZONES):
  - Margen Superior: Y <= +4.8 (libre de notch, batería y barra de búsqueda)
  - Margen Inferior: Y >= -3.0 (libre de pie de página, username, caption y botones)
  - Margen Lateral:  X in [-3.7, +3.3] (libre de botones de like, comment, share)
TIPOGRAFÍA MAXIMIZADA PARA MÓVIL:
  - Aprovechamiento óptimo del ancho disponible (fill width) sin desbordes.
  - Ecuaciones de olimpiada en gran escala para lectura instantánea en celular.
DURACIÓN: 193.65 SEGUNDOS (Sincronizado con narration_mcd.mp3)
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
config.background_color = "#F6F3EC"  # Papel marfil cálido / Paper Craft

class McdOlimpiadaViralShort(Scene):
    def construct(self):
        # Cámara para canvas vertical 9:16
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Helper para sincronización estricta con audio
        def sync_to(target_time):
            current = self.time
            dt = target_time - current
            if dt > 0.02:
                self.wait(dt)

        # Capa de fondo sutil (cuadrícula técnica)
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
        # ACTO 1: EL GANCHO DE OLIMPIADA Y LA SUPERCOMPUTADORA (0 - 27.45s)
        # =============================================================
        # Top Badge fijo dentro de Zona Segura (Y = 4.4)
        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())

        self.play(FadeIn(top_badge), FadeIn(top_badge_txt), run_time=1.0)

        # Enunciado de la serie (Y = 2.45)
        card_problem = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.8,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 2.45, 0]))
        
        prob_header = Text("Determinar el Máximo Común Divisor:", font_size=25, weight=BOLD, color="#154360").next_to(card_problem.get_top(), DOWN, buff=0.25)
        
        # Aprovechar el ancho de la tarjeta para máxima visibilidad
        prob_seq = MathTex(
            r"3^3 - 3, \;\; 5^5 - 5, \;\; \dots, \;\; 2007^{2007} - 2007",
            color="#1B2631"
        )
        prob_seq.set_width(6.5)
        prob_seq.next_to(prob_header, DOWN, buff=0.28)

        prob_target = MathTex(
            r"\mathbf{M.C.D.} = \;\; \mathbf{?}",
            font_size=48, color="#C0392B"
        ).next_to(prob_seq, DOWN, buff=0.25)

        self.play(Create(card_problem), FadeIn(prob_header), Write(prob_seq), Write(prob_target), run_time=2.0)

        # 20.16s: ¿Supercomputadora? La fuerza bruta es para robots
        sync_to(20.16)
        card_robot = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=2.4,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, -0.65, 0]))

        robot_title = Text("¿Fuerza Bruta / Supercomputadora?", font_size=25, weight=BOLD, color="#922B21").next_to(card_robot.get_top(), DOWN, buff=0.25)
        robot_cross = Text("La fuerza bruta es para los robots 🤖❌", font_size=24, color="#7B241C").next_to(robot_title, DOWN, buff=0.25)
        human_insight = Text("Los humanos vemos la estructura oculta 🧠✨", font_size=23, weight=BOLD, color="#196F3D").next_to(robot_cross, DOWN, buff=0.25)

        robot_group = VGroup(card_robot, robot_title, robot_cross, human_insight)
        self.play(FadeIn(robot_group), run_time=1.2)

        # =============================================================
        # ACTO 2: EL TECHO LÓGICO Y EL CANDIDATO 24 (27.45s - 53.65s)
        # =============================================================
        sync_to(27.45)
        self.play(FadeOut(robot_group), run_time=0.8)

        # Regla de oro del MCD
        card_bound = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=2.25,
            stroke_color="#1F618D", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -0.40, 0]))

        bound_title = Text("EL PRINCIPIO DE LA COTA SUPERIOR", font_size=24, weight=BOLD, color="#1B4F72").next_to(card_bound.get_top(), DOWN, buff=0.22)
        bound_desc = Text("El MCD jamás supera al número más pequeño:", font_size=22, color="#2C3E50").next_to(bound_title, DOWN, buff=0.22)
        bound_formula = MathTex(r"\mathbf{M.C.D.} \le \min(\{x_1, x_2, \dots\})", font_size=36, color="#154360").next_to(bound_desc, DOWN, buff=0.22)

        self.play(FadeIn(card_bound), FadeIn(bound_title), FadeIn(bound_desc), Write(bound_formula), run_time=1.5)

        # 36.62s: Calculemos solo el primer término (3^3 - 3)
        sync_to(36.62)
        box_24 = RoundedRectangle(
            corner_radius=0.20, width=6.8, height=0.90,
            stroke_color="#F39C12", stroke_width=2.5,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.00, 0]))
        calc_t1 = MathTex(r"3^3 - 3 = 27 - 3 = \mathbf{24}", font_size=46, color="#B7950B").move_to(box_24.get_center())

        self.play(Create(box_24), Write(calc_t1), run_time=1.5)

        # 46.46s: ¡Bum! Nuestro techo absoluto es 24
        sync_to(46.46)
        techo_tag = Text("TECHO ABSOLUTO: MCD ≤ 24", font_size=26, weight=BOLD, color="#9A7D0A").next_to(box_24, DOWN, buff=0.22)
        self.play(FadeIn(techo_tag), run_time=0.8)

        # =============================================================
        # ACTO 3: FACTORIZACIÓN Y DIFERENCIA DE CUADRADOS (53.65s - 106.93s)
        # =============================================================
        sync_to(53.65)
        # Transformar card_problem en una barra compacta superior
        problem_compact = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.0,
            stroke_color="#2C3E50", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 3.35, 0]))
        problem_compact_txt = MathTex(
            r"3^3 - 3, \; \dots, \; 2007^{2007} - 2007 \quad \mathbf{[Techo \le 24]}",
            color="#1B2631"
        )
        problem_compact_txt.set_width(6.6)
        problem_compact_txt.move_to(problem_compact.get_center())

        self.play(
            FadeOut(card_problem), FadeOut(prob_header), FadeOut(prob_seq), FadeOut(prob_target),
            FadeOut(card_bound), FadeOut(bound_title), FadeOut(bound_desc),
            FadeOut(bound_formula), FadeOut(calc_t1), FadeOut(box_24), FadeOut(techo_tag),
            FadeIn(problem_compact), FadeIn(problem_compact_txt),
            run_time=1.0
        )

        # Tarjeta de Factorización (y = 0.65)
        card_fact = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=3.9,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.65, 0]))

        fact_title = Text("INGENIERÍA INVERSA POLINÓMICA", font_size=25, weight=BOLD, color="#1B4F72").next_to(card_fact.get_top(), DOWN, buff=0.25)

        # Expresión general para n impar aprovechando el ancho
        step_f1 = MathTex(r"\text{Forma general: } n^n - n \quad (n \text{ impar})", color="#1B2631")
        step_f1.set_width(6.4)
        step_f1.next_to(fact_title, DOWN, buff=0.28)

        step_f2 = MathTex(r"= n(n^{n-1} - 1)", font_size=46, color="#D35400").next_to(step_f1, DOWN, buff=0.25)

        self.play(FadeIn(card_fact), FadeIn(fact_title), Write(step_f1), Write(step_f2), run_time=2.0)

        # 77.20s: Como n es impar, n - 1 es PAR! (Badge centrado perfectamente)
        sync_to(77.20)
        badge_par = RoundedRectangle(
            corner_radius=0.18, width=6.8, height=0.75,
            stroke_color="#8E44AD", stroke_width=2.2,
            fill_color="#F4ECF7", fill_opacity=0.95
        ).next_to(step_f2, DOWN, buff=0.25)
        badge_par.set_x(card_fact.get_x())

        badge_par_txt = MathTex(r"n \text{ impar } \implies (n - 1) \text{ es un número PAR}", color="#6C3483")
        badge_par_txt.set_width(6.3)
        badge_par_txt.move_to(badge_par.get_center())

        self.play(FadeIn(badge_par), FadeIn(badge_par_txt), run_time=1.2)

        # 87.44s: Al ser exponente par, contiene al factor n^2 - 1
        sync_to(87.44)
        step_f3 = MathTex(
            r"\implies (n^2 - 1) \text{ divide a } (n^{n-1} - 1)",
            color="#154360"
        )
        step_f3.set_width(6.3)
        step_f3.next_to(badge_par, DOWN, buff=0.25)
        step_f3.set_x(card_fact.get_x())
        self.play(Write(step_f3), run_time=1.5)

        # 98.88s: Diferencia de cuadrados n^2 - 1 = (n - 1)(n + 1)
        sync_to(98.88)
        card_dif = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.35,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.25, 0]))

        dif_txt = MathTex(
            r"n^2 - 1 = (n - 1)(n + 1) \quad \text{[Diferencia de Cuadrados]}",
            color="#922B21"
        )
        dif_txt.set_width(6.6)
        dif_txt.move_to(card_dif.get_center())

        self.play(FadeIn(card_dif), Write(dif_txt), run_time=1.5)

        # =============================================================
        # ACTO 4: LA ESCALERA DE 3 ENTEROS CONSECUTIVOS (106.93s - 150.85s)
        # =============================================================
        sync_to(106.93)
        self.play(
            FadeOut(card_fact), FadeOut(fact_title), FadeOut(step_f1),
            FadeOut(step_f2), FadeOut(badge_par), FadeOut(badge_par_txt),
            FadeOut(step_f3), FadeOut(card_dif), FadeOut(dif_txt),
            run_time=0.8
        )

        escalera_header = Text("TRES BLOQUES CONSECUTIVOS: LA ESCALERA", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, 2.45, 0]))
        escalera_formula = MathTex(
            r"(n - 1) \cdot n \cdot (n + 1)",
            font_size=46, color="#1B2631"
        ).move_to(np.array([-0.2, 1.80, 0]))

        self.play(FadeIn(escalera_header), Write(escalera_formula), run_time=1.5)

        # 120.16s: Dibujo de las 3 barras (Escalera)
        sync_to(120.16)
        bar_base = Line(start=np.array([-2.5, -0.85, 0]), end=np.array([2.1, -0.85, 0]), stroke_color="#7B241C", stroke_width=3.2)

        # Caso 1: 6, 7, 8
        bar1 = Rectangle(width=1.1, height=1.0, stroke_color="#D35400", stroke_width=2.5, fill_color="#FAD7A0", fill_opacity=0.85).move_to(np.array([-1.4, -0.35, 0]))
        bar2 = Rectangle(width=1.1, height=1.45, stroke_color="#D35400", stroke_width=2.5, fill_color="#F5B041", fill_opacity=0.85).move_to(np.array([-0.2, -0.125, 0]))
        bar3 = Rectangle(width=1.1, height=1.9, stroke_color="#D35400", stroke_width=2.5, fill_color="#EB984E", fill_opacity=0.85).move_to(np.array([1.0, 0.10, 0]))

        lbl_6 = MathTex(r"6", font_size=36, color="#1B2631").next_to(bar1, DOWN, buff=0.18)
        lbl_7 = MathTex(r"7", font_size=36, color="#D35400").next_to(bar2, DOWN, buff=0.18)
        lbl_8 = MathTex(r"8", font_size=36, color="#1B2631").next_to(bar3, DOWN, buff=0.18)

        self.play(
            Create(bar_base),
            GrowFromEdge(bar1, DOWN), GrowFromEdge(bar2, DOWN), GrowFromEdge(bar3, DOWN),
            FadeIn(lbl_6), FadeIn(lbl_7), FadeIn(lbl_8),
            run_time=2.0
        )

        # 125.36s: Propiedad del múltiplo de 3
        sync_to(125.36)
        tag_mult3 = MathTex(r"\text{múltiplo de } 3", font_size=23, color="#C0392B").next_to(bar1, UP, buff=0.15)
        arr_mult3 = Arrow(start=tag_mult3.get_bottom(), end=bar1.get_top(), color="#C0392B", stroke_width=2.5, buff=0.08)

        badge_regla3 = RoundedRectangle(
            corner_radius=0.16, width=7.2, height=0.80,
            stroke_color="#1E8449", stroke_width=2.2,
            fill_color="#E8F8F5", fill_opacity=0.95
        ).move_to(np.array([-0.2, -1.80, 0]))
        badge_regla3_txt = Text("En 3 enteros consecutivos:\n¡uno siempre es múltiplo de 3!", font_size=22, color="#196F3D", line_spacing=1.15).move_to(badge_regla3.get_center())

        self.play(FadeIn(tag_mult3), Create(arr_mult3), FadeIn(badge_regla3), FadeIn(badge_regla3_txt), run_time=1.5)

        # 133.00s: Como n es impar, los vecinos son pares: múltiplo de 2 y de 4!
        sync_to(133.00)
        lbl_4 = MathTex(r"4", font_size=36, color="#1B2631").next_to(bar1, DOWN, buff=0.18)
        lbl_5 = MathTex(r"5", font_size=36, color="#D35400").next_to(bar2, DOWN, buff=0.18)
        lbl_6_right = MathTex(r"6", font_size=36, color="#1B2631").next_to(bar3, DOWN, buff=0.18)

        tag_mult4 = MathTex(r"\text{múltiplo de } 4", font_size=23, color="#2980B9").next_to(bar1, UP, buff=0.15)
        tag_mult2 = MathTex(r"\text{múltiplo de } 2", font_size=23, color="#2980B9").next_to(bar3, UP, buff=0.15)

        badge_regla_pares = RoundedRectangle(
            corner_radius=0.16, width=7.2, height=0.75,
            stroke_color="#2980B9", stroke_width=2.2,
            fill_color="#EBF5FB", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.65, 0]))
        badge_regla_pares_txt = MathTex(
            r"\text{Dos pares consecutivos } \implies 2 \times 4 = \mathbf{8}",
            color="#154360"
        )
        badge_regla_pares_txt.set_width(6.5)
        badge_regla_pares_txt.move_to(badge_regla_pares.get_center())

        self.play(
            Transform(lbl_6, lbl_4), Transform(lbl_7, lbl_5), Transform(lbl_8, lbl_6_right),
            Transform(tag_mult3, tag_mult4),
            FadeIn(tag_mult2),
            FadeIn(badge_regla_pares), FadeIn(badge_regla_pares_txt),
            run_time=2.0
        )

        # =============================================================
        # ACTO 5: GENÉTICA DE FACTORES Y CONCLUSIÓN 24 (150.85s - 175.00s)
        # =============================================================
        sync_to(150.85)
        self.play(
            FadeOut(escalera_header), FadeOut(escalera_formula),
            FadeOut(bar_base), FadeOut(bar1), FadeOut(bar2), FadeOut(bar3),
            FadeOut(lbl_6), FadeOut(lbl_7), FadeOut(lbl_8),
            FadeOut(tag_mult3), FadeOut(tag_mult2), FadeOut(arr_mult3),
            FadeOut(badge_regla3), FadeOut(badge_regla3_txt),
            FadeOut(badge_regla_pares), FadeOut(badge_regla_pares_txt),
            run_time=0.8
        )

        # Tarjeta de Síntesis Genética
        card_gen = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=3.7,
            stroke_color="#1E8449", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.65, 0]))

        gen_title = Text("GENÉTICA DE DIVISIBILIDAD", font_size=26, weight=BOLD, color="#196F3D").next_to(card_gen.get_top(), DOWN, buff=0.25)

        prod_formula = MathTex(
            r"(\text{Múltiplo de } 3) \times (\text{Múltiplo de } 8)",
            color="#154360"
        )
        prod_formula.set_width(6.5)
        prod_formula.next_to(gen_title, DOWN, buff=0.3)

        prod_res = MathTex(
            r"3 \times 8 = \mathbf{24}",
            font_size=52, color="#B7950B"
        ).next_to(prod_formula, DOWN, buff=0.25)

        div_txt = MathTex(
            r"\implies \mathbf{24} \mid (n^n - n) \quad \forall \; n \text{ impar}",
            color="#1B2631"
        )
        div_txt.set_width(6.5)
        div_txt.next_to(prod_res, DOWN, buff=0.28)

        self.play(FadeIn(card_gen), FadeIn(gen_title), Write(prod_formula), Write(prod_res), Write(div_txt), run_time=2.0)

        # 165.80s: Conjunto Solución / M.C.D. = 24
        sync_to(165.80)
        sol_box_final = RoundedRectangle(
            corner_radius=0.20, width=6.8, height=1.1,
            stroke_color="#27AE60", stroke_width=2.8,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.15, 0]))
        sol_math_final = MathTex(r"\mathbf{M.C.D.} = \mathbf{24}", font_size=54, color="#196F3D").move_to(sol_box_final.get_center())

        self.play(Create(sol_box_final), Write(sol_math_final), run_time=1.5)

        # =============================================================
        # ACTO 6: CRIPTOGRAFÍA, CURVAS ELÍPTICAS Y CIERRE (175.00s - 193.65s)
        # =============================================================
        sync_to(175.00)
        all_work_objects = VGroup(
            problem_compact, problem_compact_txt,
            card_gen, gen_title, prod_formula, prod_res, div_txt,
            sol_box_final, sol_math_final
        )
        self.play(FadeOut(all_work_objects), run_time=0.8)

        card_crypto = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=4.5,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.85, 0]))

        crypto_header = Text("CRIPTOGRAFÍA MODERNA", font_size=25, weight=BOLD, color="#7B241C").next_to(card_crypto.get_top(), DOWN, buff=0.25)
        crypto_sub = Text("RSA y Curvas Elípticas", font_size=22, weight=BOLD, color="#B7950B").next_to(crypto_header, DOWN, buff=0.16)
        crypto_desc = Text("El principio aritmético de divisibilidad\nque encripta tus transacciones bancarias.", font_size=21, color="#2C3E50", line_spacing=1.2).next_to(crypto_sub, DOWN, buff=0.2)

        # Candado Isométrico en Líneas Doradas
        lock_body = RoundedRectangle(
            corner_radius=0.16, width=2.0, height=1.45,
            stroke_color="#F39C12", stroke_width=3.0,
            fill_color="#FEF9E7", fill_opacity=0.9
        ).move_to(np.array([-0.2, -0.3, 0]))
        lock_shackle = Arc(radius=0.6, start_angle=0, angle=np.pi, color="#F39C12", stroke_width=3.5).next_to(lock_body, UP, buff=-0.1)
        lock_keyhole = Dot(lock_body.get_center(), radius=0.10, color="#7B241C")
        lock_slot = Line(start=lock_body.get_center(), end=lock_body.get_center() + DOWN*0.25, stroke_color="#7B241C", stroke_width=2.5)

        lock_group = VGroup(lock_body, lock_shackle, lock_keyhole, lock_slot)

        # Fórmulas criptográficas flotantes
        eq_rsa = MathTex(r"c \equiv m^e \pmod{n}", font_size=26, color="#154360").next_to(lock_group, LEFT, buff=0.22)
        eq_gcd = MathTex(r"\gcd(e, \phi(n)) = 1", font_size=23, color="#154360").next_to(lock_group, RIGHT, buff=0.22)

        self.play(
            FadeIn(card_crypto), FadeIn(crypto_header), FadeIn(crypto_sub), FadeIn(crypto_desc),
            Create(lock_group), Write(eq_rsa), Write(eq_gcd),
            run_time=2.0
        )

        # 189.02s: Cierre filosófico y Call to Action (Y = -2.35, dentro de zona segura)
        sync_to(189.02)
        cta_card = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=1.35,
            stroke_color="#1E8449", stroke_width=2.2,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.35, 0]))

        cta_quote = Text("Las matemáticas no se memorizan, se descifran.", font_size=21, weight=BOLD, color="#196F3D").next_to(cta_card.get_top(), DOWN, buff=0.22)
        cta_sub = Text("➕ Síguenos en Zénit para más retos de olimpiada", font_size=19, color="#2C3E50").next_to(cta_quote, DOWN, buff=0.18)

        self.play(FadeIn(cta_card), FadeIn(cta_quote), FadeIn(cta_sub), run_time=1.5)

        # Mantener hasta el final exacto del audio
        sync_to(193.65)

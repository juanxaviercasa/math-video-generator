# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path
import numpy as np

for _miktex_bin in (
    Path.home() / "AppData" / "Local" / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64",
    Path(r"C:\Program Files\MiKTeX\miktex\bin\x64"),
):
    if _miktex_bin.exists() and str(_miktex_bin) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(_miktex_bin) + os.pathsep + os.environ.get("PATH", "")

from manim import *

config.pixel_width = 720
config.pixel_height = 1280
config.frame_rate = 30
config.background_color = "#F6F3EC"

def add_grid(scene):
    grid_lines = VGroup()
    for x in range(-4, 5):
        line = Line(start=np.array([x, -8, 0]), end=np.array([x, 8, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
        grid_lines.add(line)
    for y in range(-7, 8):
        line = Line(start=np.array([-4.5, y, 0]), end=np.array([4.5, y, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
        grid_lines.add(line)
    scene.add(grid_lines)

# Acto 1 Frame Test
class TestAct1(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        # Card Problem con dimensiones optimizadas
        card_problem = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.8,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 2.45, 0]))
        
        prob_header = Text("Determinar el Máximo Común Divisor:", font_size=25, weight=BOLD, color="#154360").next_to(card_problem.get_top(), DOWN, buff=0.25)
        
        # Aprovechar todo el ancho disponible: set_width(6.5)
        prob_seq = MathTex(
            r"3^3 - 3, \;\; 5^5 - 5, \;\; \dots, \;\; 2007^{2007} - 2007",
            color="#1B2631"
        )
        prob_seq.set_width(6.5)
        prob_seq.next_to(prob_header, DOWN, buff=0.28)
        
        # M.C.D. = ? mucho más grande
        prob_target = MathTex(
            r"\mathbf{M.C.D.} = \;\; \mathbf{?}",
            font_size=48, color="#C0392B"
        ).next_to(prob_seq, DOWN, buff=0.25)

        self.add(card_problem, prob_header, prob_seq, prob_target)

        # Card Robot
        card_robot = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=2.4,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, -0.65, 0]))

        robot_title = Text("¿Fuerza Bruta / Supercomputadora?", font_size=25, weight=BOLD, color="#922B21").next_to(card_robot.get_top(), DOWN, buff=0.25)
        robot_cross = Text("La fuerza bruta es para los robots 🤖❌", font_size=24, color="#7B241C").next_to(robot_title, DOWN, buff=0.25)
        human_insight = Text("Los humanos vemos la estructura oculta 🧠✨", font_size=23, weight=BOLD, color="#196F3D").next_to(robot_cross, DOWN, buff=0.25)
        self.add(card_robot, robot_title, robot_cross, human_insight)

# Acto 2 Frame Test
class TestAct2(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        card_problem = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.7,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 2.45, 0]))
        prob_header = Text("Determinar el Máximo Común Divisor:", font_size=25, weight=BOLD, color="#154360").next_to(card_problem.get_top(), DOWN, buff=0.25)
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
        self.add(card_problem, prob_header, prob_seq, prob_target)

        card_bound = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=2.25,
            stroke_color="#1F618D", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -0.40, 0]))

        bound_title = Text("EL PRINCIPIO DE LA COTA SUPERIOR", font_size=24, weight=BOLD, color="#1B4F72").next_to(card_bound.get_top(), DOWN, buff=0.22)
        bound_desc = Text("El MCD jamás supera al número más pequeño:", font_size=22, color="#2C3E50").next_to(bound_title, DOWN, buff=0.22)
        bound_formula = MathTex(r"\mathbf{M.C.D.} \le \min(\{x_1, x_2, \dots\})", font_size=36, color="#154360").next_to(bound_desc, DOWN, buff=0.22)
        self.add(card_bound, bound_title, bound_desc, bound_formula)

        box_24 = RoundedRectangle(
            corner_radius=0.20, width=6.8, height=0.90,
            stroke_color="#F39C12", stroke_width=2.5,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.00, 0]))
        calc_t1 = MathTex(r"3^3 - 3 = 27 - 3 = \mathbf{24}", font_size=46, color="#B7950B").move_to(box_24.get_center())
        self.add(box_24, calc_t1)

        techo_tag = Text("TECHO ABSOLUTO: MCD ≤ 24", font_size=26, weight=BOLD, color="#9A7D0A").next_to(box_24, DOWN, buff=0.22)
        self.add(techo_tag)

# Acto 3 Frame Test (El frame de 01:45)
class TestAct3(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

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
        self.add(problem_compact, problem_compact_txt)

        # Factorización
        card_fact = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=3.9,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.65, 0]))

        fact_title = Text("INGENIERÍA INVERSA POLINÓMICA", font_size=25, weight=BOLD, color="#1B4F72").next_to(card_fact.get_top(), DOWN, buff=0.25)
        
        step_f1 = MathTex(r"\text{Forma general: } n^n - n \quad (n \text{ impar})", color="#1B2631")
        step_f1.set_width(6.4)
        step_f1.next_to(fact_title, DOWN, buff=0.28)

        step_f2 = MathTex(r"= n(n^{n-1} - 1)", font_size=46, color="#D35400").next_to(step_f1, DOWN, buff=0.25)

        badge_par = RoundedRectangle(
            corner_radius=0.18, width=6.8, height=0.75,
            stroke_color="#8E44AD", stroke_width=2.2,
            fill_color="#F4ECF7", fill_opacity=0.95
        ).next_to(step_f2, DOWN, buff=0.25)
        badge_par.set_x(card_fact.get_x())

        badge_par_txt = MathTex(r"n \text{ impar } \implies (n - 1) \text{ es un número PAR}", color="#6C3483")
        badge_par_txt.set_width(6.3)
        badge_par_txt.move_to(badge_par.get_center())

        step_f3 = MathTex(
            r"\implies (n^2 - 1) \text{ divide a } (n^{n-1} - 1)",
            color="#154360"
        )
        step_f3.set_width(6.3)
        step_f3.next_to(badge_par, DOWN, buff=0.25)
        step_f3.set_x(card_fact.get_x())

        self.add(card_fact, fact_title, step_f1, step_f2, badge_par, badge_par_txt, step_f3)

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
        self.add(card_dif, dif_txt)

# Acto 4 Frame Test (Escalera)
class TestAct4(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

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
        self.add(problem_compact, problem_compact_txt)

        escalera_header = Text("TRES BLOQUES CONSECUTIVOS: LA ESCALERA", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, 2.45, 0]))
        escalera_formula = MathTex(
            r"(n - 1) \cdot n \cdot (n + 1)",
            font_size=46, color="#1B2631"
        ).move_to(np.array([-0.2, 1.80, 0]))
        self.add(escalera_header, escalera_formula)

        bar_base = Line(start=np.array([-2.5, -0.85, 0]), end=np.array([2.1, -0.85, 0]), stroke_color="#7B241C", stroke_width=3.2)
        
        bar1 = Rectangle(width=1.1, height=1.0, stroke_color="#D35400", stroke_width=2.5, fill_color="#FAD7A0", fill_opacity=0.85).move_to(np.array([-1.4, -0.35, 0]))
        bar2 = Rectangle(width=1.1, height=1.45, stroke_color="#D35400", stroke_width=2.5, fill_color="#F5B041", fill_opacity=0.85).move_to(np.array([-0.2, -0.125, 0]))
        bar3 = Rectangle(width=1.1, height=1.9, stroke_color="#D35400", stroke_width=2.5, fill_color="#EB984E", fill_opacity=0.85).move_to(np.array([1.0, 0.10, 0]))

        lbl_4 = MathTex(r"4", font_size=36, color="#1B2631").next_to(bar1, DOWN, buff=0.18)
        lbl_5 = MathTex(r"5", font_size=36, color="#D35400").next_to(bar2, DOWN, buff=0.18)
        lbl_6_right = MathTex(r"6", font_size=36, color="#1B2631").next_to(bar3, DOWN, buff=0.18)

        tag_mult4 = MathTex(r"\text{múltiplo de } 4", font_size=23, color="#2980B9").next_to(bar1, UP, buff=0.15)
        tag_mult2 = MathTex(r"\text{múltiplo de } 2", font_size=23, color="#2980B9").next_to(bar3, UP, buff=0.15)

        badge_regla3 = RoundedRectangle(
            corner_radius=0.16, width=7.2, height=0.80,
            stroke_color="#1E8449", stroke_width=2.2,
            fill_color="#E8F8F5", fill_opacity=0.95
        ).move_to(np.array([-0.2, -1.80, 0]))
        badge_regla3_txt = Text("En 3 enteros consecutivos:\n¡uno siempre es múltiplo de 3!", font_size=22, color="#196F3D", line_spacing=1.15).move_to(badge_regla3.get_center())

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

        self.add(bar_base, bar1, bar2, bar3, lbl_4, lbl_5, lbl_6_right, tag_mult4, tag_mult2, badge_regla3, badge_regla3_txt, badge_regla_pares, badge_regla_pares_txt)

# Acto 5 Frame Test
class TestAct5(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

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
        self.add(problem_compact, problem_compact_txt)

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

        self.add(card_gen, gen_title, prod_formula, prod_res, div_txt)

        sol_box_final = RoundedRectangle(
            corner_radius=0.20, width=6.8, height=1.1,
            stroke_color="#27AE60", stroke_width=2.8,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.15, 0]))
        sol_math_final = MathTex(r"\mathbf{M.C.D.} = \mathbf{24}", font_size=54, color="#196F3D").move_to(sol_box_final.get_center())
        self.add(sol_box_final, sol_math_final)

# Acto 6 Frame Test
class TestAct6(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=21, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        card_crypto = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=4.5,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.85, 0]))

        crypto_header = Text("CRIPTOGRAFÍA MODERNA", font_size=25, weight=BOLD, color="#7B241C").next_to(card_crypto.get_top(), DOWN, buff=0.25)
        crypto_sub = Text("RSA y Curvas Elípticas", font_size=22, weight=BOLD, color="#B7950B").next_to(crypto_header, DOWN, buff=0.16)
        crypto_desc = Text("El principio aritmético de divisibilidad\nque encripta tus transacciones bancarias.", font_size=21, color="#2C3E50", line_spacing=1.2).next_to(crypto_sub, DOWN, buff=0.2)

        lock_body = RoundedRectangle(
            corner_radius=0.16, width=2.0, height=1.45,
            stroke_color="#F39C12", stroke_width=3.0,
            fill_color="#FEF9E7", fill_opacity=0.9
        ).move_to(np.array([-0.2, -0.3, 0]))
        lock_shackle = Arc(radius=0.6, start_angle=0, angle=np.pi, color="#F39C12", stroke_width=3.5).next_to(lock_body, UP, buff=-0.1)
        lock_keyhole = Dot(lock_body.get_center(), radius=0.10, color="#7B241C")
        lock_slot = Line(start=lock_body.get_center(), end=lock_body.get_center() + DOWN*0.25, stroke_color="#7B241C", stroke_width=2.5)

        lock_group = VGroup(lock_body, lock_shackle, lock_keyhole, lock_slot)

        eq_rsa = MathTex(r"c \equiv m^e \pmod{n}", font_size=26, color="#154360").next_to(lock_group, LEFT, buff=0.22)
        eq_gcd = MathTex(r"\gcd(e, \phi(n)) = 1", font_size=23, color="#154360").next_to(lock_group, RIGHT, buff=0.22)

        self.add(card_crypto, crypto_header, crypto_sub, crypto_desc, lock_group, eq_rsa, eq_gcd)

        cta_card = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=1.35,
            stroke_color="#1E8449", stroke_width=2.2,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -2.35, 0]))

        cta_quote = Text("Las matemáticas no se memorizan, se descifran.", font_size=18, weight=BOLD, color="#196F3D").next_to(cta_card.get_top(), DOWN, buff=0.22)
        cta_sub = Text("➕ Síguenos en Zénit para más retos de olimpiada", font_size=19, color="#2C3E50").next_to(cta_quote, DOWN, buff=0.18)

        self.add(cta_card, cta_quote, cta_sub)

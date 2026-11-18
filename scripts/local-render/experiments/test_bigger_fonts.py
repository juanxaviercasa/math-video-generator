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

class TestBiggerFonts(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Cuadrícula
        grid_lines = VGroup()
        for x in range(-4, 5):
            line = Line(start=np.array([x, -8, 0]), end=np.array([x, 8, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        for y in range(-7, 8):
            line = Line(start=np.array([-4.5, y, 0]), end=np.array([4.5, y, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        self.add(grid_lines)

        # 1. TOP HEADER (Más grande y legible: font_size=24)
        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.75,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA", font_size=24, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        # 2. TARJETA COMPACTA SUPERIOR (font_size=25)
        problem_compact = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.05,
            stroke_color="#2C3E50", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 3.25, 0]))
        problem_compact_txt = MathTex(
            r"3^3 - 3, \; \dots, \; 2007^{2007} - 2007 \quad \mathbf{[Techo \le 24]}",
            font_size=25, color="#1B2631"
        ).move_to(problem_compact.get_center())
        self.add(problem_compact, problem_compact_txt)

        # 3. TARJETA DE FACTORIZACIÓN (Texto grande y centrado, sin salirse del recuadro)
        card_fact = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=3.8,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.45, 0]))

        fact_title = Text("INGENIERÍA INVERSA POLINÓMICA", font_size=22, weight=BOLD, color="#1B4F72").next_to(card_fact.get_top(), DOWN, buff=0.25)
        step_f1 = MathTex(r"\text{Forma general: } n^n - n \quad (n \text{ impar})", font_size=28, color="#1B2631").next_to(fact_title, DOWN, buff=0.28)
        step_f2 = MathTex(r"= n(n^{n-1} - 1)", font_size=34, color="#D35400").next_to(step_f1, DOWN, buff=0.25)

        # Badge de paridad centrado perfectamente con respecto a card_fact
        badge_par = RoundedRectangle(
            corner_radius=0.16, width=6.6, height=0.65,
            stroke_color="#8E44AD", stroke_width=2.2,
            fill_color="#F4ECF7", fill_opacity=0.95
        ).next_to(step_f2, DOWN, buff=0.25)
        badge_par.set_x(card_fact.get_x())
        badge_par_txt = MathTex(r"n \text{ impar } \implies (n - 1) \text{ es un número PAR}", font_size=24, color="#6C3483").move_to(badge_par.get_center())

        step_f3 = MathTex(
            r"\implies (n^2 - 1) \text{ divide a } (n^{n-1} - 1)",
            font_size=27, color="#154360"
        ).next_to(badge_par, DOWN, buff=0.25)
        step_f3.set_x(card_fact.get_x())

        self.add(card_fact, fact_title, step_f1, step_f2, badge_par, badge_par_txt, step_f3)

        # 4. TARJETA DIFERENCIA DE CUADRADOS (font_size=27)
        card_dif = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=1.35,
            stroke_color="#C0392B", stroke_width=2.2,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.4, 0]))

        dif_txt = MathTex(
            r"n^2 - 1 = (n - 1)(n + 1) \quad \text{[Diferencia de Cuadrados]}",
            font_size=25, color="#922B21"
        ).move_to(card_dif.get_center())

        self.add(card_dif, dif_txt)

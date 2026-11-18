# -*- coding: utf-8 -*-
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

config.pixel_width = 720
config.pixel_height = 1280
config.frame_rate = 30
config.background_color = "#F6F3EC"  # Papel marfil cálido

class TestLayoutMCD(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Cuadrícula sutil
        grid_lines = VGroup()
        for x in range(-4, 5):
            line = Line(start=np.array([x, -8, 0]), end=np.array([x, 8, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        for y in range(-7, 8):
            line = Line(start=np.array([-4.5, y, 0]), end=np.array([4.5, y, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        self.add(grid_lines)

        # -------------------------------------------------------------
        # ZONA SEGURA (SAFE ZONE) VISUALIZADA
        # Y in [-3.2, 4.8], X in [-3.7, 3.2]
        # -------------------------------------------------------------
        safe_box = Rectangle(
            width=6.9, height=8.0,
            stroke_color="#27AE60", stroke_width=1.5, stroke_opacity=0.3
        ).move_to(np.array([-0.25, 0.8, 0]))
        # self.add(safe_box)  # Solo para referencia

        # 1. TOP HEADER (Dentro de zona segura: y = 4.4)
        top_badge = RoundedRectangle(
            corner_radius=0.16, width=6.6, height=0.6,
            stroke_color="#7B241C", stroke_width=2.0,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.25, 4.4, 0]))
        top_badge_txt = Text("OLIMPIADA MATEMÁTICA · TEORÍA DE NÚMEROS", font_size=17, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        # 2. ENUNCIADO DEL PROBLEMA (y = 3.3)
        problem_card = RoundedRectangle(
            corner_radius=0.22, width=6.8, height=1.3,
            stroke_color="#2C3E50", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.25, 3.3, 0]))
        problem_txt = MathTex(
            r"\mathbf{MCD}\left(3^3 - 3, \; 5^5 - 5, \; \dots, \; 2007^{2007} - 2007\right)",
            font_size=25, color="#1B2631"
        ).move_to(problem_card.get_center())
        self.add(problem_card, problem_txt)

        # 3. ESCALERA DE 3 ENTEROS CONSECUTIVOS (y = 1.0)
        formula_escalera = MathTex(
            r"(n - 1) \cdot n \cdot (n + 1)",
            font_size=32, color="#1B2631"
        ).move_to(np.array([-0.25, 2.2, 0]))
        self.add(formula_escalera)

        # Tres barras escalonadas
        bar1 = Rectangle(width=1.0, height=1.4, stroke_color="#D35400", stroke_width=2.5, fill_color="#FAD7A0", fill_opacity=0.85).move_to(np.array([-1.5, 0.7, 0]))
        bar2 = Rectangle(width=1.0, height=2.0, stroke_color="#D35400", stroke_width=2.5, fill_color="#F5B041", fill_opacity=0.85).move_to(np.array([-0.25, 1.0, 0]))
        bar3 = Rectangle(width=1.0, height=2.6, stroke_color="#D35400", stroke_width=2.5, fill_color="#EB984E", fill_opacity=0.85).move_to(np.array([1.0, 1.3, 0]))
        base_line = Line(start=np.array([-2.4, 0.0, 0]), end=np.array([1.9, 0.0, 0]), stroke_color="#7B241C", stroke_width=3.0)

        lbl_bar1 = MathTex(r"4", font_size=24, color="#1B2631").next_to(bar1, DOWN, buff=0.15)
        lbl_bar2 = MathTex(r"5", font_size=24, color="#D35400").next_to(bar2, DOWN, buff=0.15)
        lbl_bar3 = MathTex(r"6", font_size=24, color="#1B2631").next_to(bar3, DOWN, buff=0.15)

        tag_mult4 = MathTex(r"\text{múltiplo de } 4", font_size=18, color="#C0392B").next_to(bar1, UP, buff=0.15)
        tag_mult2 = MathTex(r"\text{múltiplo de } 2", font_size=18, color="#C0392B").next_to(bar3, UP, buff=0.15)

        self.add(base_line, bar1, bar2, bar3, lbl_bar1, lbl_bar2, lbl_bar3, tag_mult4, tag_mult2)

        # 4. TARJETA DE DEDUCCIÓN Y RESPUESTA (y = -1.8)
        # Termina en y = -3.0, dejando 5.0 unidades libres hasta el fondo (-8.0)
        card_deduccion = RoundedRectangle(
            corner_radius=0.22, width=6.8, height=2.4,
            stroke_color="#1F618D", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.25, -1.8, 0]))

        header_ded = RoundedRectangle(
            corner_radius=0.14, width=6.4, height=0.45,
            stroke_color="#1B4F72", stroke_width=1.5,
            fill_color="#EBF5FB", fill_opacity=0.9
        ).move_to(card_deduccion.get_top() + DOWN * 0.35)
        header_ded_txt = Text("GENÉTICA DE FACTORES", font_size=18, weight=BOLD, color="#1B4F72").move_to(header_ded.get_center())

        step_gen = MathTex(
            r"\text{Múltiplo de 3} \times \text{Múltiplo de 8} \implies 3 \times 8 = 24",
            font_size=22, color="#1B2631"
        ).next_to(header_ded, DOWN, buff=0.25)

        sol_box = RoundedRectangle(
            corner_radius=0.16, width=5.2, height=0.65,
            stroke_color="#27AE60", stroke_width=2.5,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).next_to(step_gen, DOWN, buff=0.22)
        sol_txt = MathTex(r"\mathbf{M.C.D.} = \mathbf{24}", font_size=28, color="#196F3D").move_to(sol_box.get_center())

        self.add(card_deduccion, header_ded, header_ded_txt, step_gen, sol_box, sol_txt)

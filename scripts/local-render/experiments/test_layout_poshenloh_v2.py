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

class TestPoshenCalibrated(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        # 1. Top badge (Y in [4.08, 4.76])
        top_badge = RoundedRectangle(
            corner_radius=0.18, width=7.2, height=0.68,
            stroke_color="#7B241C", stroke_width=2.5,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([-0.2, 4.42, 0]))
        top_badge_txt = Text("MÉTODO PO-SHEN LOH (2019)", font_size=22, weight=BOLD, color="#7B241C").move_to(top_badge.get_center())
        self.add(top_badge, top_badge_txt)

        # 2. Equation Box (Y in [3.07, 3.89])
        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=0.82,
            stroke_color="#2C3E50", stroke_width=2.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 3.48, 0]))
        eq_text = MathTex("x^2", "-", "6x", "+", "5", "=", "0", font_size=46, color="#1B2631").move_to(eq_box.get_center())
        self.add(eq_box, eq_text)

        # c = 5 highlight & tag in open space
        highlight_c = RoundedRectangle(
            corner_radius=0.10, width=0.75, height=0.60,
            stroke_color="#F39C12", stroke_width=2.2,
            fill_color="#FEF9E7", fill_opacity=0.6
        ).move_to(eq_text[4].get_center())
        tag_c = Text("c = 5", font_size=13, weight=BOLD, color="#B7950B").move_to(np.array([eq_text[4].get_x(), 4.00, 0]))
        self.add(highlight_c, tag_c)

        # 3. Compact Axes (Y centered at 1.80)
        axes = Axes(
            x_range=[-0.5, 6.5, 1],
            y_range=[-4.5, 5.0, 2],
            x_length=6.5,
            y_length=1.65,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.2,
                "include_tip": True,
                "tip_width": 0.12,
                "tip_height": 0.12,
            },
        ).move_to(np.array([-0.2, 1.80, 0]))

        axes.get_x_axis().add_numbers([2, 4, 6], font_size=15, color="#2C3E50")

        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[0.6, 5.4],
            color="#E67E22",
            stroke_width=3.6,
        )
        self.add(axes, parabola)

        # Symmetry Axis & Label (Y below eq_box, well above axes)
        sym_line = DashedLine(
            start=axes.c2p(3, -4.2),
            end=axes.c2p(3, 3.5),
            dash_length=0.10,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.2,
        )
        sym_label = Text("Eje de Simetría (Espejo)", font_size=14, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 3.5), UP, buff=0.08)

        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.09)
        center_lbl = Text("Centro (x=3)", font_size=14, weight=BOLD, color="#1F618D").next_to(dot_center, UP, buff=0.08)

        dot_r1 = Dot(axes.c2p(1, 0), color="#27AE60", radius=0.09)
        dot_r2 = Dot(axes.c2p(5, 0), color="#27AE60", radius=0.09)

        r1_lbl = MathTex(r"x_1 = 1", font_size=16, color="#1E8449").next_to(dot_r1, DOWN, buff=0.10)
        r2_lbl = MathTex(r"x_2 = 5", font_size=16, color="#1E8449").next_to(dot_r2, DOWN, buff=0.10)

        arrow_l = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=2.8, buff=0)
        arrow_r = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=2.8, buff=0)

        lbl_u_l = MathTex(r"-u", font_size=18, color="#C0392B").next_to(arrow_l, UP, buff=0.06)
        lbl_u_r = MathTex(r"+u", font_size=18, color="#27AE60").next_to(arrow_r, UP, buff=0.06)

        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.10)
        depth_arrow = Arrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=2.8, buff=0)
        depth_card = RoundedRectangle(
            corner_radius=0.12, width=2.1, height=0.40,
            stroke_color="#C0392B", stroke_width=1.8,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).move_to(np.array([1.10, 1.25, 0]))
        depth_txt = MathTex(r"\text{Profundidad } u^2 = 4", font_size=14, color="#922B21").move_to(depth_card.get_center())

        self.add(sym_line, sym_label, dot_center, center_lbl, dot_r1, dot_r2, r1_lbl, r2_lbl, arrow_l, arrow_r, lbl_u_l, lbl_u_r, dot_vertex, depth_arrow, depth_card, depth_txt)

        # 4. Tarjeta Inferior de Deducción Matemática (Y in [-2.95, 0.80])
        card_ded = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=3.75,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -1.075, 0]))

        ded_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, 0.52, 0]))

        step1 = MathTex(r"\text{1. Centro: } x_0 = -\frac{b}{2a} = -\frac{-6}{2(1)} = \mathbf{3}", font_size=27, color="#1B2631").move_to(np.array([-0.2, -0.05, 0]))
        step2 = MathTex(r"\text{2. Raíces simétricas: } x_1 = 3 - u, \quad x_2 = 3 + u", font_size=27, color="#154360").move_to(np.array([-0.2, -0.55, 0]))
        step3 = MathTex(r"\text{3. Producto: } (3 - u)(3 + u) = 5", font_size=27, color="#C0392B").move_to(np.array([-0.2, -1.02, 0]))
        step4 = MathTex(r"\text{4. Diferencia: } 9 - u^2 = 5 \implies u^2 = \mathbf{4}", font_size=27, color="#D35400").move_to(np.array([-0.2, -1.48, 0]))
        step5_u = MathTex(r"\text{5. Distancia: } u = \sqrt{4} = \mathbf{2}", font_size=27, color="#27AE60").move_to(np.array([-0.2, -1.95, 0]))

        sol_box = RoundedRectangle(
            corner_radius=0.15, width=6.6, height=0.58,
            stroke_color="#27AE60", stroke_width=2.2,
            fill_color="#E8F8F5", fill_opacity=0.95
        ).move_to(np.array([-0.2, -2.55, 0]))

        sol_math = MathTex(r"\textbf{Solución:} \;\; x_1 = 3 - 2 = \mathbf{1}, \quad x_2 = 3 + 2 = \mathbf{5}", font_size=27, color="#196F3D")
        sol_math.move_to(sol_box.get_center())

        self.add(card_ded, ded_title, step1, step2, step3, step4, step5_u, sol_box, sol_math)

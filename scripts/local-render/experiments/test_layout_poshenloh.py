# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path

# Add MiKTeX to PATH for MathTex
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
config.background_color = "#F6F3EC"  # Paper ivory background

class TestLayout(Scene):
    def construct(self):
        # Camera adjustments for 9:16
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Background subtle graph grid lines
        grid_lines = VGroup()
        for x in range(-4, 5):
            line = Line(start=np.array([x, -8, 0]), end=np.array([x, 8, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        for y in range(-7, 8):
            line = Line(start=np.array([-4.5, y, 0]), end=np.array([4.5, y, 0]), stroke_color="#E7E2D5", stroke_width=1.0)
            grid_lines.add(line)
        self.add(grid_lines)

        # 1. TOP ZONE: Header and Main Equation Card
        header_badge = RoundedRectangle(corner_radius=0.18, width=5.6, height=0.65, stroke_color="#A93226", stroke_width=2.5, fill_color="#FDEDEC", fill_opacity=0.95).move_to(UP * 7.1)
        header_text = Text("MÉTODO PO-SHEN LOH (2019)", font_size=20, weight=BOLD, color="#922B21").move_to(header_badge.get_center())

        eq_card = RoundedRectangle(corner_radius=0.25, width=7.2, height=1.3, stroke_color="#2C3E50", stroke_width=2.5, fill_color="#FFFFFF", fill_opacity=0.95).move_to(UP * 5.8)
        eq_math = MathTex(r"x^2 - 6x + 5 = 0", font_size=46, color="#1B2631").move_to(eq_card.get_center())
        
        self.add(header_badge, header_text, eq_card, eq_math)

        # 2. MIDDLE ZONE: Axes and Parabola
        axes = Axes(
            x_range=[-0.5, 6.5, 1],
            y_range=[-4.8, 5.5, 2],
            x_length=6.6,
            y_length=4.4,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.5,
                "include_tip": True,
                "tip_width": 0.18,
                "tip_height": 0.18,
            },
        ).move_to(UP * 2.3)

        # Numbers on axes
        x_labels = axes.get_x_axis().add_numbers([1, 2, 3, 4, 5, 6], font_size=20, color="#2C3E50")
        y_labels = axes.get_y_axis().add_numbers([-4, -2, 2, 4], font_size=18, color="#2C3E50")

        # Parabola curve
        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[-0.1, 6.1],
            color="#E67E22",
            stroke_width=4.5,
        )

        # Symmetry vertical axis at x=3
        sym_line = DashedLine(
            start=axes.c2p(3, -4.6),
            end=axes.c2p(3, 5.2),
            dash_length=0.15,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.5,
        )
        sym_label = Text("Eje x = 3", font_size=18, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 5.2), UP, buff=0.1)

        # Roots points at (1, 0) and (5, 0)
        dot_r1 = Dot(axes.c2p(1, 0), color="#27AE60", radius=0.12)
        dot_r2 = Dot(axes.c2p(5, 0), color="#27AE60", radius=0.12)
        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.10)

        # Distance vectors u
        arrow_left = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=3.5, max_tip_length_to_length_ratio=0.25, buff=0)
        arrow_right = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=3.5, max_tip_length_to_length_ratio=0.25, buff=0)

        label_u_left = MathTex(r"-u", font_size=28, color="#C0392B").next_to(arrow_left, UP, buff=0.12)
        label_u_right = MathTex(r"+u", font_size=28, color="#27AE60").next_to(arrow_right, UP, buff=0.12)

        # Vertex point and depth bar
        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.12)
        depth_bar = DoubleArrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=3.0, buff=0)
        depth_text = MathTex(r"\text{Profundidad } = u^2 = 4", font_size=22, color="#C0392B").next_to(depth_bar, RIGHT, buff=0.15)

        self.add(axes, x_labels, y_labels, parabola, sym_line, sym_label, dot_r1, dot_r2, dot_center, arrow_left, arrow_right, label_u_left, label_u_right, dot_vertex, depth_bar, depth_text)

        # 3. BOTTOM ZONE: Mathematical Reasoning Card
        calc_card = RoundedRectangle(corner_radius=0.25, width=7.6, height=5.2, stroke_color="#2C3E50", stroke_width=2.5, fill_color="#FFFFFF", fill_opacity=0.98).move_to(DOWN * 4.2)
        card_header = RoundedRectangle(corner_radius=0.15, width=7.2, height=0.55, stroke_color="#1F618D", stroke_width=1.5, fill_color="#EBF5FB", fill_opacity=0.9).move_to(calc_card.get_top() + DOWN * 0.45)
        card_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=20, weight=BOLD, color="#1B4F72").move_to(card_header.get_center())

        step1 = MathTex(r"\text{1. Centro: } x_0 = -\frac{b}{2a} = -\frac{-6}{2} = 3", font_size=26, color="#1B2631").next_to(card_header, DOWN, buff=0.35, aligned_edge=LEFT)
        step2 = MathTex(r"\text{2. Raíces: } x_1 = 3 - u, \quad x_2 = 3 + u", font_size=26, color="#1B2631").next_to(step1, DOWN, buff=0.3, aligned_edge=LEFT)
        step3 = MathTex(r"\text{3. Producto: } (3 - u)(3 + u) = 5", font_size=26, color="#1B2631").next_to(step2, DOWN, buff=0.3, aligned_edge=LEFT)
        step4 = MathTex(r"\text{4. Diferencia: } 3^2 - u^2 = 5 \implies u^2 = 4", font_size=26, color="#C0392B").next_to(step3, DOWN, buff=0.3, aligned_edge=LEFT)
        step5 = MathTex(r"\text{5. Distancia: } u = 2 \implies x_1 = 1, \; x_2 = 5", font_size=26, color="#27AE60").next_to(step4, DOWN, buff=0.3, aligned_edge=LEFT)

        sol_badge = RoundedRectangle(corner_radius=0.15, width=5.5, height=0.7, stroke_color="#27AE60", stroke_width=2.5, fill_color="#E8F8F5", fill_opacity=0.95).next_to(step5, DOWN, buff=0.35)
        sol_text = MathTex(r"\mathbf{C.S.} = \{ 1 \;;\; 5 \}", font_size=32, color="#196F3D").move_to(sol_badge.get_center())

        self.add(calc_card, card_header, card_title, step1, step2, step3, step4, step5, sol_badge, sol_text)

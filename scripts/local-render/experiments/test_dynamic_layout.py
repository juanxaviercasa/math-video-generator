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

class TestPerfectedLayout(Scene):
    def construct(self):
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0
        add_grid(self)

        # 1. Top Card: Equation + Badges for a, b, c (Y in [3.64, 4.79])
        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.14,
            stroke_color="#2C3E50", stroke_width=2.4,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 4.22, 0]))

        # Equation placed in bottom half of box
        eq_text = MathTex("x^2", "-", "6x", "+", "5", "=", "0", font_size=46, color="#1B2631").move_to(np.array([-0.2, 3.96, 0]))

        # Badges inside top half of box with clean padding
        badge_a = RoundedRectangle(corner_radius=0.08, width=0.92, height=0.30, stroke_color="#2980B9", stroke_width=1.5, fill_color="#EBF5FB", fill_opacity=0.95).move_to(np.array([eq_text[0].get_x(), 4.46, 0]))
        txt_a = MathTex(r"\mathbf{a = 1}", font_size=15, color="#1B4F72").move_to(badge_a.get_center())

        badge_b = RoundedRectangle(corner_radius=0.08, width=1.06, height=0.30, stroke_color="#D35400", stroke_width=1.5, fill_color="#FDEDEC", fill_opacity=0.95).move_to(np.array([eq_text[2].get_x(), 4.46, 0]))
        txt_b = MathTex(r"\mathbf{b = -6}", font_size=15, color="#922B21").move_to(badge_b.get_center())

        badge_c = RoundedRectangle(corner_radius=0.08, width=0.92, height=0.30, stroke_color="#B7950B", stroke_width=1.5, fill_color="#FEF9E7", fill_opacity=0.95).move_to(np.array([eq_text[4].get_x(), 4.46, 0]))
        txt_c = MathTex(r"\mathbf{c = 5}", font_size=15, color="#7D6608").move_to(badge_c.get_center())

        self.add(eq_box, eq_text, badge_a, txt_a, badge_b, txt_b, badge_c, txt_c)

        # 2. Big, Vertically Stretched Graph (y_range=[-4.5, 3.2, 1], y_length=3.7)
        axes = Axes(
            x_range=[-0.5, 6.5, 1],
            y_range=[-4.5, 3.2, 1],
            x_length=6.6,
            y_length=3.7,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.4,
                "include_tip": True,
                "tip_width": 0.14,
                "tip_height": 0.14,
            },
        ).move_to(np.array([-0.2, 1.70, 0]))

        axes.get_x_axis().add_numbers([2, 4, 6], font_size=24, color="#2C3E50")

        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[0.5, 5.5],
            color="#E67E22",
            stroke_width=4.2,
        )
        parabola_tag = MathTex(r"y = x^2 - 6x + 5", font_size=20, color="#D35400").next_to(axes.c2p(5.3, 1.4), RIGHT, buff=0.08)

        ground_line = Line(
            start=axes.c2p(-0.3, 0),
            end=axes.c2p(6.3, 0),
            color="#27AE60",
            stroke_width=3.6
        )
        ground_label = Text("Suelo (y = 0)", font_size=18, weight=BOLD, color="#1E8449").next_to(axes.c2p(0.2, 0), UP, buff=0.10)

        # Symmetry Axis (stops cleanly at y = 2.0 to give plenty of room to label)
        sym_line = DashedLine(
            start=axes.c2p(3, -4.3),
            end=axes.c2p(3, 2.0),
            dash_length=0.12,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.5,
        )
        sym_label = Text("Eje de Simetría (Espejo)", font_size=17, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 2.0), UP, buff=0.08)

        # Center dot & roots with MUCH LARGER text (font_size = 24)
        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.13)
        center_label = Text("Centro (x=3)", font_size=18, weight=BOLD, color="#1F618D").next_to(dot_center, UP, buff=0.10)

        dot_r1 = Dot(axes.c2p(1, 0), color="#27AE60", radius=0.13)
        dot_r2 = Dot(axes.c2p(5, 0), color="#27AE60", radius=0.13)
        r1_lbl = MathTex(r"3 - u", font_size=24, color="#C0392B").next_to(dot_r1, DOWN, buff=0.16)
        r2_lbl = MathTex(r"3 + u", font_size=24, color="#27AE60").next_to(dot_r2, DOWN, buff=0.16)

        arrow_l = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=3.2, buff=0)
        arrow_r = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=3.2, buff=0)
        lbl_u_l = MathTex(r"-u", font_size=24, color="#C0392B").next_to(arrow_l, UP, buff=0.08)
        lbl_u_r = MathTex(r"+u", font_size=24, color="#27AE60").next_to(arrow_r, UP, buff=0.08)

        # Vertex & Depth
        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.14)
        depth_arrow = Arrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=3.4, buff=0)
        depth_card = RoundedRectangle(
            corner_radius=0.12, width=2.4, height=0.46,
            stroke_color="#C0392B", stroke_width=2.0,
            fill_color="#FDEDEC", fill_opacity=0.95
        ).next_to(axes.c2p(3, -2), RIGHT, buff=0.15)
        depth_txt = MathTex(r"\text{Profundidad } u^2 = 4", font_size=16, color="#922B21").move_to(depth_card.get_center())

        self.add(axes, parabola, parabola_tag, ground_line, ground_label, sym_line, sym_label,
                 dot_center, center_label, dot_r1, dot_r2, r1_lbl, r2_lbl,
                 arrow_l, arrow_r, lbl_u_l, lbl_u_r, dot_vertex, depth_arrow, depth_card, depth_txt)

        # 3. Bottom Dynamic Card (Y in [-2.85, -0.30], height 2.55, center Y = -1.575)
        card_ded = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.55,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -1.575, 0]))

        ded_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -0.48, 0]))

        calc_step = MathTex(r"\text{1. Centro: } x_0 = -\frac{b}{2a} = -\frac{-6}{2(1)} = \mathbf{3}", font_size=31, color="#1B2631").move_to(np.array([-0.2, -1.35, 0]))

        self.add(card_ded, ded_title, calc_step)

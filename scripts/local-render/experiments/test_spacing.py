from manim import *
import numpy as np

class TestSpacing(Scene):
    def construct(self):
        self.camera.background_color = "#FDFBF7"

        # Ecuación arriba
        card_eq = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.14,
            stroke_color="#2C3E50", stroke_width=2.4,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 4.22, 0]))

        eq_text = MathTex(r"x^2", r"-", r"6x", r"+", r"5", r"= 0", font_size=40, color="#1B2631")
        eq_text.move_to(np.array([-0.2, 3.96, 0]))

        badge_a = RoundedRectangle(corner_radius=0.08, width=0.92, height=0.30, stroke_color="#2980B9", stroke_width=1.5, fill_color="#EBF5FB", fill_opacity=0.95).move_to(np.array([eq_text[0].get_x(), 4.46, 0]))
        txt_a = MathTex(r"\mathbf{a = 1}", font_size=15, color="#1B4F72").move_to(badge_a.get_center())

        badge_b = RoundedRectangle(corner_radius=0.08, width=1.06, height=0.30, stroke_color="#D35400", stroke_width=1.5, fill_color="#FDEDEC", fill_opacity=0.95).move_to(np.array([eq_text[2].get_x(), 4.46, 0]))
        txt_b = MathTex(r"\mathbf{b = -6}", font_size=15, color="#922B21").move_to(badge_b.get_center())

        badge_c = RoundedRectangle(corner_radius=0.08, width=0.92, height=0.30, stroke_color="#B7950B", stroke_width=1.5, fill_color="#FEF9E7", fill_opacity=0.95).move_to(np.array([eq_text[4].get_x(), 4.46, 0]))
        txt_c = MathTex(r"\mathbf{c = 5}", font_size=15, color="#7D6608").move_to(badge_c.get_center())

        highlight_c = RoundedRectangle(
            corner_radius=0.10, width=0.75, height=0.60,
            stroke_color="#F39C12", stroke_width=2.2,
            fill_color="#FEF9E7", fill_opacity=0.5
        ).move_to(eq_text[4].get_center())

        # Gráfico
        axes = Axes(
            x_range=[-0.5, 7.0, 1],
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
        tick_3 = MathTex(r"3", font_size=24, color="#C0392B").next_to(axes.c2p(3, 0), DOWN, buff=0.14).shift(LEFT * 0.14)

        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[0.5, 5.5],
            color="#E67E22",
            stroke_width=4.2,
        )
        parabola_tag = MathTex(r"y = x^2 - 6x + 5", font_size=20, color="#D35400").next_to(axes.c2p(5.3, 1.4), RIGHT, buff=0.08)

        ground_line = Line(start=axes.c2p(-0.3, 0), end=axes.c2p(6.3, 0), color="#27AE60", stroke_width=3.6)
        ground_label = Text("Suelo (y = 0)", font_size=18, weight=BOLD, color="#1E8449").next_to(axes.c2p(0.2, 0), UP, buff=0.10)

        sym_line = DashedLine(
            start=axes.c2p(3, -4.3),
            end=axes.c2p(3, 2.0),
            dash_length=0.12,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.5,
        )
        sym_label = Text("Eje de Simetría (Espejo)", font_size=17, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 2.0), UP, buff=0.08)

        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.13)
        center_label = Text("Centro", font_size=19, weight=BOLD, color="#1F618D").next_to(dot_center, UP, buff=0.14)

        dot_q1 = Dot(axes.c2p(1, 0), color="#E67E22", radius=0.11)
        dot_q2 = Dot(axes.c2p(5, 0), color="#E67E22", radius=0.11)

        arrow_left = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=3.2, buff=0)
        label_u_left = MathTex(r"-u", font_size=24, color="#C0392B").next_to(arrow_left.get_center(), UP, buff=0.12)
        r1_coord = MathTex(r"3 - u", font_size=24, color="#C0392B").next_to(dot_q1, DOWN, buff=0.16)

        arrow_right = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=3.2, buff=0)
        label_u_right = MathTex(r"+u", font_size=24, color="#27AE60").next_to(arrow_right.get_center(), UP, buff=0.12)
        r2_coord = MathTex(r"3 + u", font_size=24, color="#27AE60").next_to(dot_q2, DOWN, buff=0.16)

        arrow_down = Arrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=3.4, buff=0)
        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.14)

        pill_depth = RoundedRectangle(corner_radius=0.15, width=2.6, height=0.62, stroke_color="#C0392B", stroke_width=1.8, fill_color="#FDEDEC", fill_opacity=0.95).move_to(np.array([1.2, 0.45, 0]))
        txt_depth = MathTex(r"\text{Profundidad } u^2 = 4", font_size=18, color="#922B21").move_to(pill_depth.get_center())

        # Tarjeta Deducción
        card_ded = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.55,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -1.575, 0]))

        ded_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -0.48, 0]))
        step3 = MathTex(r"\text{3. Producto: } (3 - u)(3 + u) = 5", font_size=31, color="#C0392B").move_to(np.array([-0.2, -1.05, 0]))
        step4 = MathTex(r"\text{4. Diferencia: } 9 - u^2 = 5 \implies u^2 = \mathbf{4}", font_size=31, color="#D35400").move_to(np.array([-0.2, -1.75, 0]))

        self.add(
            card_eq, eq_text, badge_a, txt_a, badge_b, txt_b, badge_c, txt_c, highlight_c,
            axes, tick_3, parabola, parabola_tag, ground_line, ground_label, sym_line, sym_label,
            dot_center, center_label, dot_q1, dot_q2,
            arrow_left, label_u_left, r1_coord,
            arrow_right, label_u_right, r2_coord,
            arrow_down, dot_vertex, pill_depth, txt_depth,
            card_ded, ded_title, step3, step4
        )

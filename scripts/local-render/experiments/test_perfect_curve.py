from manim import *
import numpy as np

config.pixel_width = 720
config.pixel_height = 1280
config.frame_width = 9.0
config.frame_height = 16.0

class TestPerfectCurve(Scene):
    def construct(self):
        self.camera.background_color = "#FDFBF7"

        # -------------------------------------------------------------
        # 1. TARJETA DE ECUACIÓN (ARRIBA)
        # -------------------------------------------------------------
        card_eq = RoundedRectangle(
            corner_radius=0.20, width=7.2, height=0.85,
            stroke_color="#2C3E50", stroke_width=2.4,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 4.12, 0]))

        eq_text = MathTex(r"x^2", r"-", r"6x", r"+", r"5", r"= 0", font_size=44, color="#1B2631")
        eq_text.move_to(card_eq.get_center())

        # BADGES ENCIMA DEL RECUADRO (Separación limpia sin tocarse)
        badge_a = RoundedRectangle(
            corner_radius=0.10, width=1.10, height=0.40,
            stroke_color="#2980B9", stroke_width=2.0,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-1.60, 4.72, 0]))
        txt_a = MathTex(r"\mathbf{a = 1}", font_size=20, color="#1B4F72").move_to(badge_a.get_center())

        badge_b = RoundedRectangle(
            corner_radius=0.10, width=1.25, height=0.40,
            stroke_color="#D35400", stroke_width=2.0,
            fill_color="#FDEDEC", fill_opacity=0.98
        ).move_to(np.array([-0.40, 4.72, 0]))
        txt_b = MathTex(r"\mathbf{b = -6}", font_size=20, color="#922B21").move_to(badge_b.get_center())

        badge_c = RoundedRectangle(
            corner_radius=0.10, width=1.10, height=0.40,
            stroke_color="#B7950B", stroke_width=2.0,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([0.75, 4.72, 0]))
        txt_c = MathTex(r"\mathbf{c = 5}", font_size=20, color="#7D6608").move_to(badge_c.get_center())

        highlight_c = RoundedRectangle(
            corner_radius=0.10, width=0.75, height=0.65,
            stroke_color="#F39C12", stroke_width=2.4,
            fill_color="#FEF9E7", fill_opacity=0.4
        ).move_to(eq_text[4].get_center())

        # -------------------------------------------------------------
        # 2. GRÁFICA AMPLIADA CON CORTE EN Y = 5 (x = 0, y = 5)
        # -------------------------------------------------------------
        axes = Axes(
            x_range=[-0.8, 6.8, 1],
            y_range=[-4.5, 5.5, 1],
            x_length=6.3,
            y_length=4.0,
            axis_config={
                "color": "#34495E",
                "stroke_width": 2.4,
                "include_tip": True,
                "tip_width": 0.14,
                "tip_height": 0.14,
            },
        ).move_to(np.array([-0.10, 1.48, 0]))

        # Números en el eje X grandes
        axes.get_x_axis().add_numbers([2, 4, 6], font_size=24, color="#2C3E50")
        tick_3 = MathTex(r"3", font_size=24, color="#C0392B").next_to(axes.c2p(3, 0), DOWN, buff=0.14).shift(LEFT * 0.14)

        # Números en el eje Y (vértice -4 y corte 5)
        axes.get_y_axis().add_numbers([5, -4], font_size=22, color="#2C3E50")

        # Parábola de x = 0 a 6 (corta exactamente en (0,5) y (6,5))
        parabola = axes.plot(
            lambda x: (x - 3)**2 - 4,
            x_range=[0.0, 6.0],
            color="#E67E22",
            stroke_width=4.4,
        )

        # Punto de corte con el eje Y: (0, 5)
        dot_y_intercept = Dot(axes.c2p(0, 5), color="#D35400", radius=0.12)
        lbl_y_intercept = MathTex(r"(0, 5)", font_size=20, color="#D35400").next_to(dot_y_intercept, RIGHT, buff=0.14)

        # Flecha que señala la parábola naranja directamente
        tag_curva = MathTex(r"\mathbf{y = x^2 - 6x + 5}", font_size=22, color="#D35400").move_to(axes.c2p(4.9, 3.1))
        curve_arrow = Arrow(
            start=tag_curva.get_bottom() + DOWN*0.04,
            end=axes.c2p(5.2, 1.8),
            color="#D35400",
            stroke_width=2.6,
            buff=0.08
        )

        # Suelo (y = 0)
        ground_line = Line(start=axes.c2p(-0.6, 0), end=axes.c2p(6.4, 0), color="#27AE60", stroke_width=3.6)
        ground_label = Text("Suelo (y = 0)", font_size=18, weight=BOLD, color="#1E8449").next_to(axes.c2p(0.3, 0), UP, buff=0.12)

        # Eje de Simetría
        sym_line = DashedLine(
            start=axes.c2p(3, -4.3),
            end=axes.c2p(3, 3.2),
            dash_length=0.12,
            dashed_ratio=0.6,
            color="#8E44AD",
            stroke_width=2.5,
        )
        sym_label = Text("Eje de Simetría (Espejo)", font_size=17, weight=BOLD, color="#8E44AD").next_to(axes.c2p(3, 3.2), UP, buff=0.08)

        # Centro y raíces
        dot_center = Dot(axes.c2p(3, 0), color="#2980B9", radius=0.13)
        center_label = Text("Centro", font_size=20, weight=BOLD, color="#1F618D").next_to(dot_center, UP, buff=0.14)

        dot_q1 = Dot(axes.c2p(1, 0), color="#E67E22", radius=0.12)
        dot_q2 = Dot(axes.c2p(5, 0), color="#E67E22", radius=0.12)

        arrow_left = Arrow(start=axes.c2p(3, 0), end=axes.c2p(1, 0), color="#C0392B", stroke_width=3.2, buff=0)
        label_u_left = MathTex(r"-u", font_size=24, color="#C0392B").next_to(arrow_left.get_center(), UP, buff=0.12)
        r1_coord = MathTex(r"3 - u", font_size=24, color="#C0392B").next_to(dot_q1, DOWN, buff=0.16)

        arrow_right = Arrow(start=axes.c2p(3, 0), end=axes.c2p(5, 0), color="#27AE60", stroke_width=3.2, buff=0)
        label_u_right = MathTex(r"+u", font_size=24, color="#27AE60").next_to(arrow_right.get_center(), UP, buff=0.12)
        r2_coord = MathTex(r"3 + u", font_size=24, color="#27AE60").next_to(dot_q2, DOWN, buff=0.16)

        # Vértice y profundidad
        arrow_down = Arrow(start=axes.c2p(3, 0), end=axes.c2p(3, -4), color="#C0392B", stroke_width=3.4, buff=0)
        dot_vertex = Dot(axes.c2p(3, -4), color="#C0392B", radius=0.14)

        pill_depth = RoundedRectangle(corner_radius=0.15, width=2.7, height=0.62, stroke_color="#C0392B", stroke_width=1.8, fill_color="#FDEDEC", fill_opacity=0.95).move_to(np.array([1.3, 0.35, 0]))
        txt_depth = MathTex(r"\text{Profundidad } u^2 = 4", font_size=19, color="#922B21").move_to(pill_depth.get_center())

        # -------------------------------------------------------------
        # 3. TARJETA DEDUCCIÓN (ABAJO)
        # -------------------------------------------------------------
        card_ded = RoundedRectangle(
            corner_radius=0.25, width=7.2, height=2.45,
            stroke_color="#2C3E50", stroke_width=2.5,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -1.65, 0]))

        ded_title = Text("DEDUCCIÓN POR SIMETRÍA", font_size=21, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -0.60, 0]))
        step3 = MathTex(r"\text{3. Producto: } (3 - u)(3 + u) = 5", font_size=31, color="#C0392B").move_to(np.array([-0.2, -1.18, 0]))
        step4 = MathTex(r"\text{4. Diferencia: } 9 - u^2 = 5 \implies u^2 = \mathbf{4}", font_size=31, color="#D35400").move_to(np.array([-0.2, -1.88, 0]))

        self.add(
            card_eq, eq_text, badge_a, txt_a, badge_b, txt_b, badge_c, txt_c, highlight_c,
            axes, tick_3, parabola, dot_y_intercept, lbl_y_intercept,
            tag_curva, curve_arrow,
            ground_line, ground_label, sym_line, sym_label,
            dot_center, center_label, dot_q1, dot_q2,
            arrow_left, label_u_left, r1_coord,
            arrow_right, label_u_right, r2_coord,
            arrow_down, dot_vertex, pill_depth, txt_depth,
            card_ded, ded_title, step3, step4
        )

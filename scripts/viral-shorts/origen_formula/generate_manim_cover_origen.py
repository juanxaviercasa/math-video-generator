from manim import *

config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#FBF8F1"


class OrigenFormulaCoverScene(Scene):
    def construct(self):
        # 1. Subtle Blueprint Grid
        grid = NumberPlane(
            x_range=[-5, 5, 1],
            y_range=[-9, 9, 1],
            background_line_style={
                "stroke_color": "#E2DCD0",
                "stroke_width": 1.2,
                "stroke_opacity": 0.65,
            },
            axis_config={"stroke_opacity": 0},
        )
        self.add(grid)

        # 2. Top Viral Header Badge (Y = 6.15)
        header_box = RoundedRectangle(
            width=7.6,
            height=1.55,
            corner_radius=0.22,
            fill_color="#8C1D13",
            fill_opacity=1.0,
            stroke_color="#5A0F09",
            stroke_width=4.0,
        ).move_to(np.array([-0.15, 6.10, 0]))

        header_t1 = Text(
            "EL SECRETO GEOMÉTRICO DE LA",
            font="Georgia",
            font_size=24,
            color="#FCE8B2",
            weight=BOLD,
        )
        header_t2 = Text(
            "FÓRMULA GENERAL",
            font="Georgia",
            font_size=38,
            color="#FFFFFF",
            weight=BOLD,
        )
        header_grp = VGroup(header_t1, header_t2).arrange(DOWN, buff=0.12).move_to(header_box.get_center())

        # 3. Floating Pill Badges (Y = 4.82)
        b1 = RoundedRectangle(width=2.35, height=0.68, corner_radius=0.14, fill_color="#EBF5FB", fill_opacity=1, stroke_color="#1D4E6C", stroke_width=2.8)
        b1_txt = MathTex(r"\text{Cuadrado } \mathbf{x^2}", font_size=25, color="#1D4E6C")
        b1_grp = VGroup(b1, b1_txt).move_to(np.array([-2.65, 4.82, 0]))

        b2 = RoundedRectangle(width=2.35, height=0.68, corner_radius=0.14, fill_color="#EBF5FB", fill_opacity=1, stroke_color="#2E86C1", stroke_width=2.8)
        b2_txt = MathTex(r"\text{Tiras } \mathbf{\frac{b}{2a}x}", font_size=25, color="#2E86C1")
        b2_grp = VGroup(b2, b2_txt).move_to(np.array([-0.15, 4.82, 0]))

        b3 = RoundedRectangle(width=2.35, height=0.68, corner_radius=0.14, fill_color="#FEF9E7", fill_opacity=1, stroke_color="#D4AC0D", stroke_width=2.8)
        b3_txt = MathTex(r"\text{Esquina } \mathbf{+\frac{b^2}{4a^2}}", font_size=24, color="#9A7D0A")
        b3_grp = VGroup(b3, b3_txt).move_to(np.array([2.35, 4.82, 0]))

        # 4. Equation Transformation Card (Y = 3.68)
        eq_box = RoundedRectangle(
            width=7.5,
            height=1.22,
            corner_radius=0.18,
            fill_color="#FFFFFF",
            fill_opacity=1.0,
            stroke_color="#1A252C",
            stroke_width=3.2,
        ).move_to(np.array([-0.15, 3.68, 0]))
        eq_tex = MathTex(
            r"ax^2 + bx + c = 0 \;\Longrightarrow\; x^2 + \frac{b}{a}x + \mathbf{\frac{b^2}{4a^2}} = -\frac{c}{a} + \mathbf{\frac{b^2}{4a^2}}",
            font_size=33,
            color="#1A252C",
        )
        eq_tex[0][18:24].set_color("#9A7D0A")
        eq_tex[0][30:36].set_color("#9A7D0A")
        eq_tex.set_width(eq_box.width * 0.92).move_to(eq_box.get_center())

        # 5. Centerpiece: Completing the Square Geometry (Y = 0.55)
        L_x = 2.65
        L_b = 1.25
        sq_origin = np.array([-1.95, -1.65, 0])

        sq_x2 = Square(
            side_length=L_x,
            fill_color="#1D4E6C",
            fill_opacity=0.92,
            stroke_color="#14364B",
            stroke_width=3.8,
        ).move_to(sq_origin + np.array([L_x / 2, L_x / 2, 0]))
        lbl_x2 = MathTex(r"\mathbf{x^2}", font_size=56, color="#FFFFFF").move_to(sq_x2.get_center())

        strip_right = Rectangle(
            width=L_b,
            height=L_x,
            fill_color="#2E86C1",
            fill_opacity=0.88,
            stroke_color="#1B4F72",
            stroke_width=3.4,
        ).next_to(sq_x2, RIGHT, buff=0)
        lbl_sr = MathTex(r"\mathbf{\frac{b}{2a}x}", font_size=34, color="#FFFFFF").move_to(strip_right.get_center())

        strip_top = Rectangle(
            width=L_x,
            height=L_b,
            fill_color="#2E86C1",
            fill_opacity=0.88,
            stroke_color="#1B4F72",
            stroke_width=3.4,
        ).next_to(sq_x2, UP, buff=0)
        lbl_st = MathTex(r"\mathbf{\frac{b}{2a}x}", font_size=34, color="#FFFFFF").move_to(strip_top.get_center())

        hole_pos = sq_x2.get_corner(UR) + np.array([L_b / 2, L_b / 2, 0])
        gold_sq = Square(
            side_length=L_b,
            fill_color="#F1C40F",
            fill_opacity=0.96,
            stroke_color="#9A7D0A",
            stroke_width=4.5,
        ).move_to(hole_pos)
        lbl_gold = MathTex(r"\mathbf{\frac{b^2}{4a^2}}", font_size=34, color="#5C3A08").move_to(gold_sq.get_center())

        # Braces & Side Labels
        full_group = VGroup(sq_x2, strip_right, strip_top, gold_sq)
        brace_bot = Brace(full_group, DOWN, buff=0.14, color="#9A7D0A")
        lbl_bot = MathTex(r"\mathbf{x + \frac{b}{2a}}", font_size=34, color="#9A7D0A").next_to(brace_bot, DOWN, buff=0.10)

        brace_left = Brace(full_group, LEFT, buff=0.14, color="#9A7D0A")
        lbl_left = MathTex(r"\mathbf{x + \frac{b}{2a}}", font_size=34, color="#9A7D0A").next_to(brace_left, LEFT, buff=0.12)

        hole_top_lbl = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=28, color="#A8201A").next_to(gold_sq, UP, buff=0.10)
        hole_right_lbl = MathTex(r"\mathbf{\frac{b}{2a}}", font_size=28, color="#A8201A").next_to(gold_sq, RIGHT, buff=0.12)

        # 6. Bottom Result Card (Y = -3.65)
        res_card = RoundedRectangle(
            width=7.5,
            height=2.25,
            corner_radius=0.22,
            fill_color="#FFFFFF",
            fill_opacity=1.0,
            stroke_color="#1A252C",
            stroke_width=3.5,
        ).move_to(np.array([-0.15, -3.75, 0]))

        res_title = Text(
            "¡ASÍ NACE LA FÓRMULA CUADRÁTICA!",
            font="Georgia",
            font_size=23,
            color="#1B7A43",
            weight=BOLD,
        ).move_to(res_card.get_top() + DOWN * 0.36)

        sol_box = RoundedRectangle(
            width=6.9,
            height=1.35,
            corner_radius=0.16,
            fill_color="#E8F8F5",
            fill_opacity=1.0,
            stroke_color="#1B7A43",
            stroke_width=3.5,
        ).move_to(res_card.get_center() + DOWN * 0.22)

        sol_tex = MathTex(
            r"\mathbf{x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}}",
            font_size=46,
            color="#1B7A43",
        ).move_to(sol_box.get_center())

        self.add(
            header_box,
            header_grp,
            b1_grp,
            b2_grp,
            b3_grp,
            eq_box,
            eq_tex,
            sq_x2,
            lbl_x2,
            strip_right,
            lbl_sr,
            strip_top,
            lbl_st,
            gold_sq,
            lbl_gold,
            brace_bot,
            lbl_bot,
            brace_left,
            lbl_left,
            hole_top_lbl,
            hole_right_lbl,
            res_card,
            res_title,
            sol_box,
            sol_tex,
        )

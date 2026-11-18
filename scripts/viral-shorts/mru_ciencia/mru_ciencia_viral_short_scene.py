# -*- coding: utf-8 -*-
"""
=============================================================================
PROYECTO: SHORT VIRAL DE CIENCIA - EL SECRETO GEOMÉTRICO DEL M.R.U. (ZÉNIT CIENCIA)
MODELO: modelo_science_1 (Movimiento Rectilíneo Uniforme sin Memorizar el Triangulito)
FORMATO: 9:16 VERTICAL (TIKTOK / YOUTUBE SHORTS / REELS)
CUMPLIMIENTO ESTRICTO DE REGLAS DE ORO (AGENTS.md):
  - Badges Flotantes arriba en Y = +6.82 (altura 0.66)
  - Ecuación Protagonista arriba en Y = +5.62 (altura 1.44, borde inferior Y = +4.90)
  - Zona Central (Figuras, Bloques, Tren y Rectángulo 4x3) en Y in [-1.10, +4.35]
    con margen >= 0.55 unidades de respiro arriba y abajo.
  - Tarjeta de Deducción Inferior en Y = -3.45 (altura 3.40, Y in [-5.15, -1.75])
    aprovechando el espacio inferior sin colisiones ni superposiciones.
DURACIÓN EXACTA: 121.15 SEGUNDOS (Sincronizado con narration_mru_ciencia.mp3)
MOTOR: MANIM COMMUNITY + MIKTEX
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
config.background_color = "#F6F3EC"  # Papel marfil / Paper Craft cálido


class MRUCienciaViralShort(Scene):
    def construct(self):
        # Configuración de cámara para canvas vertical 9:16
        self.camera.frame_width = 9.0
        self.camera.frame_height = 16.0

        # Helper para sincronización estricta con marcas de audio (ajustado -1.32s tras eliminar mención de marca inicial)
        def sync_to(target_time):
            adj_time = target_time - 1.32 if target_time >= 16.0 else target_time
            current = self.time
            dt = adj_time - current
            if dt > 0.02:
                self.wait(dt)

        # Helper para construir un carrito limpio en Manim
        def build_car(color_body="#E74C3C", color_roof="#F1948A", scale_factor=1.0):
            body = RoundedRectangle(
                corner_radius=0.12, width=1.35, height=0.42,
                stroke_color="#922B21", stroke_width=2.2,
                fill_color=color_body, fill_opacity=0.95
            )
            cabin = Polygon(
                np.array([-0.42, 0.21, 0]),
                np.array([-0.22, 0.52, 0]),
                np.array([0.28, 0.52, 0]),
                np.array([0.45, 0.21, 0]),
                stroke_color="#922B21", stroke_width=2.2,
                fill_color=color_roof, fill_opacity=0.92
            )
            w1 = Circle(radius=0.16, stroke_color="#1B2631", stroke_width=3.0, fill_color="#566573", fill_opacity=1.0).move_to(np.array([-0.38, -0.22, 0]))
            w2 = Circle(radius=0.16, stroke_color="#1B2631", stroke_width=3.0, fill_color="#566573", fill_opacity=1.0).move_to(np.array([0.38, -0.22, 0]))
            hub1 = Dot(w1.get_center(), radius=0.05, color=WHITE)
            hub2 = Dot(w2.get_center(), radius=0.05, color=WHITE)
            car = VGroup(body, cabin, w1, w2, hub1, hub2).scale(scale_factor)
            return car

        # -------------------------------------------------------------
        # CAPA BASE: Cuadrícula milimetrada sutil (Estilo Paper Craft)
        # -------------------------------------------------------------
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
        # ACTO 1: EL GANCHO Y EL MITO DEL TRIANGULITO (0.00s - 16.15s)
        # =============================================================
        top_hook_badge = RoundedRectangle(
            corner_radius=0.16, width=7.2, height=0.72,
            stroke_color="#7B241C", stroke_width=2.6,
            fill_color="#FDEDEC", fill_opacity=0.98
        ).move_to(np.array([-0.2, 6.65, 0]))
        top_hook_txt = Text("EL SECRETO QUE NO TE ENSEÑARON", font_size=22, weight=BOLD, color="#7B241C").move_to(top_hook_badge.get_center())

        eq_box = RoundedRectangle(
            corner_radius=0.22, width=7.2, height=1.44,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 5.42, 0]))
        eq_hook_t1 = Text("M.R.U.", font_size=34, weight=BOLD, color="#1B4F72")
        eq_hook_t2 = Text("Movimiento Rectilíneo Uniforme", font_size=22, weight=BOLD, color="#D35400")
        eq_hook_grp = VGroup(eq_hook_t1, eq_hook_t2).arrange(DOWN, buff=0.10).move_to(eq_box.get_center())

        # Triángulo clásico d / (v | t) en el centro (Y in [-0.20, +3.60])
        tri_pts = [
            np.array([-0.20, 3.65, 0]),
            np.array([-2.35, 0.15, 0]),
            np.array([1.95, 0.15, 0]),
        ]
        tri_outer = Polygon(*tri_pts, stroke_color="#1B4F72", stroke_width=4.0, fill_color="#EBF5FB", fill_opacity=0.85)
        tri_mid_y = 1.90
        # Interpolar ancho a la altura media
        tri_hline = Line(np.array([-1.275, tri_mid_y, 0]), np.array([0.875, tri_mid_y, 0]), stroke_color="#1B4F72", stroke_width=3.5)
        tri_vline = Line(np.array([-0.20, tri_mid_y, 0]), np.array([-0.20, 0.15, 0]), stroke_color="#1B4F72", stroke_width=3.5)

        lbl_tri_d = MathTex(r"\mathbf{d}", font_size=56, color="#C0392B").move_to(np.array([-0.20, 2.55, 0]))
        lbl_tri_v = MathTex(r"\mathbf{v}", font_size=54, color="#2980B9").move_to(np.array([-0.92, 0.95, 0]))
        lbl_tri_t = MathTex(r"\mathbf{t}", font_size=54, color="#D35400").move_to(np.array([0.52, 0.95, 0]))
        tri_full = VGroup(tri_outer, tri_hline, tri_vline, lbl_tri_d, lbl_tri_v, lbl_tri_t)

        # Tarjeta de Deducción Inferior en Y = -3.45 (altura 3.40)
        card_ded = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=3.40,
            stroke_color="#2C3E50", stroke_width=2.8,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, -3.45, 0]))
        ded_title = Text("EL TRIANGULITO QUE TODOS MEMORIZAN", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        self.play(
            FadeIn(top_hook_badge), FadeIn(top_hook_txt),
            Create(eq_box), FadeIn(eq_hook_grp),
            Create(tri_outer), Create(tri_hline), Create(tri_vline),
            Write(lbl_tri_d), Write(lbl_tri_v), Write(lbl_tri_t),
            FadeIn(card_ded), FadeIn(ded_title),
            run_time=1.8
        )

        # 6.80s: Pero casi nadie nos dice por qué la fórmula es así ni qué significa realmente
        sync_to(6.80)
        q_left = Text("¿Por qué?", font_size=26, weight=BOLD, color="#8E44AD").move_to(np.array([-2.65, 2.65, 0]))
        q_right = MathTex(r"\mathbf{?}", font_size=72, color="#D35400").move_to(np.array([2.35, 2.10, 0]))
        hook_step1 = Text("¿Por qué se divide o se multiplica?", font_size=24, weight=BOLD, color="#C0392B").move_to(np.array([-0.2, -3.00, 0]))
        self.play(FadeIn(q_left, scale=1.2), FadeIn(q_right, scale=1.3), Write(hook_step1), run_time=1.2)

        # 11.28s: Hoy en Zénit Ciencia verás cómo se interpreta de forma visual y geométrica
        sync_to(11.28)
        promesa_box = RoundedRectangle(
            corner_radius=0.16, width=6.6, height=1.15,
            stroke_color="#27AE60", stroke_width=2.6,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -4.22, 0]))
        promesa_txt = Text("¡Lo entenderás con bloques y geometría!", font_size=21, weight=BOLD, color="#196F3D").move_to(promesa_box.get_center())
        self.play(Create(promesa_box), FadeIn(promesa_txt), run_time=1.1)

        # =============================================================
        # ACTO 2: ¿QUÉ SIGNIFICA SU NOMBRE? + BLOQUES IGUALES (16.15s - 34.31s)
        # =============================================================
        sync_to(16.15)
        self.play(
            FadeOut(top_hook_badge), FadeOut(top_hook_txt),
            FadeOut(eq_hook_grp),
            FadeOut(tri_full), FadeOut(q_left), FadeOut(q_right),
            FadeOut(hook_step1), FadeOut(promesa_box), FadeOut(promesa_txt),
            run_time=0.55
        )

        # Reubicar eq_box a Y = +5.62 y crear 3 badges flotantes en Y = +6.82
        self.play(eq_box.animate.move_to(np.array([-0.2, 5.62, 0])), run_time=0.35)

        badge_top_1 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#1B4F72", stroke_width=2.4,
            fill_color="#EBF5FB", fill_opacity=0.98
        ).move_to(np.array([-2.60, 6.82, 0]))
        txt_top_1 = Text("Rectilíneo", font_size=20, weight=BOLD, color="#1B4F72").move_to(badge_top_1.get_center())

        badge_top_2 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#D35400", stroke_width=2.4,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([-0.20, 6.82, 0]))
        txt_top_2 = Text("Uniforme", font_size=20, weight=BOLD, color="#D35400").move_to(badge_top_2.get_center())

        badge_top_3 = RoundedRectangle(
            corner_radius=0.14, width=2.25, height=0.66,
            stroke_color="#196F3D", stroke_width=2.4,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([2.20, 6.82, 0]))
        txt_top_3 = Text("Ritmo = cte", font_size=20, weight=BOLD, color="#196F3D").move_to(badge_top_3.get_center())

        eq_main = Text("M.R.U. = Mismo bloque cada segundo", font_size=25, weight=BOLD, color="#1B2631").move_to(eq_box.get_center())
        ded_title_act2 = Text("TRADUCCIÓN FÍSICA DEL NOMBRE", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        self.play(
            FadeIn(badge_top_1), FadeIn(txt_top_1),
            FadeIn(badge_top_2), FadeIn(txt_top_2),
            FadeIn(badge_top_3), FadeIn(txt_top_3),
            FadeIn(eq_main),
            Transform(ded_title, ded_title_act2),
            run_time=0.8
        )

        # 18.31s: Rectilíneo significa moverse en línea recta
        sync_to(18.31)
        road_line = Line(np.array([-3.05, 1.05, 0]), np.array([2.65, 1.05, 0]), stroke_color="#2C3E50", stroke_width=4.5)
        car = build_car(scale_factor=0.95).move_to(np.array([-2.85, 1.45, 0]))
        step_rect = Text("1. Rectilíneo = Moverse en línea recta", font_size=23, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -3.00, 0]))

        self.play(Create(road_line), FadeIn(car), Write(step_rect), run_time=1.2)

        # 21.46s: Y uniforme significa que el ritmo nunca cambia (Marcas 0 s, 1 s, 2 s, 3 s)
        sync_to(21.46)
        tick_xs = [-2.85, -1.08, 0.68, 2.45]
        ticks_grp = VGroup()
        lbls_time_grp = VGroup()
        for idx, tx in enumerate(tick_xs):
            t_mark = Line(np.array([tx, 0.85, 0]), np.array([tx, 1.25, 0]), stroke_color="#D35400", stroke_width=3.5)
            t_lbl = MathTex(rf"\mathbf{{{idx}\;\text{{s}}}}", font_size=32, color="#D35400").move_to(np.array([tx, 0.35, 0]))
            ticks_grp.add(t_mark)
            lbls_time_grp.add(t_lbl)

        step_unif = Text("2. Uniforme = El ritmo nunca cambia", font_size=23, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -4.05, 0]))

        self.play(
            Create(ticks_grp), FadeIn(lbls_time_grp),
            Write(step_unif),
            car.animate.move_to(np.array([2.45, 1.45, 0])),
            run_time=2.6,
            rate_func=linear
        )

        # 24.63s: Por cada segundo que pasa colocamos en el suelo un bloque de distancia del mismo tamaño
        sync_to(24.63)
        blocks_mru = VGroup()
        for i in range(3):
            x_left = tick_xs[i]
            x_right = tick_xs[i + 1]
            blk_w = x_right - x_left - 0.08
            blk = RoundedRectangle(
                corner_radius=0.12, width=blk_w, height=1.15,
                stroke_color="#117864", stroke_width=3.0,
                fill_color="#1ABC9C", fill_opacity=0.88
            ).move_to(np.array([(x_left + x_right) / 2, 1.90, 0]))
            blk_txt = Text("Bloque", font_size=22, weight=BOLD, color=WHITE).move_to(blk.get_center())
            blocks_mru.add(VGroup(blk, blk_txt))

        lbl_bloques_tag = Text("¡3 bloques idénticos (sin acelerar ni frenar)!", font_size=21, weight=BOLD, color="#117864").move_to(np.array([-0.2, 3.15, 0]))

        self.play(
            FadeOut(car),
            LaggedStart(*[FadeIn(b, shift=DOWN * 0.3) for b in blocks_mru], lag_ratio=0.35),
            FadeIn(lbl_bloques_tag),
            run_time=2.8
        )

        # =============================================================
        # ACTO 3: ¿CÓMO SE INTERPRETA LA VELOCIDAD? (34.31s - 57.69s)
        # =============================================================
        sync_to(34.31)
        self.play(
            FadeOut(road_line), FadeOut(ticks_grp), FadeOut(lbls_time_grp),
            FadeOut(blocks_mru), FadeOut(lbl_bloques_tag),
            FadeOut(step_rect), FadeOut(step_unif),
            run_time=0.5
        )

        txt_b1_v = MathTex(r"\mathbf{d = 12\;\text{m}}", font_size=26, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_b2_v = MathTex(r"\mathbf{t = 3\;\text{s}}", font_size=26, color="#D35400").move_to(badge_top_2.get_center())
        txt_b3_v = MathTex(r"\mathbf{v = \frac{d}{t}}", font_size=26, color="#196F3D").move_to(badge_top_3.get_center())
        eq_vel_q = MathTex(r"v = \frac{d}{t} \;\Longrightarrow\; \text{¿Qu}\acute{\text{e}}\text{ significa dividir?}", font_size=34, color="#1B2631").move_to(eq_box.get_center())
        ded_title_act3 = Text("DIVIDIR = PARTIR LA BARRA EN PEDAZOS", font_size=19, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        self.play(
            Transform(txt_top_1, txt_b1_v),
            Transform(txt_top_2, txt_b2_v),
            Transform(txt_top_3, txt_b3_v),
            Transform(eq_main, eq_vel_q),
            Transform(ded_title, ded_title_act3),
            run_time=0.8
        )

        # 37.60s: Si recorres una barra de 12 metros en 3 segundos...
        sync_to(37.60)
        bar_12m = RoundedRectangle(
            corner_radius=0.14, width=5.70, height=1.25,
            stroke_color="#2C3E50", stroke_width=3.5,
            fill_color="#D6EAF8", fill_opacity=0.95
        ).move_to(np.array([-0.20, 1.95, 0]))
        lbl_d12_top = MathTex(r"\mathbf{d = 12\;\text{m}}", font_size=42, color="#1B4F72").next_to(bar_12m, UP, buff=0.25)

        brace_t3 = Brace(bar_12m, DOWN, buff=0.16, color="#D35400")
        lbl_t3 = MathTex(r"\mathbf{t = 3\;\text{segundos}}", font_size=34, color="#D35400").next_to(brace_t3, DOWN, buff=0.12)

        step_div1 = MathTex(r"\text{1. Partir } \mathbf{12\;\text{m}} \text{ en } \mathbf{3\;\text{partes iguales}}", font_size=34, color="#1B2631").move_to(np.array([-0.2, -3.00, 0]))

        self.play(
            DrawBorderThenFill(bar_12m), Write(lbl_d12_top),
            GrowFromCenter(brace_t3), FadeIn(lbl_t3),
            Write(step_div1),
            run_time=1.8
        )

        # 42.50s: Dividir distancia entre tiempo significa partir esa barra en 3 pedazos iguales (1 para cada segundo)
        sync_to(42.50)
        cut1_x = -0.20 - 5.70 / 6.0  # -1.15
        cut2_x = -0.20 + 5.70 / 6.0  # +0.75
        cut_line_1 = DashedLine(np.array([cut1_x, 2.65, 0]), np.array([cut1_x, 1.25, 0]), color="#196F3D", stroke_width=4.0)
        cut_line_2 = DashedLine(np.array([cut2_x, 2.65, 0]), np.array([cut2_x, 1.25, 0]), color="#196F3D", stroke_width=4.0)

        sec_labels = VGroup(
            MathTex(r"\mathbf{1\;\text{s}}", font_size=32, color="#D35400").move_to(np.array([-2.10, 0.85, 0])),
            MathTex(r"\mathbf{1\;\text{s}}", font_size=32, color="#D35400").move_to(np.array([-0.20, 0.85, 0])),
            MathTex(r"\mathbf{1\;\text{s}}", font_size=32, color="#D35400").move_to(np.array([1.70, 0.85, 0])),
        )

        self.play(Create(cut_line_1), Create(cut_line_2), run_time=0.9)
        self.play(FadeOut(brace_t3), FadeOut(lbl_t3), FadeIn(sec_labels), run_time=0.9)

        # 46.56s: Al dividir 12 entre 3, descubres que en cada segundo avanzaste un bloque de 4 metros
        sync_to(46.56)
        pieces_4m = VGroup()
        centers_x = [-2.10, -0.20, 1.70]
        for cx in centers_x:
            p_box = RoundedRectangle(
                corner_radius=0.10, width=1.86, height=1.22,
                stroke_color="#1B4F72", stroke_width=3.0,
                fill_color="#2980B9", fill_opacity=0.92
            ).move_to(np.array([cx, 1.95, 0]))
            p_txt = MathTex(r"\mathbf{4\;\text{m}}", font_size=38, color=WHITE).move_to(p_box.get_center())
            pieces_4m.add(VGroup(p_box, p_txt))

        self.play(LaggedStart(*[FadeIn(p) for p in pieces_4m], lag_ratio=0.25), run_time=1.5)

        # 52.16s: Eso significa v = d/t = 12 m / 3 s = 4 m/s (cuántos metros caben en 1 solo segundo)
        sync_to(52.16)
        hl_one_sec = SurroundingRectangle(VGroup(pieces_4m[0], sec_labels[0]), color="#F39C12", buff=0.12, stroke_width=4.2)

        sol_vel_box = RoundedRectangle(
            corner_radius=0.18, width=6.6, height=1.32,
            stroke_color="#27AE60", stroke_width=3.0,
            fill_color="#E8F8F5", fill_opacity=0.98
        ).move_to(np.array([-0.2, -4.18, 0]))
        sol_vel_tex = MathTex(
            r"\mathbf{v = \frac{d}{t} = \frac{12\;\text{m}}{3\;\text{s}} = 4\;\text{m/s}}",
            font_size=38, color="#196F3D"
        ).move_to(sol_vel_box.get_center())
        eq_vel_top = MathTex(
            r"\mathbf{v = \frac{d}{t} = \frac{12\;\text{m}}{3\;\text{s}} = 4\;\text{m/s}}",
            font_size=40, color="#196F3D"
        ).move_to(eq_box.get_center())

        self.play(
            Create(hl_one_sec),
            Create(sol_vel_box), Write(sol_vel_tex),
            Transform(eq_main, eq_vel_top),
            run_time=1.6
        )

        # =============================================================
        # ACTO 4: MULTIPLICAR = REPETIR VAGONES DE UN TREN (57.69s - 76.03s)
        # =============================================================
        sync_to(57.69)
        self.play(
            FadeOut(bar_12m), FadeOut(lbl_d12_top),
            FadeOut(cut_line_1), FadeOut(cut_line_2),
            FadeOut(sec_labels), FadeOut(pieces_4m), FadeOut(hl_one_sec),
            FadeOut(step_div1), FadeOut(sol_vel_box), FadeOut(sol_vel_tex),
            run_time=0.5
        )

        txt_b1_d = MathTex(r"\mathbf{v = 4\;\text{m/s}}", font_size=25, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_b2_d = MathTex(r"\mathbf{t = 3\;\text{s}}", font_size=26, color="#D35400").move_to(badge_top_2.get_center())
        txt_b3_d = MathTex(r"\mathbf{d = v \times t}", font_size=25, color="#196F3D").move_to(badge_top_3.get_center())
        eq_mult_q = MathTex(r"d = v \times t \;\Longrightarrow\; \text{¿Por qu}\acute{\text{e}}\text{ multiplicar?}", font_size=34, color="#1B2631").move_to(eq_box.get_center())
        ded_title_act4 = Text("MULTIPLICAR = REPETIR VAGONES DE TREN", font_size=19, weight=BOLD, color="#D35400").move_to(np.array([-0.2, -2.12, 0]))

        # Riel numérico de 0 a 14 en Y = 0.85 (X in [-3.10, +2.85])
        rail_start_x = -3.10
        rail_unit = 0.42  # 14 unidades * 0.42 = 5.88 de ancho
        rail_line = Line(
            np.array([rail_start_x, 0.85, 0]),
            np.array([rail_start_x + 14 * rail_unit, 0.85, 0]),
            stroke_color="#2C3E50", stroke_width=4.0
        )
        rail_ticks = VGroup()
        for n in range(15):
            rx = rail_start_x + n * rail_unit
            rt = Line(np.array([rx, 0.72, 0]), np.array([rx, 0.98, 0]), stroke_color="#2C3E50", stroke_width=2.2)
            rl = MathTex(str(n), font_size=22, color="#2C3E50").move_to(np.array([rx, 0.42, 0]))
            rail_ticks.add(VGroup(rt, rl))

        self.play(
            Transform(txt_top_1, txt_b1_d),
            Transform(txt_top_2, txt_b2_d),
            Transform(txt_top_3, txt_b3_d),
            Transform(eq_main, eq_mult_q),
            Transform(ded_title, ded_title_act4),
            Create(rail_line), FadeIn(rail_ticks),
            run_time=1.2
        )

        # 61.88s (1:01.88): Porque multiplicar es repetir bloques iguales uno tras otro, como los vagones de un tren
        sync_to(61.88)
        step_train1 = Text("1. Cada segundo suma un vagón de 4 m", font_size=23, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -3.00, 0]))

        def make_wagon(idx):
            # Cada vagón abarca 4 unidades (ancho = 4 * 0.42 = 1.68)
            wx_left = rail_start_x + idx * 4 * rail_unit
            wx_center = wx_left + 2 * rail_unit
            box = RoundedRectangle(
                corner_radius=0.10, width=4 * rail_unit - 0.06, height=0.92,
                stroke_color="#117864", stroke_width=2.8,
                fill_color="#16A085", fill_opacity=0.92
            ).move_to(np.array([wx_center, 1.52, 0]))
            txt = MathTex(r"\mathbf{4\;\text{m}}", font_size=34, color=WHITE).move_to(box.get_center())
            w_left = Circle(radius=0.13, stroke_color="#1B2631", stroke_width=2.5, fill_color="#BDC3C7", fill_opacity=1.0).move_to(np.array([wx_center - 0.48, 0.98, 0]))
            w_right = Circle(radius=0.13, stroke_color="#1B2631", stroke_width=2.5, fill_color="#BDC3C7", fill_opacity=1.0).move_to(np.array([wx_center + 0.48, 0.98, 0]))
            sec_top = MathTex(rf"\mathbf{{1\;\text{{s}}}}", font_size=26, color="#D35400").next_to(box, UP, buff=0.12)
            return VGroup(box, txt, w_left, w_right, sec_top)

        w1 = make_wagon(0)
        w2 = make_wagon(1)
        w3 = make_wagon(2)

        # Locomotora delante del vagónactivo
        loco_x = rail_start_x + 4 * rail_unit + 0.42
        loco_body = RoundedRectangle(corner_radius=0.08, width=0.78, height=0.78, stroke_color="#922B21", stroke_width=2.5, fill_color="#E74C3C", fill_opacity=0.95).move_to(np.array([loco_x, 1.45, 0]))
        loco_chimney = Rectangle(width=0.18, height=0.32, stroke_color="#922B21", stroke_width=2.2, fill_color="#F39C12", fill_opacity=0.95).next_to(loco_body, UP, buff=0).shift(RIGHT * 0.15)
        loco_grp = VGroup(loco_body, loco_chimney)

        self.play(Write(step_train1), FadeIn(w1), FadeIn(loco_grp), run_time=1.3)

        # 66.90s (1:06.90): Si tu velocidad es un vagón de 4 m por segundo y avanzas 3 segundos, juntas 3 vagones y llegas al 12
        sync_to(66.90)
        self.play(
            loco_grp.animate.shift(RIGHT * (4 * rail_unit)),
            FadeIn(w2),
            run_time=1.4
        )
        self.play(
            loco_grp.animate.shift(RIGHT * (4 * rail_unit)),
            FadeIn(w3),
            run_time=1.4
        )

        x_12 = rail_start_x + 12 * rail_unit
        marker_12 = DashedLine(np.array([x_12, 2.55, 0]), np.array([x_12, 0.55, 0]), color="#F39C12", stroke_width=4.2)
        dot_12 = Dot(np.array([x_12, 0.85, 0]), radius=0.14, color="#F39C12")

        sol_dist_box = RoundedRectangle(
            corner_radius=0.18, width=6.6, height=1.32,
            stroke_color="#D35400", stroke_width=3.0,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(np.array([-0.2, -4.18, 0]))
        sol_dist_tex = MathTex(
            r"\mathbf{d = v \times t = 4\;\text{m/s} \times 3\;\text{s} = 12\;\text{m}}",
            font_size=35, color="#D35400"
        ).move_to(sol_dist_box.get_center())
        eq_dist_top = MathTex(
            r"\mathbf{d = v \times t = 4\;\text{m/s} \times 3\;\text{s} = 12\;\text{m}}",
            font_size=37, color="#D35400"
        ).move_to(eq_box.get_center())

        self.play(
            Create(marker_12), FadeIn(dot_12, scale=1.4),
            Create(sol_dist_box), Write(sol_dist_tex),
            Transform(eq_main, eq_dist_top),
            run_time=1.6
        )

        # =============================================================
        # ACTO 5: EL SECRETO GEOMÉTRICO: UN RECTÁNGULO 4x3 (76.03s - 96.73s)
        # =============================================================
        sync_to(76.03)
        self.play(
            FadeOut(rail_line), FadeOut(rail_ticks),
            FadeOut(w1), FadeOut(w2), FadeOut(w3), FadeOut(loco_grp),
            FadeOut(marker_12), FadeOut(dot_12),
            FadeOut(step_train1), FadeOut(sol_dist_box), FadeOut(sol_dist_tex),
            run_time=0.45
        )

        ded_title_act5 = Text("EL SECRETO GEOMÉTRICO: UN RECTÁNGULO", font_size=19, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))
        eq_rect_top = MathTex(r"\mathbf{\text{Área } (d) = \text{Altura } (v) \times \text{Base } (t)}", font_size=36, color="#1B2631").move_to(eq_box.get_center())

        # Mostrar brevemente el triangulito tachado (76.5s - 81.2s)
        mini_tri_poly = Polygon(
            np.array([-0.20, 3.40, 0]),
            np.array([-1.65, 1.00, 0]),
            np.array([1.25, 1.00, 0]),
            stroke_color="#7F8C8D", stroke_width=3.2, fill_color="#EAECEE", fill_opacity=0.85
        )
        mini_hl = Line(np.array([-0.925, 2.20, 0]), np.array([0.525, 2.20, 0]), stroke_color="#7F8C8D", stroke_width=2.5)
        mini_vl = Line(np.array([-0.20, 2.20, 0]), np.array([-0.20, 1.00, 0]), stroke_color="#7F8C8D", stroke_width=2.5)
        mini_d = MathTex(r"\mathbf{d}", font_size=40, color="#C0392B").move_to(np.array([-0.20, 2.65, 0]))
        mini_v = MathTex(r"\mathbf{v}", font_size=38, color="#2980B9").move_to(np.array([-0.70, 1.55, 0]))
        mini_t = MathTex(r"\mathbf{t}", font_size=38, color="#D35400").move_to(np.array([0.30, 1.55, 0]))
        mini_tri = VGroup(mini_tri_poly, mini_hl, mini_vl, mini_d, mini_v, mini_t)
        cross_l1 = Line(np.array([-1.75, 3.45, 0]), np.array([1.35, 0.95, 0]), stroke_color="#C0392B", stroke_width=6.5)
        cross_l2 = Line(np.array([-1.75, 0.95, 0]), np.array([1.35, 3.45, 0]), stroke_color="#C0392B", stroke_width=6.5)
        no_tri_txt = Text("¡Olvida memorizar el triangulito!", font_size=23, weight=BOLD, color="#C0392B").move_to(np.array([-0.20, 0.30, 0]))

        self.play(
            Transform(ded_title, ded_title_act5),
            Transform(eq_main, eq_rect_top),
            FadeIn(mini_tri), Create(cross_l1), Create(cross_l2), FadeIn(no_tri_txt),
            run_time=1.2
        )

        # 81.28s (1:21.28): Si dibujas la velocidad como la altura de 4 y el tiempo como la base de 3, se forma un rectángulo perfecto de 12 cuadrados
        sync_to(81.28)
        self.play(FadeOut(mini_tri), FadeOut(cross_l1), FadeOut(cross_l2), FadeOut(no_tri_txt), run_time=0.45)

        # Cuadrícula rectangular de 4 filas (v = 4) x 3 columnas (t = 3)
        # Lado de cada celda = 0.82 -> Ancho = 2.46, Alto = 3.28
        # Centro en (-0.10, 1.95) -> Y in [0.31, 3.59]
        # Margen arriba hasta eq_box (4.90): +1.31u | Margen abajo tras etiqueta t=3 hasta card_ded (-1.75): +1.45u
        cell_s = 0.82
        grid_4x3 = VGroup()
        x0_grid = -0.10 - (1.5 * cell_s)
        y0_grid = 1.95 - (2.0 * cell_s)
        for r in range(4):
            for c in range(3):
                sq = Square(
                    side_length=cell_s,
                    stroke_color=WHITE, stroke_width=2.4,
                    fill_color="#117864", fill_opacity=0.88
                ).move_to(np.array([x0_grid + (c + 0.5) * cell_s, y0_grid + (r + 0.5) * cell_s, 0]))
                grid_4x3.add(sq)

        rect_border = SurroundingRectangle(grid_4x3, color="#1B4F72", buff=0, stroke_width=4.0)
        brace_v4 = Brace(grid_4x3, LEFT, buff=0.14, color="#2980B9")
        lbl_v4 = MathTex(r"\mathbf{v = 4}", font_size=38, color="#2980B9").next_to(brace_v4, LEFT, buff=0.14)

        brace_t3_rect = Brace(grid_4x3, DOWN, buff=0.14, color="#D35400")
        lbl_t3_rect = MathTex(r"\mathbf{t = 3}", font_size=38, color="#D35400").next_to(brace_t3_rect, DOWN, buff=0.12)

        lbl_area_inside = MathTex(r"\mathbf{\text{Área } d = 12}", font_size=38, color=WHITE).move_to(grid_4x3.get_center())
        bg_area_pill = SurroundingRectangle(lbl_area_inside, color="#0E6251", fill_color="#0E6251", fill_opacity=0.85, buff=0.12, corner_radius=0.10)

        self.play(
            GrowFromCenter(brace_v4), FadeIn(lbl_v4),
            GrowFromCenter(brace_t3_rect), FadeIn(lbl_t3_rect),
            LaggedStart(*[FadeIn(cell, scale=0.85) for cell in grid_4x3], lag_ratio=0.05),
            Create(rect_border),
            run_time=2.2
        )
        self.play(FadeIn(bg_area_pill), Write(lbl_area_inside), run_time=0.8)

        # 88.61s (1:28.61): Multiplicar base por altura te da el área total, que es la distancia
        sync_to(88.61)
        rect_step1 = MathTex(r"\text{1. Área (Distancia): } \quad \mathbf{d = v \times t}", font_size=35, color="#196F3D").move_to(np.array([-0.2, -2.98, 0]))
        self.play(Write(rect_step1), run_time=1.3)

        # 92.95s (1:32.95): Y dividir el área entre un lado siempre te devuelve el otro lado
        sync_to(92.95)
        rect_step2 = MathTex(r"\text{2. Lados: } \quad \mathbf{v = \frac{d}{t}} \quad \Big| \quad \mathbf{t = \frac{d}{v}}", font_size=34, color="#2980B9").move_to(np.array([-0.2, -4.15, 0]))
        self.play(Write(rect_step2), run_time=1.4)

        # =============================================================
        # ACTO 6: APLICACIONES EN EL DÍA A DÍA Y SÍNTESIS (96.73s - 117.86s)
        # =============================================================
        sync_to(96.73)
        self.play(
            FadeOut(grid_4x3), FadeOut(rect_border),
            FadeOut(brace_v4), FadeOut(lbl_v4),
            FadeOut(brace_t3_rect), FadeOut(lbl_t3_rect),
            FadeOut(bg_area_pill), FadeOut(lbl_area_inside),
            FadeOut(rect_step1), FadeOut(rect_step2),
            run_time=0.45
        )

        txt_app1 = Text("1. GPS", font_size=20, weight=BOLD, color="#1B4F72").move_to(badge_top_1.get_center())
        txt_app2 = Text("2. Cruzar Calle", font_size=19, weight=BOLD, color="#D35400").move_to(badge_top_2.get_center())
        txt_app3 = Text("3. Escalera", font_size=20, weight=BOLD, color="#196F3D").move_to(badge_top_3.get_center())
        eq_app_top = MathTex(r"\mathbf{\text{M.R.U. en tu Vida Diaria: } t = \frac{d}{v}}", font_size=36, color="#1B4F72").move_to(eq_box.get_center())
        ded_title_act6 = Text("APLICACIONES EN EL MUNDO REAL", font_size=20, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, -2.12, 0]))

        # Panel central visual para GPS y Vida Diaria (Y in [-0.50, +3.85])
        gps_card = RoundedRectangle(
            corner_radius=0.22, width=7.0, height=3.85,
            stroke_color="#2980B9", stroke_width=2.6,
            fill_color="#FFFFFF", fill_opacity=0.96
        ).move_to(np.array([-0.20, 1.85, 0]))
        gps_title = Text("GPS EN CARRETERA: ESTIMAR LLEGADA (ETA)", font_size=19, weight=BOLD, color="#1B4F72").move_to(np.array([-0.20, 3.35, 0]))

        gps_road = Line(np.array([-3.0, 1.15, 0]), np.array([2.6, 1.15, 0]), stroke_color="#34495E", stroke_width=4.0)
        gps_car = build_car(color_body="#2980B9", color_roof="#85C1E9", scale_factor=0.90).move_to(np.array([-2.2, 1.50, 0]))
        gps_flag = Polygon(
            np.array([2.1, 1.15, 0]), np.array([2.35, 1.65, 0]), np.array([2.6, 1.15, 0]),
            stroke_color="#196F3D", stroke_width=2.5, fill_color="#2ECC71", fill_opacity=0.95
        )
        # Pin de satélite GPS arriba
        pin_circle = Circle(radius=0.32, stroke_color="#C0392B", stroke_width=3.5, fill_color="#E74C3C", fill_opacity=0.95).move_to(np.array([-0.20, 2.55, 0]))
        pin_dot = Dot(pin_circle.get_center(), radius=0.10, color=WHITE)
        gps_beam = DashedLine(pin_circle.get_bottom(), gps_car.get_top(), color="#F39C12", stroke_width=3.2)
        eta_lbl = MathTex(r"\mathbf{\text{ETA: } t = \frac{d}{v} = 15\;\text{min}}", font_size=34, color="#D35400").move_to(np.array([-0.20, 0.45, 0]))

        app_bullets = VGroup(
            Text("• GPS: Calcula en cuántos minutos llegas", font_size=21, weight=BOLD, color="#1B4F72"),
            Text("• Cerebro: Calcula si cruzas la avenida", font_size=21, weight=BOLD, color="#D35400"),
            Text("• Escalera eléctrica: Ritmo constante seguro", font_size=21, weight=BOLD, color="#196F3D"),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to(np.array([-0.2, -3.55, 0]))

        self.play(
            Transform(txt_top_1, txt_app1),
            Transform(txt_top_2, txt_app2),
            Transform(txt_top_3, txt_app3),
            Transform(eq_main, eq_app_top),
            Transform(ded_title, ded_title_act6),
            FadeIn(gps_card), FadeIn(gps_title),
            Create(gps_road), FadeIn(gps_car), FadeIn(gps_flag),
            FadeIn(pin_circle), FadeIn(pin_dot), Create(gps_beam),
            Write(eta_lbl),
            FadeIn(app_bullets),
            run_time=1.8
        )

        # Animar el coche avanzando hacia la meta con el rayo GPS siguiéndolo
        new_car_pos = np.array([1.45, 1.50, 0])
        new_beam = DashedLine(pin_circle.get_bottom(), new_car_pos + UP * 0.25, color="#F39C12", stroke_width=3.2)
        self.play(
            gps_car.animate.move_to(new_car_pos),
            Transform(gps_beam, new_beam),
            run_time=3.5,
            rate_func=linear
        )

        # 112.34s (1:52.34): Velocidad es el bloque que avanzas en 1 segundo, y distancia es la suma de todos tus vagones
        sync_to(112.34)
        self.play(FadeOut(app_bullets), run_time=0.4)

        ded_title_synth = Text("REGLA DE ORO PARA NUNCA OLVIDARLO", font_size=20, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))
        synth_1 = MathTex(r"\mathbf{\text{Velocidad}} = \text{El bloque que avanzas en } 1\;\text{s}", font_size=31, color="#1B4F72").move_to(np.array([-0.2, -3.10, 0]))
        synth_2 = MathTex(r"\mathbf{\text{Distancia}} = \text{La suma de todos tus vagones}", font_size=31, color="#C0392B").move_to(np.array([-0.2, -4.15, 0]))

        self.play(
            Transform(ded_title, ded_title_synth),
            Write(synth_1),
            Write(synth_2),
            run_time=1.6
        )

        # =============================================================
        # ACTO 7: CIERRE VIRAL ZÉNIT CIENCIA (117.86s - 121.15s)
        # =============================================================
        sync_to(117.86)
        all_act6 = VGroup(
            eq_box, eq_main,
            badge_top_1, txt_top_1, badge_top_2, txt_top_2, badge_top_3, txt_top_3,
            gps_card, gps_title, gps_road, gps_car, gps_flag,
            pin_circle, pin_dot, gps_beam, eta_lbl,
            card_ded, ded_title, synth_1, synth_2
        )
        self.play(FadeOut(all_act6), run_time=0.5)

        outro_card = RoundedRectangle(
            corner_radius=0.28, width=7.2, height=6.8,
            stroke_color="#1B4F72", stroke_width=3.2,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, 0.7, 0]))

        outro_header = RoundedRectangle(
            corner_radius=0.18, width=6.6, height=0.80,
            stroke_color="#D35400", stroke_width=2.4,
            fill_color="#FEF9E7", fill_opacity=0.98
        ).move_to(outro_card.get_top() + DOWN * 0.58)
        outro_header_txt = Text("ZÉNIT CIENCIA", font_size=26, weight=BOLD, color="#D35400").move_to(outro_header.get_center())

        sub_header = Text("La ciencia no se memoriza, ¡se ve!", font_size=22, weight=BOLD, color="#1B4F72").next_to(outro_header, DOWN, buff=0.35)

        cta_row1 = VGroup(
            Dot(color="#2980B9", radius=0.08),
            Text("Guarda este video para tus exámenes", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row2 = VGroup(
            Dot(color="#E67E22", radius=0.08),
            Text("Compártelo con quien sufra en física", font_size=20, color="#2C3E50")
        ).arrange(RIGHT, buff=0.22)

        cta_row3 = VGroup(
            Dot(color="#27AE60", radius=0.08),
            Text("Síguenos en Zénit Ciencia para más", font_size=20, weight=BOLD, color="#196F3D")
        ).arrange(RIGHT, buff=0.22)

        cta_items = VGroup(cta_row1, cta_row2, cta_row3).arrange(DOWN, aligned_edge=LEFT, buff=0.28).next_to(sub_header, DOWN, buff=0.35)

        poly_center = outro_card.get_bottom() + UP * 1.55
        circle_logo = Circle(radius=0.92, color="#D35400", stroke_width=2.5).move_to(poly_center)

        poly_lines = VGroup()
        angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
        pts = [poly_center + np.array([np.cos(a) * 0.82, np.sin(a) * 0.82, 0]) for a in angles]
        for i in range(len(pts)):
            poly_lines.add(Line(pts[i], pts[(i + 1) % len(pts)], stroke_color="#D35400", stroke_width=2.2))
            poly_lines.add(Line(pts[i], poly_center, stroke_color="#F39C12", stroke_width=1.6))
            poly_lines.add(Line(pts[i], pts[(i + 2) % len(pts)], stroke_color="#2980B9", stroke_width=1.2))

        logo_name = Text("Z É N I T   C I E N C I A", font_size=19, weight=BOLD, color="#1B4F72").next_to(circle_logo, DOWN, buff=0.18)

        outro_group = VGroup(outro_card, outro_header, outro_header_txt, sub_header, cta_items, circle_logo, poly_lines, logo_name)
        self.play(FadeIn(outro_group), run_time=0.8)

        rem_time = 119.83 - self.time
        if rem_time > 0.1:
            self.play(Rotate(poly_lines, angle=np.pi, about_point=poly_center), run_time=rem_time, rate_func=linear)

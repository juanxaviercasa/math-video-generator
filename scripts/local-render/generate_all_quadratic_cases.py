# -*- coding: utf-8 -*-
r"""
Script de generación integral de videos de ecuaciones cuadráticas con Manim 2.2
Salida: %USERPROFILE%\Videos\ecuaciones-cuadraticas-finales\ (o MVG_OUTPUT_ROOT)
"""
import os
import re
import sys
from pathlib import Path
from manim import *

# Configuración global de Manim para render rápido y nítido
config.media_dir = str(Path("temp_renders_all").resolve())
config.pixel_width = 1280
config.pixel_height = 720
config.frame_rate = 30
config.background_color = "#101D33"

OUTPUT_DIR = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

class SafeMathText(Text):
    """Renderizador seguro de notación matemática usando Pango y fuentes de Windows sin requerir LaTeX."""
    def __init__(self, text, font_size=42, color=WHITE, **kwargs):
        s = str(text)
        s = s.replace(r"\Delta", "Δ").replace(r"\pm", "±").replace(r"\cdot", "·").replace(r"\times", "×")
        s = s.replace(r"\le", "≤").replace(r"\ge", "≥").replace(r"\neq", "≠")
        s = re.sub(r"\\sqrt\{([^}]+)\}", r"√(\1)", s)
        s = re.sub(r"\\frac\{([^}]+)\}\{([^}]+)\}", r"(\1)/(\2)", s)
        s = re.sub(r"\\left|\\right|[\{\}]", "", s)
        kwargs.pop("tex_environment", None)
        kwargs.pop("tex_template", None)
        super().__init__(s, font_size=font_size, color=color, font="Cambria Math", **kwargs)

# ==============================================================================
# 1. CASO 01: ASPA SIMPLE MÓNICA
# ==============================================================================
class Caso01AspaSimpleMonica(Scene):
    def construct(self):
        # Título
        title = SafeMathText("Ecuación Cuadrática Completa: Aspa Simple", font_size=36, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = SafeMathText("x² - 7x + 12 = 0", font_size=52, color=YELLOW).next_to(title, DOWN, buff=0.4)
        self.play(FadeIn(title), Write(eq_initial), run_time=1.0)
        self.wait(0.5)

        # Paso 1: Aspa Simple
        step1_title = SafeMathText("Paso 1: Descomposición en Factores", font_size=28, color=TEAL).next_to(eq_initial, DOWN, buff=0.4)
        desc1 = SafeMathText("Buscamos dos números que multiplicados den +12 y sumados den -7:", font_size=24, color=GREY_A).next_to(step1_title, DOWN, buff=0.2)
        
        col_x = VGroup(
            SafeMathText("x", font_size=38, color=WHITE),
            SafeMathText("x", font_size=38, color=WHITE)
        ).arrange(DOWN, buff=0.4).shift(LEFT * 1.5 + DOWN * 0.8)

        col_nums = VGroup(
            SafeMathText("-3", font_size=38, color=LIGHT_PINK),
            SafeMathText("-4", font_size=38, color=LIGHT_PINK)
        ).arrange(DOWN, buff=0.4).shift(RIGHT * 1.5 + DOWN * 0.8)

        arrow1 = Arrow(col_x[0].get_right(), col_nums[1].get_left(), buff=0.1, color=BLUE_C, stroke_width=2.5)
        arrow2 = Arrow(col_x[1].get_right(), col_nums[0].get_left(), buff=0.1, color=BLUE_C, stroke_width=2.5)

        verif = SafeMathText("(-3) · (-4) = +12   y   (-3) + (-4) = -7x ✓", font_size=26, color=GREEN).next_to(col_nums, RIGHT, buff=0.8)

        self.play(FadeIn(step1_title), FadeIn(desc1), run_time=0.8)
        self.play(FadeIn(col_x), FadeIn(col_nums), GrowArrow(arrow1), GrowArrow(arrow2), run_time=1.0)
        self.play(FadeIn(verif), run_time=0.8)
        self.wait(1.0)

        # Paso 2: Forma factorizada
        self.play(FadeOut(step1_title), FadeOut(desc1), FadeOut(col_x), FadeOut(col_nums), FadeOut(arrow1), FadeOut(arrow2), FadeOut(verif), run_time=0.6)

        factor_eq = SafeMathText("(x - 3)(x - 4) = 0", font_size=48, color=TEAL_A).next_to(eq_initial, DOWN, buff=0.6)
        prop_text = SafeMathText("Propiedad del Producto Nulo: A · B = 0 ⇒ A = 0  ó  B = 0", font_size=24, color=GREY_B).next_to(factor_eq, DOWN, buff=0.3)
        self.play(Transform(eq_initial.copy(), factor_eq), FadeIn(prop_text), run_time=1.0)
        self.wait(0.6)

        # Ramas de solución
        branch1 = SafeMathText("x - 3 = 0  ⇒  x₁ = 3", font_size=34, color=WHITE).shift(LEFT * 2.5 + DOWN * 1.8)
        branch2 = SafeMathText("x - 4 = 0  ⇒  x₂ = 4", font_size=34, color=WHITE).shift(RIGHT * 2.5 + DOWN * 1.8)

        box_final = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.6).shift(DOWN * 2.5)
        sol_set = SafeMathText("Conjunto Solución: C.S. = { 3 ; 4 }", font_size=38, color=GREEN_A).move_to(box_final.get_center())

        self.play(FadeIn(branch1), FadeIn(branch2), run_time=0.8)
        self.play(Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# 2. CASO 02: ASPA SIMPLE NO MÓNICA (a > 1)
# ==============================================================================
class Caso02AspaSimpleNoMonica(Scene):
    def construct(self):
        title = SafeMathText("Ecuación Cuadrática No Mónica: Aspa Cruzada (a > 1)", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = SafeMathText("2x² + 5x - 3 = 0", font_size=52, color=YELLOW).next_to(title, DOWN, buff=0.4)
        self.play(FadeIn(title), Write(eq_initial), run_time=1.0)
        self.wait(0.5)

        step1 = SafeMathText("Descomponemos 2x² = (2x)(x)  y  -3 = (-1)(+3):", font_size=25, color=GREY_A).next_to(eq_initial, DOWN, buff=0.4)
        self.play(FadeIn(step1), run_time=0.6)

        col_x = VGroup(
            SafeMathText("2x", font_size=38, color=WHITE),
            SafeMathText("x", font_size=38, color=WHITE)
        ).arrange(DOWN, buff=0.4).shift(LEFT * 1.6 + DOWN * 0.7)

        col_nums = VGroup(
            SafeMathText("-1", font_size=38, color=LIGHT_PINK),
            SafeMathText("+3", font_size=38, color=LIGHT_PINK)
        ).arrange(DOWN, buff=0.4).shift(RIGHT * 1.6 + DOWN * 0.7)

        arrow1 = Arrow(col_x[0].get_right(), col_nums[1].get_left(), buff=0.1, color=BLUE_C, stroke_width=2.5)
        arrow2 = Arrow(col_x[1].get_right(), col_nums[0].get_left(), buff=0.1, color=BLUE_C, stroke_width=2.5)

        cross_verif = VGroup(
            SafeMathText("2x · (+3) = +6x", font_size=24, color=WHITE),
            SafeMathText("x · (-1) = -1x", font_size=24, color=WHITE),
            Line(LEFT*1.2, RIGHT*1.2, color=GREY_C, stroke_width=1.5),
            SafeMathText("Suma: +5x ✓", font_size=26, color=GREEN)
        ).arrange(DOWN, buff=0.12).next_to(col_nums, RIGHT, buff=0.8)

        self.play(FadeIn(col_x), FadeIn(col_nums), GrowArrow(arrow1), GrowArrow(arrow2), run_time=1.0)
        self.play(FadeIn(cross_verif), run_time=1.0)
        self.wait(1.0)

        self.play(FadeOut(step1), FadeOut(col_x), FadeOut(col_nums), FadeOut(arrow1), FadeOut(arrow2), FadeOut(cross_verif), run_time=0.6)

        factor_eq = SafeMathText("(2x - 1)(x + 3) = 0", font_size=48, color=TEAL_A).next_to(eq_initial, DOWN, buff=0.6)
        self.play(Write(factor_eq), run_time=0.8)

        branch1 = SafeMathText("2x - 1 = 0  ⇒  2x = 1  ⇒  x₁ = 1/2", font_size=32, color=WHITE).shift(LEFT * 2.2 + DOWN * 1.8)
        branch2 = SafeMathText("x + 3 = 0  ⇒  x₂ = -3", font_size=32, color=WHITE).shift(RIGHT * 2.5 + DOWN * 1.8)

        box_final = RoundedRectangle(corner_radius=0.2, width=8.8, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.6).shift(DOWN * 2.7)
        sol_set = SafeMathText("Conjunto Solución: C.S. = { -3 ; 1/2 }", font_size=38, color=GREEN_A).move_to(box_final.get_center())

        self.play(FadeIn(branch1), FadeIn(branch2), run_time=0.8)
        self.play(Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# 3. CASO 06: RAÍCES IRRACIONALES EXACTAS (Δ > 0 NO CUADRADO PERFECTO)
# ==============================================================================
class Caso06RaicesIrracionales(Scene):
    def construct(self):
        title = SafeMathText("Ecuación con Raíces Irracionales: Fórmula General", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = SafeMathText("x² - 4x + 1 = 0", font_size=52, color=YELLOW).next_to(title, DOWN, buff=0.4)
        self.play(FadeIn(title), Write(eq_initial), run_time=1.0)
        self.wait(0.5)

        step1 = SafeMathText("Identificamos coeficientes: a = 1, b = -4, c = 1", font_size=26, color=TEAL).next_to(eq_initial, DOWN, buff=0.35)
        disc = SafeMathText("Discriminante: Δ = (-4)² - 4(1)(1) = 16 - 4 = 12 > 0", font_size=28, color=WHITE).next_to(step1, DOWN, buff=0.25)
        disc_note = SafeMathText("Como 12 no es cuadrado perfecto, las raíces son irracionales conjugadas.", font_size=22, color=GREY_A).next_to(disc, DOWN, buff=0.2)
        self.play(FadeIn(step1), FadeIn(disc), FadeIn(disc_note), run_time=1.0)
        self.wait(0.8)

        self.play(FadeOut(step1), FadeOut(disc), FadeOut(disc_note), run_time=0.5)

        form_sub = SafeMathText("x = [-(-4) ± √(12)] / [2(1)] = [4 ± 2√3] / 2", font_size=38, color=WHITE).next_to(eq_initial, DOWN, buff=0.5)
        simp = SafeMathText("Simplificando entre 2:  x = 2 ± √3", font_size=42, color=GOLD).next_to(form_sub, DOWN, buff=0.35)
        self.play(Write(form_sub), run_time=0.9)
        self.play(FadeIn(simp), run_time=0.8)
        self.wait(0.6)

        branch = SafeMathText("x₁ = 2 + √3 ≈ 3.732   |   x₂ = 2 - √3 ≈ 0.268", font_size=30, color=WHITE).next_to(simp, DOWN, buff=0.4)
        box_final = RoundedRectangle(corner_radius=0.2, width=9.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.6).next_to(branch, DOWN, buff=0.35)
        sol_set = SafeMathText("Conjunto Solución: C.S. = { 2 - √3 ; 2 + √3 }", font_size=36, color=GREEN_A).move_to(box_final.get_center())

        self.play(FadeIn(branch), Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# 4. CASO 07: INCOMPLETA PURA REAL (b = 0, ac < 0)
# ==============================================================================
class Caso06IncompletaPura(Scene):
    def construct(self):
        title = SafeMathText("Ecuación Cuadrática Incompleta Pura (b = 0)", font_size=36, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = SafeMathText("x² - 25 = 0", font_size=56, color=YELLOW).next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(title), Write(eq_initial), run_time=1.0)
        self.wait(0.5)

        step1 = SafeMathText("Método 1: Despeje directo del término cuadrático", font_size=28, color=TEAL).next_to(eq_initial, DOWN, buff=0.5)
        step1_eq = SafeMathText("x² = 25", font_size=46, color=WHITE).next_to(step1, DOWN, buff=0.3)
        self.play(FadeIn(step1), Write(step1_eq), run_time=0.8)
        self.wait(0.6)

        step2 = SafeMathText("Aplicamos raíz cuadrada en ambos miembros (±):", font_size=26, color=GREY_A).next_to(step1_eq, DOWN, buff=0.4)
        step2_eq = SafeMathText("x = ±√(25)   ⇒   x = ± 5", font_size=48, color=GREEN).next_to(step2, DOWN, buff=0.3)
        self.play(FadeIn(step2), Write(step2_eq), run_time=1.0)
        self.wait(0.8)

        alt_note = SafeMathText("Equivalente por Diferencia de Cuadrados: (x - 5)(x + 5) = 0", font_size=22, color=GREY_B).next_to(step2_eq, DOWN, buff=0.5)
        box_final = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.6).next_to(alt_note, DOWN, buff=0.4)
        sol_set = SafeMathText("Conjunto Solución: C.S. = { -5 ; +5 }", font_size=38, color=GREEN_A).move_to(box_final.get_center())

        self.play(FadeIn(alt_note), Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# 4. CASO 08: INCOMPLETA MIXTA (c = 0)
# ==============================================================================
class Caso08IncompletaMixta(Scene):
    def construct(self):
        title = SafeMathText("Ecuación Cuadrática Incompleta Mixta (c = 0)", font_size=36, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = SafeMathText("x² - 6x = 0", font_size=56, color=YELLOW).next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(title), Write(eq_initial), run_time=1.0)
        self.wait(0.5)

        step1 = SafeMathText("Método: Factor Común Monomio", font_size=28, color=TEAL).next_to(eq_initial, DOWN, buff=0.5)
        desc1 = SafeMathText("Extraemos el factor común x (¡Nunca dividir entre x para no perder raíces!):", font_size=24, color=GREY_A).next_to(step1, DOWN, buff=0.2)
        self.play(FadeIn(step1), FadeIn(desc1), run_time=0.8)

        fact_eq = SafeMathText("x · (x - 6) = 0", font_size=50, color=TEAL_A).next_to(desc1, DOWN, buff=0.4)
        self.play(Write(fact_eq), run_time=0.8)
        self.wait(0.6)

        branch1 = SafeMathText("1° Factor: x₁ = 0", font_size=36, color=WHITE).shift(LEFT * 2.5 + DOWN * 1.5)
        branch2 = SafeMathText("2° Factor: x - 6 = 0  ⇒  x₂ = 6", font_size=36, color=WHITE).shift(RIGHT * 2.5 + DOWN * 1.5)

        note_zero = SafeMathText("Nota Clave: En toda ecuación con c = 0, una raíz siempre es exactamente 0.", font_size=22, color=GOLD).shift(DOWN * 2.2)

        box_final = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.6).shift(DOWN * 3.0)
        sol_set = SafeMathText("Conjunto Solución: C.S. = { 0 ; 6 }", font_size=38, color=GREEN_A).move_to(box_final.get_center())

        self.play(FadeIn(branch1), FadeIn(branch2), FadeIn(note_zero), run_time=1.0)
        self.play(Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# 5. CASO 10: PROBLEMA DE APLICACIÓN GEOMÉTRICA (ÁREAS)
# ==============================================================================
class Caso10ProblemaGeometria(Scene):
    def construct(self):
        title = SafeMathText("Problema de Planteo: Dimensiones de un Terreno", font_size=34, color=BLUE_B).to_edge(UP, buff=0.35)
        problem_stmt = SafeMathText('"El largo de un terreno rectangular excede en 7 m a su ancho y el área es 60 m²."', font_size=23, color=GREY_A).next_to(title, DOWN, buff=0.25)
        self.play(FadeIn(title), FadeIn(problem_stmt), run_time=1.0)
        self.wait(0.5)

        # Gráfico geométrico
        rect = Rectangle(width=4.0, height=2.2, color=BLUE_C, fill_color="#182E4B", fill_opacity=0.7).shift(LEFT * 2.8 + DOWN * 0.8)
        lbl_width = SafeMathText("Ancho = x", font_size=24, color=WHITE).next_to(rect, LEFT, buff=0.15)
        lbl_length = SafeMathText("Largo = x + 7", font_size=24, color=WHITE).next_to(rect, UP, buff=0.15)
        lbl_area = SafeMathText("Área = 60 m²", font_size=26, color=YELLOW).move_to(rect.get_center())

        self.play(Create(rect), Write(lbl_width), Write(lbl_length), Write(lbl_area), run_time=1.0)
        self.wait(0.5)

        # Planteo algebraico
        algebra_group = VGroup(
            SafeMathText("Área = (Largo) · (Ancho)", font_size=24, color=TEAL),
            SafeMathText("(x + 7) · x = 60", font_size=34, color=WHITE),
            SafeMathText("x² + 7x - 60 = 0", font_size=38, color=YELLOW),
            SafeMathText("Aspa Simple: (x + 12)(x - 5) = 0", font_size=28, color=LIGHT_PINK),
            SafeMathText("x₁ = 5   ó   x₂ = -12", font_size=32, color=WHITE)
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT).shift(RIGHT * 2.8 + DOWN * 0.8)

        for item in algebra_group:
            self.play(FadeIn(item), run_time=0.6)

        # Descarte de la raíz negativa
        discard = SafeMathText("Descarta x = -12 (longitud > 0)", font_size=22, color=RED).next_to(algebra_group[-1], RIGHT, buff=0.3)
        self.play(FadeIn(discard), run_time=0.5)
        self.wait(0.6)

        box_final = RoundedRectangle(corner_radius=0.2, width=9.5, height=1.2, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).to_edge(DOWN, buff=0.3)
        sol_set = SafeMathText("Dimensiones Reales: Ancho = 5 m   |   Largo = 12 m  (5 × 12 = 60 m²)", font_size=28, color=GREEN_A).move_to(box_final.get_center())

        self.play(Create(box_final), Write(sol_set), run_time=1.0)
        self.wait(2.0)

# ==============================================================================
# EJECUCIÓN SECUENCIAL Y EXPORTACIÓN A MP4
# ==============================================================================
SCENES = [
    (Caso01AspaSimpleMonica, "01_completa_aspa_simple_monica.mp4"),
    (Caso02AspaSimpleNoMonica, "02_completa_aspa_simple_no_monica.mp4"),
    (Caso06RaicesIrracionales, "06_completa_raices_irracionales_exactas.mp4"),
    (Caso06IncompletaPura, "07_incompleta_pura_despeje_directo.mp4"),
    (Caso08IncompletaMixta, "08_incompleta_mixta_factor_comun.mp4"),
    (Caso10ProblemaGeometria, "09_problema_planteo_area_terreno.mp4"),
]

def main():
    print(f"=== INICIANDO RENDERIZADO DE {len(SCENES)} VIDEOS FINALES DE ECUACIONES CUADRÁTICAS ===")
    for scene_cls, filename in SCENES:
        dest_path = OUTPUT_DIR / filename
        if dest_path.exists() and dest_path.stat().st_size > 1000:
            print(f"✓ Ya existe: {dest_path.name} ({dest_path.stat().st_size / 1024 / 1024:.2f} MB)")
            continue
        print(f"\n[Compilando] {scene_cls.__name__} -> {filename}...")
        scene = scene_cls()
        scene.render()
        
        # Buscar el archivo generado por Manim en temp_renders_all
        pattern = f"{scene_cls.__name__}.mp4"
        found = list(Path("temp_renders_all").rglob(pattern))
        if found:
            src_file = found[-1]
            import shutil
            shutil.copyfile(src_file, dest_path)
            print(f"✓ ÉXITO: {dest_path.name} ({dest_path.stat().st_size / 1024 / 1024:.2f} MB)")
        else:
            print(f"⚠ Alerta: no se encontró archivo generado para {pattern}")

    print("\n=== TODOS LOS VIDEOS HAN SIDO COMPILADOS EXITOSAMENTE ===")

if __name__ == "__main__":
    main()

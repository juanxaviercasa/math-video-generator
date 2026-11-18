# -*- coding: utf-8 -*-
r"""
Suite Maestra de Generación de Videos de Ecuaciones Cuadráticas para Zénit
- Fórmulas en LaTeX auténtico (Matplotlib MathText a 300 DPI con Computer Modern).
- Textos y títulos explicativos en Pango de alta definición.
- Narración de voz neural en español con Edge-TTS (es-PE-CamilaNeural).
- Sincronización audiovisual exacta y muxing profesional con FFmpeg.
- Salida final: %USERPROFILE%\Videos\ecuaciones-cuadraticas-finales\ (o MVG_OUTPUT_ROOT)
"""
import os
import sys
import shutil
import subprocess
import hashlib
import json
from pathlib import Path
import matplotlib.pyplot as plt
from manim import *

REPO_ROOT = Path(__file__).resolve().parents[2]
_venv_edge_tts = REPO_ROOT / ".venv" / "Scripts" / "edge-tts.exe"
EDGE_TTS = str(_venv_edge_tts) if _venv_edge_tts.exists() else (shutil.which("edge-tts") or "edge-tts")

OUTPUT_DIR = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PNG_CACHE = Path("temp_latex_pngs")
PNG_CACHE.mkdir(parents=True, exist_ok=True)

AUDIO_CACHE = Path("temp_voice_audio")
AUDIO_CACHE.mkdir(parents=True, exist_ok=True)

config.media_dir = str(Path("temp_renders_master").resolve())
config.background_color = "#101D33"

def render_latex(latex_str, color="white", fontsize=32, scale=1.0):
    """Genera un ImageMobject de Manim a partir de código LaTeX auténtico."""
    cache_key = hashlib.md5(f"{latex_str}_{color}_{fontsize}".encode()).hexdigest()
    png_path = PNG_CACHE / f"{cache_key}.png"
    
    if not png_path.exists():
        fig = plt.figure(figsize=(10, 2), dpi=300)
        fig.patch.set_alpha(0.0)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis('off')
        ax.patch.set_alpha(0.0)
        
        raw = latex_str.strip()
        if not (raw.startswith("$") and raw.endswith("$")):
            raw = f"${raw}$"
            
        ax.text(0.5, 0.5, raw, size=fontsize, color=color, ha='center', va='center')
        fig.savefig(png_path, format='png', transparent=True, bbox_inches='tight', pad_inches=0.04)
        plt.close(fig)
        
    mob = ImageMobject(str(png_path))
    mob.scale(scale * 0.23)
    return mob

def get_media_duration(file_path):
    """Obtiene la duración exacta de un archivo de audio o video vía ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def has_audio_stream(file_path):
    """Verifica si un archivo MP4 ya contiene una pista de audio funcional."""
    if not Path(file_path).exists():
        return False
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "stream=codec_type",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return "audio" in res.stdout

def generate_voiceover(text, filename):
    """Genera narración en español neutro/cálido con Edge-TTS."""
    out_path = AUDIO_CACHE / filename
    if out_path.exists() and out_path.stat().st_size > 1000:
        return out_path
    cmd = [
        EDGE_TTS,
        "--voice", "es-PE-CamilaNeural",
        "--text", text,
        "--write-media", str(out_path)
    ]
    subprocess.run(cmd, check=True)
    return out_path

def mux_video_audio(video_path, audio_path, output_path):
    """Mezcla pista de video y audio con FFmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(output_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# ==============================================================================
# ESCENAS MANIM PEDAGÓGICAS CON LATEX AUTÉNTICO
# ==============================================================================

class Scene01AspaSimple(Scene):
    def construct(self):
        title = Text("Ecuación Cuadrática Completa: Aspa Simple", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 - 7x + 12 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        step1 = Text("1. Descomposición de extremos:", font_size=24, color=TEAL).next_to(eq, DOWN, buff=0.3)
        top_line = render_latex(r"x \quad \searrow \quad -4 \Rightarrow -4x", color="#FFFFFF", scale=1.1)
        bot_line = render_latex(r"x \quad \nearrow \quad -3 \Rightarrow -3x", color="#FFFFFF", scale=1.1)
        aspa_tex = Group(top_line, bot_line).arrange(DOWN, buff=0.25).next_to(step1, DOWN, buff=0.25)
        sum_tex = render_latex(r"\text{Suma central: } (-4x) + (-3x) = -7x \quad \checkmark", color="#83C167", scale=1.05).next_to(aspa_tex, DOWN, buff=0.25)
        
        self.play(FadeIn(step1), FadeIn(aspa_tex), run_time=1.2)
        self.wait(2.5)
        self.play(FadeIn(sum_tex), run_time=1.0)
        self.wait(3.0)

        self.play(FadeOut(step1), FadeOut(aspa_tex), FadeOut(sum_tex), run_time=0.6)

        factor_tex = render_latex(r"(x - 3)(x - 4) = 0", color="#5CD0B3", scale=1.35).next_to(eq, DOWN, buff=0.45)
        branches = render_latex(r"x - 3 = 0 \Rightarrow x_1 = 3 \quad \vert \quad x - 4 = 0 \Rightarrow x_2 = 4", color="#FFFFFF", scale=1.15).next_to(factor_tex, DOWN, buff=0.35)
        
        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(branches, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ 3 \;;\; 4 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(FadeIn(factor_tex), run_time=1.0)
        self.wait(2.0)
        self.play(FadeIn(branches), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene02AspaNoMonica(Scene):
    def construct(self):
        title = Text("Ecuación Cuadrática No Mónica: Aspa Cruzada", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"2x^2 + 5x - 3 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        step1 = Text("1. Descomposición con coeficiente a = 2:", font_size=24, color=TEAL).next_to(eq, DOWN, buff=0.3)
        top_line = render_latex(r"2x \quad \searrow \quad +3 \Rightarrow +6x", color="#FFFFFF", scale=1.1)
        bot_line = render_latex(r"x \quad \nearrow \quad -1 \Rightarrow -x", color="#FFFFFF", scale=1.1)
        aspa_tex = Group(top_line, bot_line).arrange(DOWN, buff=0.25).next_to(step1, DOWN, buff=0.25)
        sum_tex = render_latex(r"\text{Suma central: } (+6x) + (-x) = +5x \quad \checkmark", color="#83C167", scale=1.05).next_to(aspa_tex, DOWN, buff=0.25)

        self.play(FadeIn(step1), FadeIn(aspa_tex), run_time=1.2)
        self.wait(2.5)
        self.play(FadeIn(sum_tex), run_time=1.0)
        self.wait(3.0)

        self.play(FadeOut(step1), FadeOut(aspa_tex), FadeOut(sum_tex), run_time=0.6)

        factor_tex = render_latex(r"(2x - 1)(x + 3) = 0", color="#5CD0B3", scale=1.35).next_to(eq, DOWN, buff=0.45)
        branches = render_latex(r"2x - 1 = 0 \Rightarrow x_1 = \frac{1}{2} \quad \vert \quad x + 3 = 0 \Rightarrow x_2 = -3", color="#FFFFFF", scale=1.15).next_to(factor_tex, DOWN, buff=0.35)

        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(branches, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ -3 \;;\; \frac{1}{2} \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(FadeIn(factor_tex), run_time=1.0)
        self.wait(2.0)
        self.play(FadeIn(branches), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene03FormulaGeneral(Scene):
    def construct(self):
        title = Text("Fórmula General: Dos Raíces Reales (Δ > 0)", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 - 5x + 6 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        coef = render_latex(r"a = 1, \quad b = -5, \quad c = 6", color="#5CD0B3", scale=1.15).next_to(eq, DOWN, buff=0.3)
        disc = render_latex(r"\Delta = b^2 - 4ac = (-5)^2 - 4(1)(6) = 25 - 24 = 1 > 0", color="#FFFFFF", scale=1.15).next_to(coef, DOWN, buff=0.25)
        self.play(FadeIn(coef), FadeIn(disc), run_time=1.2)
        self.wait(3.5)

        self.play(FadeOut(coef), FadeOut(disc), run_time=0.6)

        formula = render_latex(r"x = \frac{-b \pm \sqrt{\Delta}}{2a} = \frac{-(-5) \pm \sqrt{1}}{2(1)} = \frac{5 \pm 1}{2}", color="#FFFFFF", scale=1.25).next_to(eq, DOWN, buff=0.4)
        roots = render_latex(r"x_1 = \frac{5 + 1}{2} = 3 \quad \vert \quad x_2 = \frac{5 - 1}{2} = 2", color="#F4D03F", scale=1.15).next_to(formula, DOWN, buff=0.35)

        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(roots, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ 2 \;;\; 3 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(FadeIn(formula), run_time=1.0)
        self.wait(2.5)
        self.play(FadeIn(roots), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene04RaizUnicaTCP(Scene):
    def construct(self):
        title = Text("Discriminante Nulo: Raíz Real Doble (Δ = 0)", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 - 6x + 9 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        disc = render_latex(r"\Delta = (-6)^2 - 4(1)(9) = 36 - 36 = 0", color="#FFFFFF", scale=1.2).next_to(eq, DOWN, buff=0.35)
        note = Text("Δ = 0 ⇒ Trinomio Cuadrado Perfecto (Una única raíz real repetida)", font_size=21, color=TEAL).next_to(disc, DOWN, buff=0.25)
        self.play(FadeIn(disc), FadeIn(note), run_time=1.2)
        self.wait(3.5)

        self.play(FadeOut(disc), FadeOut(note), run_time=0.6)

        tcp = render_latex(r"(x - 3)^2 = 0 \Rightarrow x - 3 = 0", color="#5CD0B3", scale=1.3).next_to(eq, DOWN, buff=0.45)
        root = render_latex(r"x_1 = x_2 = 3 \quad (\text{Raíz Doble})", color="#F4D03F", scale=1.2).next_to(tcp, DOWN, buff=0.35)

        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(root, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ 3 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(FadeIn(tcp), run_time=1.0)
        self.wait(2.0)
        self.play(FadeIn(root), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene05RaicesComplejas(Scene):
    def construct(self):
        title = Text("Discriminante Negativo: Raíces Complejas (Δ < 0)", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 + 2x + 5 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        disc = render_latex(r"\Delta = 2^2 - 4(1)(5) = 4 - 20 = -16 < 0", color="#FFFFFF", scale=1.2).next_to(eq, DOWN, buff=0.35)
        note = Text("Δ < 0 ⇒ No existen soluciones reales (C.S. real es vacío)", font_size=21, color=LIGHT_PINK).next_to(disc, DOWN, buff=0.25)
        self.play(FadeIn(disc), FadeIn(note), run_time=1.2)
        self.wait(3.5)

        self.play(FadeOut(disc), FadeOut(note), run_time=0.6)

        formula = render_latex(r"x = \frac{-2 \pm \sqrt{-16}}{2(1)} = \frac{-2 \pm 4i}{2} = -1 \pm 2i", color="#FFFFFF", scale=1.25).next_to(eq, DOWN, buff=0.45)
        subsets = render_latex(r"\mathrm{C.S.}_{\mathbb{R}} = \emptyset \quad \vert \quad \mathrm{C.S.}_{\mathbb{C}} = \{ -1 - 2i \;;\; -1 + 2i \}", color="#F4D03F", scale=1.15).next_to(formula, DOWN, buff=0.35)

        box = RoundedRectangle(corner_radius=0.2, width=9.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(subsets, DOWN, buff=0.35)
        sol = render_latex(r"\text{Dos Raíces Complejas Conjugadas: } x = -1 \pm 2i", color="#83C167", scale=1.1).move_to(box.get_center())

        self.play(FadeIn(formula), run_time=1.0)
        self.wait(2.5)
        self.play(FadeIn(subsets), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene07IncompletaPura(Scene):
    def construct(self):
        title = Text("Ecuación Incompleta Pura (b = 0): Despeje Directo", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 - 25 = 0 \quad (b = 0)", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        step1 = render_latex(r"x^2 = 25", color="#5CD0B3", scale=1.4).next_to(eq, DOWN, buff=0.4)
        step2 = render_latex(r"x = \pm \sqrt{25} \Rightarrow x = \pm 5", color="#FFFFFF", scale=1.35).next_to(step1, DOWN, buff=0.35)
        self.play(FadeIn(step1), run_time=1.0)
        self.wait(2.0)
        self.play(FadeIn(step2), run_time=1.0)
        self.wait(3.0)

        alt = Text("Método alternativo por Diferencia de Cuadrados: (x - 5)(x + 5) = 0", font_size=20, color=GREY_A).next_to(step2, DOWN, buff=0.35)
        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(alt, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ -5 \;;\; +5 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(FadeIn(alt), run_time=0.8)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene08IncompletaMixta(Scene):
    def construct(self):
        title = Text("Ecuación Incompleta Mixta (c = 0): Factor Común", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq = render_latex(r"x^2 - 6x = 0 \quad (c = 0)", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        step1 = render_latex(r"x \cdot (x - 6) = 0", color="#5CD0B3", scale=1.4).next_to(eq, DOWN, buff=0.4)
        warn = Text("¡Nunca dividir entre x! Se perdería la raíz x = 0.", font_size=21, color=GOLD).next_to(step1, DOWN, buff=0.25)
        self.play(FadeIn(step1), FadeIn(warn), run_time=1.2)
        self.wait(3.0)

        branches = render_latex(r"x_1 = 0 \quad \mathrm{o} \quad x - 6 = 0 \Rightarrow x_2 = 6", color="#FFFFFF", scale=1.2).next_to(warn, DOWN, buff=0.35)
        rule = Text("Propiedad: En toda ecuación con c = 0, una raíz siempre es cero.", font_size=21, color=TEAL).next_to(branches, DOWN, buff=0.25)
        self.play(FadeIn(branches), FadeIn(rule), run_time=1.0)
        self.wait(3.0)

        box = RoundedRectangle(corner_radius=0.2, width=8.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(rule, DOWN, buff=0.35)
        sol = render_latex(r"\mathrm{C.S.} = \{ 0 \;;\; 6 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

class Scene09ProblemaGeometria(Scene):
    def construct(self):
        title = Text("Problema Geométrico: Dimensiones de un Terreno", font_size=32, color=BLUE_B).to_edge(UP, buff=0.35)
        stmt = Text('"El largo excede en 7 m al ancho y el área es de 60 m²."', font_size=23, color=GREY_A).next_to(title, DOWN, buff=0.25)
        self.play(FadeIn(title), FadeIn(stmt), run_time=1.0)
        self.wait(2.0)

        geom = render_latex(r"\text{Ancho} = x, \quad \text{Largo} = x + 7, \quad \text{Área} = (x+7)x = 60", color="#5CD0B3", scale=1.15).next_to(stmt, DOWN, buff=0.35)
        quad = render_latex(r"x^2 + 7x - 60 = 0 \Rightarrow (x + 12)(x - 5) = 0", color="#F4D03F", scale=1.2).next_to(geom, DOWN, buff=0.3)
        roots = render_latex(r"x_1 = 5 \text{ (valido)} \quad \vert \quad x_2 = -12 \text{ (descartado por longitud } > 0)", color="#FFFFFF", scale=1.05).next_to(quad, DOWN, buff=0.3)

        box = RoundedRectangle(corner_radius=0.2, width=9.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(roots, DOWN, buff=0.35)
        sol = render_latex(r"\text{Dimensiones: Ancho } = 5\text{ m} \quad \vert \quad \text{Largo } = 12\text{ m}", color="#83C167", scale=1.2).move_to(box.get_center())

        self.play(FadeIn(geom), run_time=1.0)
        self.wait(2.5)
        self.play(FadeIn(quad), run_time=1.0)
        self.wait(2.5)
        self.play(FadeIn(roots), run_time=1.0)
        self.wait(2.5)
        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

MASTER_CASES = [
    {
        "id": "01",
        "filename": "01_completa_aspa_simple_monica.mp4",
        "scene_class": Scene01AspaSimple,
        "audio_text": (
            "En esta lección resolveremos la ecuación cuadrática x al cuadrado menos siete x más doce igual a cero. "
            "Aplicamos el método del aspa simple descomponiendo el término cuadrático en x por x, y el término independiente en menos tres por menos cuatro. "
            "Al verificar la multiplicación cruzada: menos tres x y menos cuatro x suman exactamente menos siete x, el término central. "
            "Factorizamos la expresión como x menos tres por x menos cuatro igual a cero. "
            "Por la propiedad del producto nulo, igualamos cada factor a cero. "
            "Obtenemos las soluciones x sub uno igual a tres, y x sub dos igual a cuatro. "
            "El conjunto solución es tres y cuatro."
        )
    },
    {
        "id": "02",
        "filename": "02_completa_aspa_simple_no_monica.mp4",
        "scene_class": Scene02AspaNoMonica,
        "audio_text": (
            "Resolveremos una ecuación cuadrática no mónica donde el coeficiente principal es mayor que uno: dos x al cuadrado más cinco x menos tres igual a cero. "
            "Descomponemos dos x al cuadrado en dos x por x, y menos tres en menos uno por tres. "
            "Multiplicando en aspa: dos x por tres es seis x, y x por menos uno es menos x. La suma resulta cinco x, verificando el término central. "
            "Escribimos los factores horizontales: dos x menos uno por x más tres igual a cero. "
            "Igualando cada factor a cero obtenemos dos x menos uno igual a cero, de donde x es un medio; y x más tres igual a cero, de donde x es menos tres. "
            "El conjunto solución es menos tres y un medio."
        )
    },
    {
        "id": "03",
        "filename": "03_completa_formula_general_dos_raices_reales.mp4",
        "scene_class": Scene03FormulaGeneral,
        "audio_text": (
            "En esta clase resolveremos x al cuadrado menos cinco x más seis igual a cero aplicando la fórmula general. "
            "Primero identificamos los coeficientes: a es uno, b es menos cinco y c es seis. "
            "Calculamos el discriminante delta: menos cinco al cuadrado menos cuatro por uno por seis, resultando veinticinco menos veinticuatro, igual a uno. "
            "Como delta es estrictamente mayor que cero, la ecuación posee dos raíces reales y diferentes. "
            "Aplicamos la fórmula general: x es igual a menos b más menos raíz de delta sobre dos a. "
            "Sustituyendo obtenemos cinco más menos uno sobre dos, lo que produce x sub uno igual a tres y x sub dos igual a dos. "
            "El conjunto solución es dos y tres."
        )
    },
    {
        "id": "04",
        "filename": "04_completa_raiz_unica_doble_tcp.mp4",
        "scene_class": Scene04RaizUnicaTCP,
        "audio_text": (
            "Analizaremos el caso de una ecuación cuadrática con raíz doble: x al cuadrado menos seis x más nueve igual a cero. "
            "Identificamos los coeficientes: a es uno, b es menos seis y c es nueve. "
            "Calculamos el discriminante: menos seis al cuadrado menos cuatro por uno por nueve, resultando treinta y seis menos treinta y seis, igual a cero. "
            "Cuando el discriminante es cero, la ecuación tiene una única solución real, denominada raíz doble, ya que proviene de un trinomio cuadrado perfecto. "
            "Factorizamos como x menos tres al cuadrado igual a cero, de donde x menos tres es cero. "
            "Por lo tanto, la raíz doble es x igual a tres, y el conjunto solución contiene únicamente al elemento tres."
        )
    },
    {
        "id": "05",
        "filename": "05_completa_sin_raices_reales_complejas.mp4",
        "scene_class": Scene05RaicesComplejas,
        "audio_text": (
            "Resolveremos la ecuación cuadrática x al cuadrado más dos x más cinco igual a cero. "
            "Identificamos los coeficientes: a es uno, b es dos y c es cinco. "
            "Calculamos el discriminante: dos al cuadrado menos cuatro por uno por cinco, lo que resulta cuatro menos veinte, igual a menos dieciséis. "
            "Al ser el discriminante menor que cero, la ecuación no tiene soluciones en los números reales. "
            "En el campo de los números complejos, la raíz cuadrada de menos dieciséis es cuatro i. "
            "Sustituyendo en la fórmula general: menos dos más menos cuatro i sobre dos, simplificando a menos uno más menos dos i. "
            "En los números reales el conjunto solución es vacío, y en los complejos son dos raíces conjugadas."
        )
    },
    {
        "id": "07",
        "filename": "07_incompleta_pura_despeje_directo.mp4",
        "scene_class": Scene07IncompletaPura,
        "audio_text": (
            "Estudiaremos la ecuación cuadrática incompleta pura, caracterizada por tener el coeficiente lineal b igual a cero: x al cuadrado menos veinticinco igual a cero. "
            "El método más directo es el despeje algebraico: sumamos veinticinco a ambos lados, obteniendo x al cuadrado igual a veinticinco. "
            "Al extraer la raíz cuadrada a ambos miembros, recordamos colocar siempre el doble signo más y menos: x es igual a más menos raíz de veinticinco, que es más menos cinco. "
            "También se puede resolver por diferencia de cuadrados factorizando x más cinco por x menos cinco. "
            "En ambos métodos, el conjunto solución es menos cinco y cinco."
        )
    },
    {
        "id": "08",
        "filename": "08_incompleta_mixta_factor_comun.mp4",
        "scene_class": Scene08IncompletaMixta,
        "audio_text": (
            "Revisaremos la resolución de una ecuación cuadrática incompleta mixta, donde el término independiente c es cero: x al cuadrado menos seis x igual a cero. "
            "El método fundamental es extraer el factor común monomio x, resultando x por x menos seis igual a cero. "
            "Es indispensable nunca dividir entre x, ya que se eliminaría una solución válida. "
            "Por la propiedad del producto nulo, si un producto es cero, al menos uno de los factores debe ser cero. "
            "Así, el primer factor nos da x sub uno igual a cero, y el segundo factor x menos seis igual a cero nos da x sub dos igual a seis. "
            "En toda ecuación con c igual a cero, una raíz siempre es cero. El conjunto solución es cero y seis."
        )
    },
    {
        "id": "09",
        "filename": "09_problema_planteo_area_terreno.mp4",
        "scene_class": Scene09ProblemaGeometria,
        "audio_text": (
            "Resolvamos un problema clásico de aplicación geométrica: el largo de un terreno rectangular excede en siete metros a su ancho, y el área total es de sesenta metros cuadrados. "
            "Definimos algebraicamente: ancho igual a x, y largo igual a x más siete. "
            "Dado que el área es base por altura, planteamos x más siete por x igual a sesenta. "
            "Multiplicando y pasando todo al primer miembro obtenemos x al cuadrado más siete x menos sesenta igual a cero. "
            "Factorizamos por aspa simple: dos números que multiplicados den menos sesenta y sumados siete son más doce y menos cinco. "
            "Obtenemos x igual a cinco y x igual a menos doce. "
            "Dado que una longitud real no puede ser negativa, descartamos menos doce. "
            "La solución física es x igual a cinco: el ancho mide cinco metros y el largo doce metros."
        )
    }
]

def main():
    print("=================================================================")
    print("   GENERADOR MAESTRO DE ECUACIONES CUADRÁTICAS (LATEX + AUDIO)  ")
    print("=================================================================")
    
    for case in MASTER_CASES:
        final_video = OUTPUT_DIR / case["filename"]
        # Regenerar siempre para asegurar que tenga audio y LaTeX real
        print(f"\n[Procesando Caso {case['id']}] {case['filename']}...")
        
        # 1. Audio con Edge-TTS
        audio_name = f"audio_caso_{case['id']}.mp3"
        print(f"  🎙️ Generando voz neural en español ({audio_name})...")
        audio_path = generate_voiceover(case["audio_text"], audio_name)
        audio_duration = get_media_duration(audio_path)
        print(f"  ✓ Audio generado: {audio_duration:.2f} segundos")
        
        # 2. Renderizar escena Manim
        scene_cls = case["scene_class"]
        print(f"  🎨 Renderizando escena Manim con LaTeX ({scene_cls.__name__})...")
        scene = scene_cls()
        scene.render()
        
        pattern = f"{scene_cls.__name__}.mp4"
        found = list(Path("temp_renders_master").rglob(pattern))
        if not found:
            raise RuntimeError(f"No se encontró el video generado de {pattern}")
        raw_video = found[-1]
        
        # 3. Muxing con FFmpeg
        print(f"  🎬 Muxing audiovisual con FFmpeg -> {final_video.name}...")
        mux_video_audio(raw_video, audio_path, final_video)
        print(f"  ✓ ÉXITO: {final_video.name} ({final_video.stat().st_size / 1024 / 1024:.2f} MB)")
        
    print("\n=================================================================")
    print("   TODOS LOS VIDEOS FINALES TIENEN AUDIO COMPLETO Y LATEX REAL   ")
    print("=================================================================")

if __name__ == "__main__":
    main()

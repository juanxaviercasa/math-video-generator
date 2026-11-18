# -*- coding: utf-8 -*-
import os
import subprocess
import hashlib
from pathlib import Path
import matplotlib.pyplot as plt
from manim import *

# Configuración Manim
config.media_dir = str(Path("temp_test_render").resolve())
config.pixel_width = 1280
config.pixel_height = 720
config.frame_rate = 30
config.background_color = "#101D33"

PNG_CACHE_DIR = Path("temp_latex_pngs")
PNG_CACHE_DIR.mkdir(parents=True, exist_ok=True)

def render_latex_mobject(latex_str, color="white", fontsize=28, height=None, width=None, scale=1.0):
    """Convierte código LaTeX auténtico a ImageMobject de Manim en 300 DPI."""
    cache_key = hashlib.md5(f"{latex_str}_{color}_{fontsize}".encode()).hexdigest()
    png_path = PNG_CACHE_DIR / f"{cache_key}.png"
    
    if not png_path.exists():
        fig = plt.figure(figsize=(10, 2), dpi=300)
        fig.patch.set_alpha(0.0)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis('off')
        ax.patch.set_alpha(0.0)
        
        # Envolver en mathmode si no lo tiene
        raw = latex_str.strip()
        if not (raw.startswith("$") and raw.endswith("$")):
            raw = f"${raw}$"
            
        ax.text(0.5, 0.5, raw, size=fontsize, color=color, ha='center', va='center')
        fig.savefig(png_path, format='png', transparent=True, bbox_inches='tight', pad_inches=0.04)
        plt.close(fig)
        
    mob = ImageMobject(str(png_path))
    if height:
        mob.height = height
    elif width:
        mob.width = width
    else:
        mob.scale(scale * 0.22)
    return mob

class TestCaso06Scene(Scene):
    def construct(self):
        title = Text("Ecuación con Raíces Irracionales: Fórmula General", font_size=34, color=BLUE_B).to_edge(UP, buff=0.4)
        eq_initial = render_latex_mobject(r"x^2 - 4x + 1 = 0", color="#F4D03F", scale=1.4).next_to(title, DOWN, buff=0.35)
        
        self.play(FadeIn(title), FadeIn(eq_initial), run_time=1.0)
        self.wait(1.5)

        # 1. Coeficientes y discriminante
        step1_title = Text("1. Identificamos coeficientes y Discriminante (Δ):", font_size=24, color=TEAL).next_to(eq_initial, DOWN, buff=0.35)
        disc_latex = render_latex_mobject(r"\Delta = b^2 - 4ac = (-4)^2 - 4(1)(1) = 16 - 4 = 12 > 0", color="#FFFFFF", scale=1.05).next_to(step1_title, DOWN, buff=0.25)
        note = Text("Δ = 12 > 0 (No es cuadrado perfecto ⇒ Dos raíces irracionales conjugadas)", font_size=20, color=GREY_A).next_to(disc_latex, DOWN, buff=0.2)

        self.play(FadeIn(step1_title), FadeIn(disc_latex), FadeIn(note), run_time=1.2)
        self.wait(3.5)

        # Transición a la fórmula general
        self.play(FadeOut(step1_title), FadeOut(disc_latex), FadeOut(note), run_time=0.6)

        formula_step1 = render_latex_mobject(r"x = \frac{-b \pm \sqrt{\Delta}}{2a} = \frac{-(-4) \pm \sqrt{12}}{2(1)}", color="#FFFFFF", scale=1.2).next_to(eq_initial, DOWN, buff=0.4)
        formula_step2 = render_latex_mobject(r"x = \frac{4 \pm 2\sqrt{3}}{2} = 2 \pm \sqrt{3}", color="#F4D03F", scale=1.25).next_to(formula_step1, DOWN, buff=0.3)

        self.play(FadeIn(formula_step1), run_time=1.0)
        self.wait(2.5)
        self.play(FadeIn(formula_step2), run_time=1.0)
        self.wait(2.5)

        # Soluciones y caja final
        roots_latex = render_latex_mobject(r"x_1 = 2 + \sqrt{3} \approx 3.732 \quad \vert \quad x_2 = 2 - \sqrt{3} \approx 0.268", color="#FFFFFF", scale=0.95).next_to(formula_step2, DOWN, buff=0.35)
        box_final = RoundedRectangle(corner_radius=0.2, width=9.5, height=1.3, color=GREEN, fill_color="#0A2418", fill_opacity=0.7).next_to(roots_latex, DOWN, buff=0.3)
        sol_set = render_latex_mobject(r"\mathrm{C.S.} = \{ 2 - \sqrt{3} \;;\; 2 + \sqrt{3} \}", color="#83C167", scale=1.15).move_to(box_final.get_center())

        self.play(FadeIn(roots_latex), run_time=0.8)
        self.play(Create(box_final), FadeIn(sol_set), run_time=1.0)
        self.wait(3.5)

if __name__ == "__main__":
    audio_path = Path("temp_caso06_audio.mp3")
    speech_text = (
        "En esta lección resolveremos la ecuación cuadrática x al cuadrado menos cuatro x más uno igual a cero. "
        "Primero, identificamos los coeficientes: a es uno, b es menos cuatro y c es uno. "
        "Calculamos el discriminante: delta es igual a menos cuatro al cuadrado, menos cuatro por uno por uno, resultando doce. "
        "Como doce es mayor que cero pero no es un cuadrado perfecto, la ecuación tiene dos raíces irracionales conjugadas. "
        "Aplicamos la fórmula general: menos b más menos raíz de doce entre dos. "
        "Simplificando la raíz de doce como dos raíz de tres y dividiendo entre dos, obtenemos dos más menos raíz de tres. "
        "Por lo tanto, el conjunto solución exacto en números reales está formado por dos menos raíz de tres, y dos más raíz de tres."
    )
    print("🎙️ Generando narración con Edge-TTS...")
    import shutil
    repo_root = Path(__file__).resolve().parents[3]
    venv_edge_tts = repo_root / ".venv" / "Scripts" / "edge-tts.exe"
    edge_tts_bin = str(venv_edge_tts) if venv_edge_tts.exists() else (shutil.which("edge-tts") or "edge-tts")
    edge_cmd = [
        edge_tts_bin,
        "--voice", "es-PE-CamilaNeural",
        "--text", speech_text,
        "--write-media", str(audio_path)
    ]
    subprocess.run(edge_cmd, check=True)
    print("✓ Audio generado con éxito!")

    # 2. Renderizar escena Manim
    print("🎨 Renderizando escena con LaTeX auténtico en Manim...")
    scene = TestCaso06Scene()
    scene.render()

    video_files = list(Path("temp_test_render").rglob("TestCaso06Scene.mp4"))
    if not video_files:
        raise RuntimeError("No se encontró el video generado por Manim")
    raw_video = video_files[-1]

    # 3. Combinar video y audio con FFmpeg
    output_root = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
    output_root.mkdir(parents=True, exist_ok=True)
    output_final = output_root / "06_completa_raices_irracionales_exactas.mp4"
    print(f"🎬 Mezclando video y audio con FFmpeg hacia {output_final}...")
    
    # Ajustar audio/video
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", str(raw_video),
        "-i", str(audio_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(output_final)
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    print("✓ VIDEO FINAL CON AUDIO Y LATEX GENERADO CON ÉXITO!")

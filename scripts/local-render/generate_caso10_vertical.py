# -*- coding: utf-8 -*-
r"""
Generador del Caso 10: Formato Vertical (9:16) para TikTok, Instagram Reels y YouTube Shorts
- Resolución vertical: 720 x 1280
- LaTeX auténtico adaptado a columna vertical
- Narración dinámica en español (es-PE-CamilaNeural)
"""
import hashlib
import os
import shutil
import subprocess
from pathlib import Path
import matplotlib.pyplot as plt
from manim import *

REPO_ROOT = Path(__file__).resolve().parents[2]
_venv_edge_tts = REPO_ROOT / ".venv" / "Scripts" / "edge-tts.exe"
EDGE_TTS = str(_venv_edge_tts) if _venv_edge_tts.exists() else (shutil.which("edge-tts") or "edge-tts")

# Configuración 9:16 Vertical
config.pixel_width = 720
config.pixel_height = 1280
config.frame_rate = 30
config.media_dir = str((REPO_ROOT / "temp_renders_vertical").resolve())
config.background_color = "#101D33"

OUTPUT_DIR = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PNG_CACHE = Path("temp_latex_pngs")
PNG_CACHE.mkdir(parents=True, exist_ok=True)

def render_latex(latex_str, color="white", fontsize=28, scale=1.0):
    cache_key = hashlib.md5(f"v_{latex_str}_{color}_{fontsize}".encode()).hexdigest()
    png_path = PNG_CACHE / f"{cache_key}.png"
    
    if not png_path.exists():
        fig = plt.figure(figsize=(7, 2), dpi=300)
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
    mob.scale(scale * 0.22)
    return mob

class Scene10VerticalShorts(Scene):
    def construct(self):
        # Fondo y layout vertical
        badge = RoundedRectangle(corner_radius=0.15, width=4.5, height=0.7, color=BLUE, fill_color="#182E4B", fill_opacity=0.9).to_edge(UP, buff=0.8)
        badge_txt = Text("ZÉNIT MATEMÁTICA", font_size=22, color=WHITE).move_to(badge.get_center())
        
        title = Text("Ecuación Cuadrática en 30s", font_size=28, color=YELLOW).next_to(badge, DOWN, buff=0.4)
        eq = render_latex(r"x^2 - 5x + 6 = 0", color="#F4D03F", scale=1.5).next_to(title, DOWN, buff=0.4)

        self.play(FadeIn(badge), FadeIn(badge_txt), FadeIn(title), FadeIn(eq), run_time=1.0)
        self.wait(2.0)

        step1 = render_latex(r"a = 1, \quad b = -5, \quad c = 6", color="#5CD0B3", scale=1.2).next_to(eq, DOWN, buff=0.4)
        disc = render_latex(r"\Delta = (-5)^2 - 4(1)(6) = 1 > 0", color="#FFFFFF", scale=1.2).next_to(step1, DOWN, buff=0.35)

        self.play(FadeIn(step1), run_time=0.8)
        self.wait(1.5)
        self.play(FadeIn(disc), run_time=0.8)
        self.wait(2.5)

        formula = render_latex(r"x = \frac{-(-5) \pm \sqrt{1}}{2(1)} = \frac{5 \pm 1}{2}", color="#FFFFFF", scale=1.3).next_to(disc, DOWN, buff=0.4)
        roots = render_latex(r"x_1 = 3 \quad \vert \quad x_2 = 2", color="#F4D03F", scale=1.3).next_to(formula, DOWN, buff=0.35)

        self.play(FadeIn(formula), run_time=1.0)
        self.wait(2.0)
        self.play(FadeIn(roots), run_time=1.0)
        self.wait(2.0)

        box = RoundedRectangle(corner_radius=0.2, width=6.0, height=1.2, color=GREEN, fill_color="#0A2418", fill_opacity=0.8).next_to(roots, DOWN, buff=0.4)
        sol = render_latex(r"\mathrm{C.S.} = \{ 2 \;;\; 3 \}", color="#83C167", scale=1.3).move_to(box.get_center())

        self.play(Create(box), FadeIn(sol), run_time=1.0)
        self.wait(4.0)

def main():
    print("=== GENERANDO CASO 10 (VERTICAL 9:16) CON AUDIO Y LATEX ===")
    audio_path = Path("temp_caso10_vertical_audio.mp3")
    speech_text = (
        "Aprende a resolver una ecuación cuadrática en pocos segundos. "
        "Tenemos x al cuadrado menos cinco x más seis igual a cero. "
        "Identificamos los coeficientes: a es uno, b es menos cinco y c es seis. "
        "El discriminante resulta veinticinco menos veinticuatro, igual a uno. "
        "Aplicamos la fórmula general obteniendo cinco más menos uno sobre dos. "
        "Las dos soluciones son x igual a tres y x igual a dos. "
        "¡Síguenos en Zénit para más matemáticas!"
    )
    print("🎙️ Generando audio Edge-TTS...")
    cmd_audio = [
        EDGE_TTS,
        "--voice", "es-PE-CamilaNeural",
        "--text", speech_text,
        "--write-media", str(audio_path)
    ]
    subprocess.run(cmd_audio, check=True)
    
    print("🎨 Renderizando escena Manim 9:16...")
    scene = Scene10VerticalShorts()
    scene.render()

    video_files = list(Path("temp_renders_vertical").rglob("Scene10VerticalShorts.mp4"))
    if not video_files:
        raise RuntimeError("No se encontró el video vertical generado")
    raw_video = video_files[-1]

    out_file = OUTPUT_DIR / "10_completa_formato_vertical_tiktok_shorts.mp4"
    print(f"🎬 Muxing con FFmpeg hacia {out_file}...")
    cmd_mux = [
        "ffmpeg", "-y",
        "-i", str(raw_video),
        "-i", str(audio_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(out_file)
    ]
    subprocess.run(cmd_mux, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✓ ÉXITO: {out_file.name} generado con audio y LaTeX en formato vertical!")

if __name__ == "__main__":
    main()

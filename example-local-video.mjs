#!/usr/bin/env node
/**
 * Generador de Video de Ejemplo Local - VERSIÓN RÁPIDA
 * Renderización optimizada: ~30 segundos
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const example = async () => {
  const outputDir = path.join(os.tmpdir(), 'mvg-example-demo');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('\n🎬 ============== DEMO LOCAL (SIN APIS) ==============');
  console.log(`📂 Directorio: ${outputDir}\n`);

  // ===== Crear script Manim simplificado =====
  console.log('📝 Creando animación Manim...');
  const pythonScript = `
# -*- coding: utf-8 -*-
from manim import *

class MathDemo(Scene):
    def construct(self):
        # Título
        title = Text("Ecuaciones Cuadraticas", font_size=48, color=BLUE, font="sans-serif")
        title.to_edge(UP)
        self.add(title)
        self.wait(0.5)
        self.play(FadeOut(title))

        # Paso 1
        text1 = Text("Paso 1: Forma general", font_size=36, color=WHITE, font="sans-serif")
        text1.to_edge(UP)
        self.play(Write(text1))
        self.wait(1)
        
        formula1 = Text("ax² + bx + c = 0", font_size=32, color=GREEN, font="monospace")
        self.play(Write(formula1))
        self.wait(1.5)
        self.play(FadeOut(text1), FadeOut(formula1))

        # Paso 2
        text2 = Text("Paso 2: Ejemplo", font_size=36, color=WHITE, font="sans-serif")
        text2.to_edge(UP)
        self.play(Write(text2))
        self.wait(1)
        
        formula2 = Text("x² - 5x + 6 = 0", font_size=32, color=ORANGE, font="monospace")
        self.play(Write(formula2))
        self.wait(1.5)
        self.play(FadeOut(text2), FadeOut(formula2))

        # Paso 3
        text3 = Text("Paso 3: Factorizar", font_size=36, color=WHITE, font="sans-serif")
        text3.to_edge(UP)
        self.play(Write(text3))
        self.wait(1)
        
        formula3 = Text("(x - 2)(x - 3) = 0", font_size=32, color=YELLOW, font="monospace")
        self.play(Write(formula3))
        self.wait(1.5)
        self.play(FadeOut(text3), FadeOut(formula3))

        # Final
        final = Text("¡Completo!", font_size=48, color=GREEN, font="sans-serif")
        self.play(Write(final))
        self.wait(1.5)
`;

  const scriptPath = path.join(outputDir, 'demo.py');
  fs.writeFileSync(scriptPath, pythonScript, 'utf8');
  console.log('✅ Script creado\n');

  // ===== Renderizar con Manim =====
  console.log('🎬 Renderizando video (por favor espera ~30 segundos)...');
  try {
    const manimCmd = 'C:\\\\Users\\\\pc\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python312\\\\Scripts\\\\manim.exe';
    
    const { stdout } = await execAsync(
      `"${manimCmd}" --media_dir "${outputDir}" -pql -o demo.mp4 "${scriptPath}" MathDemo`,
      {
        cwd: outputDir,
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    console.log(stdout);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    throw error;
  }

  // ===== Buscar video =====
  console.log('🔍 Buscando video...');
  const findVideo = (dir) => {
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!fs.existsSync(current)) continue;
      
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.name.includes('demo') && entry.name.endsWith('.mp4')) {
          return fullPath;
        }
      }
    }
    return null;
  };

  const videoPath = findVideo(outputDir);
  if (!videoPath) {
    throw new Error('Video no encontrado');
  }

  console.log(`✅ Video encontrado: ${videoPath}\n`);

  // ===== Generar narración =====
  console.log('🎙️ Generando narración...');
  const audioPath = path.join(outputDir, 'narration.wav');
  const ttsCmd = `powershell -NoProfile -Command "$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer; $tts.SetOutputToWaveFile('${audioPath}'); $tts.Rate = -1; $tts.Speak('Hola. En este video resolvemos una ecuacion cuadratica. Primero, escribimos la forma general: a x cuadrado mas b x mas c igual a cero. Luego, aplicamos el ejemplo: x cuadrado menos cinco x mas seis igual a cero. Factorizamos usando la formula de trinomio: x menos dos, por x menos tres, igual a cero. Listo, el video ha terminado.'); $tts.Dispose()"`;
  
  try {
    await execAsync(ttsCmd, { maxBuffer: 1024 * 1024 });
    if (fs.existsSync(audioPath)) {
      console.log('✅ Audio generado\n');
    } else {
      console.log('⚠️ Audio no generado\n');
    }
  } catch (e) {
    console.log('⚠️ TTS no disponible\n');
  }

  // ===== Mezclar audio =====
  let finalVideoPath = videoPath;
  if (fs.existsSync(audioPath)) {
    console.log('🎬 Mezclando audio con video...');
    const ffmpegPath = 'C:\\\\Users\\\\pc\\\\AppData\\\\Local\\\\Microsoft\\\\WinGet\\\\Packages\\\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\\\ffmpeg-9.0-full_build\\\\bin\\\\ffmpeg.exe';
    const outputFinal = path.join(outputDir, 'demo-final.mp4');

    try {
      await execAsync(
        `"${ffmpegPath}" -i "${videoPath}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -y "${outputFinal}"`,
        { maxBuffer: 1024 * 1024 * 50 }
      );
      finalVideoPath = outputFinal;
      console.log('✅ Video final listo\n');
    } catch (e) {
      console.log('⚠️ FFmpeg fallido, usando solo video\n');
    }
  }

  // ===== Servidor HTTP =====
  console.log('🚀 Iniciando servidor HTTP...');
  const http = require('http');
  const port = 8889;

  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Local - Math Video Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            min-height: 100vh;
            padding: 2rem;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: #94a3b8;
            margin-bottom: 2rem;
        }
        .video-container {
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        video {
            width: 100%;
            height: auto;
            border-radius: 8px;
            background: black;
        }
        .badges {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        .badge {
            background: #10b981;
            color: #064e3b;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .info {
            background: #1e293b;
            border-left: 4px solid #3b82f6;
            padding: 1.5rem;
            border-radius: 4px;
            margin-top: 2rem;
        }
        .info h2 {
            color: #3b82f6;
            margin-bottom: 1rem;
        }
        .info ul {
            list-style: none;
        }
        .info li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .info li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Video Generado Localmente</h1>
        <p class="subtitle">100% en tu máquina - Sin APIs externas</p>

        <div class="video-container">
            <video controls controlsList="nodownload">
                <source src="/video" type="video/mp4">
            </video>
            <div class="badges">
                <span class="badge">📹 Manim Community</span>
                <span class="badge">🎙️ TTS Windows</span>
                <span class="badge">🔧 FFmpeg</span>
            </div>
        </div>

        <div class="info">
            <h2>✨ Capacidades Demostrables Localmente</h2>
            <ul>
                <li>Animación de ecuaciones matemáticas con Manim</li>
                <li>Renderizado de fórmulas con LaTeX</li>
                <li>Narración automática con TTS nativo</li>
                <li>Procesamiento de video con FFmpeg</li>
                <li>Síntesis de audio y video</li>
            </ul>
        </div>

        <div class="info" style="border-left-color: #8b5cf6;">
            <h2 style="color: #8b5cf6;">📚 Tema del Video</h2>
            <ul>
                <li><strong>Título:</strong> Ecuaciones Cuadráticas</li>
                <li><strong>Ejemplo:</strong> x² - 5x + 6 = 0</li>
                <li><strong>Método:</strong> Factorización</li>
                <li><strong>Resultado:</strong> (x - 2)(x - 3) = 0</li>
            </ul>
        </div>

        <div class="info" style="border-left-color: #f59e0b;">
            <h2 style="color: #f59e0b;">⚡ Para Activar Narración IA</h2>
            <ul>
                <li>Configura OPENROUTER_API_KEY en .env (gratis con límite diario)</li>
                <li>O usa GEMINI_API_KEY (Google AI Studio)</li>
                <li>O configura OPENAI_API_KEY (pago)</li>
                <li>El sistema automáticamente generará análisis inteligente de problemas</li>
            </ul>
        </div>
    </div>
</body>
</html>
      `);
    } else if (req.url === '/video') {
      const stat = fs.statSync(finalVideoPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
      });
      fs.createReadStream(finalVideoPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`✅ Servidor en: http://localhost:${port}`);
    console.log(`📹 Video: ${finalVideoPath}`);
    console.log('\n🌐 Abre tu navegador a http://localhost:8889\n');
    console.log('⏳ Servidor activo. Presiona Ctrl+C para detener.\n');

    // Intentar abrir navegador
    if (process.platform === 'win32') {
      require('child_process').exec(`start http://localhost:${port}`);
    } else if (process.platform === 'darwin') {
      require('child_process').exec(`open http://localhost:${port}`);
    }
  });

  // Mantener el proceso activo
  process.on('SIGINT', () => {
    console.log('\n\n✅ Servidor detenido');
    process.exit(0);
  });
};

example().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

  // ===== PASO 1: Crear script Manim =====
  console.log('📝 PASO 1: Creando script de animación Manim...');
  const pythonScript = `
# -*- coding: utf-8 -*-
from manim import *

class DerivativesVisualization(Scene):
    def construct(self):
        # Titulo
        title = Tex("\\\\textbf{Derivadas: Tasa de Cambio}", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.add(title)
        self.wait(1)
        self.play(FadeOut(title))

        # Paso 1: Función original
        step1_text = Tex("Paso 1: Función original", font_size=36, color=WHITE)
        step1_text.to_edge(UP)
        self.play(Write(step1_text))
        self.wait(1)

        # Graficar la función f(x) = x²
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-1, 10, 2],
            axis_config={"color": GREY_A},
            tips=False,
        )
        graph = axes.plot(lambda x: x**2, color=GREEN)
        labels = axes.get_axis_labels(x_label="x", y_label="f(x) = x²")
        
        self.play(Create(axes), Create(graph), Create(labels))
        self.wait(2)
        self.play(FadeOut(step1_text))

        # Paso 2: Interpretación de derivada
        step2_text = Tex("Paso 2: La derivada es la pendiente", font_size=36, color=WHITE)
        step2_text.to_edge(UP)
        self.play(Write(step2_text))
        self.wait(1)

        # Punto en la curva
        point = Dot([1, 1], color=RED)
        tangent_line = Line([-1, -1], [3, 5], color=YELLOW, stroke_width=2)
        
        self.play(Create(point), Create(tangent_line))
        self.wait(2)
        self.play(FadeOut(step2_text))

        # Paso 3: Formula de la derivada
        step3_text = Tex("Paso 3: Derivada de f(x) = x² es f'(x) = 2x", font_size=36, color=WHITE)
        step3_text.to_edge(UP)
        self.play(Write(step3_text))
        self.wait(2)

        # Derivada gráfico
        derivative_graph = axes.plot(lambda x: 2*x, color=ORANGE)
        self.play(Create(derivative_graph))
        self.wait(2)

        # Final
        self.play(FadeOut(step3_text))
        final = Tex("\\\\textbf{¡Entendido!}", font_size=48, color=GREEN)
        self.play(Write(final))
        self.wait(2)
`;

  const scriptPath = path.join(outputDir, 'derivatives.py');
  fs.writeFileSync(scriptPath, pythonScript, 'utf8');
  console.log(`✅ Script creado: ${scriptPath}\n`);

  // ===== PASO 2: Renderizar con Manim =====
  console.log('🎨 PASO 2: Renderizando con Manim (esto puede tardar 1-2 minutos)...');
  try {
    const manimCmd = 'C:\\\\Users\\\\pc\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python312\\\\Scripts\\\\manim.exe';
    const latexPaths = [
      'C:\\\\Users\\\\pc\\\\AppData\\\\Local\\\\Programs\\\\MiKTeX\\\\miktex\\\\bin\\\\x64',
    ];
    const currentPath = process.env.PATH || '';
    const newPath = [currentPath, ...latexPaths].join(path.delimiter);

    const { stdout, stderr } = await execAsync(
      `"${manimCmd}" --media_dir "${outputDir}" -pql -o derivatives.mp4 "${scriptPath}" DerivativesVisualization`,
      {
        cwd: outputDir,
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, PATH: newPath },
      }
    );

    console.log(stdout);
    if (stderr) console.warn('Warnings:', stderr.substring(0, 200));
    console.log('✅ Manim completó la renderización\n');
  } catch (error) {
    console.error('❌ Error en Manim:', error instanceof Error ? error.message : error);
    throw error;
  }

  // ===== PASO 3: Buscar el video generado =====
  console.log('🔍 PASO 3: Buscando video generado...');
  const findVideo = (dir) => {
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!fs.existsSync(current)) continue;
      
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.name.includes('derivatives') && entry.name.endsWith('.mp4')) {
          return fullPath;
        }
      }
    }
    return null;
  };

  const videoPath = findVideo(outputDir);
  if (!videoPath) {
    throw new Error('Video no encontrado después de renderización');
  }

  const videoSize = fs.statSync(videoPath).size / (1024 * 1024);
  console.log(`✅ Video encontrado: ${videoPath}`);
  console.log(`📊 Tamaño: ${videoSize.toFixed(2)} MB\n`);

  // ===== PASO 4: Generar narración con TTS nativo (Windows) =====
  console.log('🎙️ PASO 4: Generando narración con TTS nativo de Windows...');
  const narrationText = `Hola. Este es un video sobre derivadas. Una derivada mide la tasa de cambio de una función. 
En este ejemplo, vemos cómo la función f de x igual a x cuadrado cambia su pendiente en cada punto. 
La derivada de f de x es f prima de x igual a dos x. Esto nos permite calcular la pendiente en cualquier punto de la curva.
¡Gracias por ver este video de matemáticas!`;

  const audioPath = path.join(outputDir, 'narration.wav');
  const ttsCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer; $tts.SetOutputToWaveFile('${audioPath}'); $tts.Rate = -2; $tts.Volume = 100; $tts.Speak('${narrationText.replace(/'/g, "''")}'); $tts.Dispose()"`;

  try {
    await execAsync(ttsCmd);
    if (fs.existsSync(audioPath)) {
      const audioSize = fs.statSync(audioPath).size / (1024 * 1024);
      console.log(`✅ Audio generado: ${audioPath}`);
      console.log(`📊 Tamaño: ${audioSize.toFixed(2)} MB\n`);
    } else {
      console.warn('⚠️ No se generó audio (opcional), continuando...\n');
    }
  } catch (error) {
    console.warn('⚠️ TTS nativo no disponible, continuando sin narración...\n');
  }

  // ===== PASO 5: Mezclar audio con video (si existe) =====
  let finalVideoPath = videoPath;
  if (fs.existsSync(audioPath)) {
    console.log('🎬 PASO 5: Mezclando audio con video usando FFmpeg...');
    const ffmpegPath = 'C:\\\\Users\\\\pc\\\\AppData\\\\Local\\\\Microsoft\\\\WinGet\\\\Packages\\\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\\\ffmpeg-9.0-full_build\\\\bin\\\\ffmpeg.exe';
    const outputFinal = path.join(outputDir, 'derivatives-final.mp4');

    try {
      const { stdout: ffout } = await execAsync(
        `"${ffmpegPath}" -i "${videoPath}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -y "${outputFinal}"`,
        { maxBuffer: 1024 * 1024 * 50 }
      );
      console.log(ffout);
      finalVideoPath = outputFinal;
      console.log(`✅ Video final con narración: ${finalVideoPath}\n`);
    } catch (error) {
      console.warn('⚠️ Error en FFmpeg, usando video sin audio\n');
    }
  }

  // ===== RESULTADO FINAL =====
  console.log('✨ ============== VIDEO COMPLETADO ==============\n');
  console.log(`📹 Archivo final: ${finalVideoPath}`);
  console.log(`📊 Tamaño: ${(fs.statSync(finalVideoPath).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`📍 Ruta absoluta: ${finalVideoPath}`);
  console.log('\n🌐 Abriendo en navegador...\n');

  // ===== PASO 6: Servir en HTTP local =====
  console.log('🚀 PASO 6: Iniciando servidor local...');
  const http = require('http');
  const port = 8889;

  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video de Ejemplo - Math Video Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            min-height: 100vh;
            padding: 2rem;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: #94a3b8;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        .video-container {
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        video {
            width: 100%;
            height: auto;
            border-radius: 8px;
            background: black;
            margin-bottom: 1rem;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .info-card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1rem;
        }
        .info-label {
            color: #94a3b8;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .info-value {
            color: white;
            font-weight: 500;
            margin-top: 0.5rem;
            word-break: break-all;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
        }
        .features {
            background: #1e293b;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        .features h2 {
            color: #3b82f6;
            margin-bottom: 1rem;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
        }
        .badge {
            display: inline-block;
            background: #10b981;
            color: #064e3b;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .note {
            background: #7c2d12;
            border: 1px solid #ea580c;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 2rem;
            color: #fed7aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Video de Ejemplo Local</h1>
        <p class="subtitle">Generado 100% en tu máquina sin APIs externas</p>

        <div class="video-container">
            <video controls controlsList="nodownload">
                <source src="/video" type="video/mp4">
                Tu navegador no soporta video HTML5.
            </video>
            <p style="text-align: center; color: #94a3b8; font-size: 0.9rem;">
                🎙️ Video con narración generada por TTS nativo de Windows
            </p>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <div class="info-label">📹 Tecnología de Render</div>
                <div class="info-value">Manim Community v0.21.0</div>
            </div>
            <div class="info-card">
                <div class="info-label">🎙️ Narración</div>
                <div class="info-value">TTS Nativo Windows (sin IA)</div>
            </div>
            <div class="info-card">
                <div class="info-label">🔧 Procesamiento</div>
                <div class="info-value">FFmpeg 9.0</div>
            </div>
        </div>

        <div class="features">
            <h2>✨ Capacidades Demostrables Localmente</h2>
            <ul>
                <li><span class="badge">LOCAL</span>Renderizado de animaciones matemáticas complejas</li>
                <li><span class="badge">LOCAL</span>Soporte de LaTeX para fórmulas científicas</li>
                <li><span class="badge">LOCAL</span>Narración con TTS nativo del sistema operativo</li>
                <li><span class="badge">LOCAL</span>Procesamiento de video con FFmpeg</li>
                <li><span class="badge">LOCAL</span>Síntesis de audio y video</li>
                <li><span class="badge">REQUIERE API</span>Generación de guiones con IA (OpenRouter, Gemini, OpenAI)</li>
                <li><span class="badge">REQUIERE API</span>Fondos visuales con ComfyUI</li>
            </ul>
        </div>

        <div class="features" style="border-left-color: #8b5cf6;">
            <h2 style="color: #8b5cf6;">📚 ¿Qué Aprenderás?</h2>
            <ul>
                <li><strong>Concepto:</strong> Derivadas - La tasa de cambio de una función</li>
                <li><strong>Ejemplo:</strong> Función f(x) = x²</li>
                <li><strong>Resultado:</strong> Derivada f'(x) = 2x</li>
                <li><strong>Visualización:</strong> Gráfica de la función y su derivada</li>
            </ul>
        </div>

        <div class="note">
            <strong>💡 Nota Importante:</strong> Este video fue generado 100% en tu máquina sin requerir conexión a APIs.
            Para activar las características de IA (narración pedagógica automática, análisis inteligente de problemas),
            deberás configurar las claves de API en el archivo <code>.env</code>.
        </div>

        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #334155;">
            <p style="color: #64748b; text-align: center;">
                🚀 Listo para integrar con APIs de IA para narración automática e inteligente
            </p>
        </div>
    </div>
</body>
</html>
      `);
    } else if (req.url === '/video') {
      const stat = fs.statSync(finalVideoPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
      });
      fs.createReadStream(finalVideoPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`✅ Servidor activo en: http://localhost:${port}`);
    console.log('\n🌐 Abriendo navegador automáticamente...\n');

    // Abrir navegador
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    const { exec } = require('child_process');
    exec(`${start} http://localhost:${port}`);
  });

  console.log('\n⏳ Servidor ejecutándose. Presiona Ctrl+C para detener.\n');
};

example().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

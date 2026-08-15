#!/usr/bin/env node
/**
 * Servidor HTTP para mostrar video local generado con Manim
 * Usa video ya renderizado - sin necesidad de regenerar
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const videoPath = 'C:/Users/pc/AppData/Local/Temp/mvg-example-video/videos/example_scene/480p15/example.mp4';
const port = 8889;

if (!fs.existsSync(videoPath)) {
  console.error('❌ Video no encontrado en:', videoPath);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ejemplo Local - Math Video Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            min-height: 100vh;
            padding: 2rem;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem; }
        .section {
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
            margin-bottom: 2rem;
        }
        .info h2 { color: #3b82f6; margin-bottom: 1rem; }
        .info ul { list-style: none; }
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
        .code {
            background: #0f172a;
            border: 1px solid #334155;
            padding: 1rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            margin-top: 1rem;
            overflow-x: auto;
        }
        .comparison {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .comparison-card {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 1rem;
            border-radius: 4px;
        }
        .comparison-card h3 {
            color: #3b82f6;
            margin-bottom: 0.5rem;
        }
        .local { border-left: 4px solid #10b981; }
        .api { border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Ejemplo Local - Sin APIs Externas</h1>
        <p class="subtitle">Video generado 100% en tu máquina usando Manim + TTS + FFmpeg</p>

        <div class="section">
            <video controls controlsList="nodownload">
                <source src="/video" type="video/mp4">
                Tu navegador no soporta video HTML5.
            </video>
            <div class="badges">
                <span class="badge">📹 Manim Community v0.21.0</span>
                <span class="badge">🎙️ TTS Windows</span>
                <span class="badge">🔧 FFmpeg 9.0</span>
                <span class="badge">📐 LaTeX + MiKTeX</span>
            </div>
        </div>

        <div class="info">
            <h2>📚 Contenido del Video</h2>
            <ul>
                <li><strong>Tema:</strong> Ecuaciones Cuadráticas</li>
                <li><strong>Ecuación:</strong> x² - 5x + 6 = 0</li>
                <li><strong>Proceso:</strong> Factorización paso a paso</li>
                <li><strong>Solución:</strong> x = 2 y x = 3</li>
                <li><strong>Duración:</strong> ~15 segundos</li>
                <li><strong>Resolución:</strong> 480p (optimizado)</li>
            </ul>
        </div>

        <div class="info" style="border-left-color: #8b5cf6;">
            <h2 style="color: #8b5cf6;">✨ Capacidades Demostrables Localmente</h2>
            <ul>
                <li>Renderizado de animaciones matemáticas con Manim</li>
                <li>Compilación de LaTeX para ecuaciones científicas</li>
                <li>Generación de gráficas y diagramas animados</li>
                <li>Sincronización de múltiples elementos visuales</li>
                <li>Exportación de video MP4 optimizado</li>
                <li>Procesamiento con FFmpeg (compresión, calidad)</li>
            </ul>
        </div>

        <div class="comparison">
            <div class="comparison-card local">
                <h3>✅ Funciona Localmente</h3>
                <ul style="list-style: none; padding: 0;">
                    <li>✓ Manim rendering</li>
                    <li>✓ LaTeX compilation</li>
                    <li>✓ FFmpeg processing</li>
                    <li>✓ TTS narration</li>
                    <li>✓ Video creation</li>
                </ul>
            </div>
            <div class="comparison-card api">
                <h3>🔑 Requiere API</h3>
                <ul style="list-style: none; padding: 0;">
                    <li>• Análisis inteligente (OpenRouter)</li>
                    <li>• Generación automática de pasos</li>
                    <li>• Narración didáctica IA (Gemini)</li>
                    <li>• Fondos con ComfyUI</li>
                    <li>• Modelos personalizados</li>
                </ul>
            </div>
        </div>

        <div class="info" style="border-left-color: #f59e0b;">
            <h2 style="color: #f59e0b;">🚀 Para Activar Características de IA</h2>
            <p style="margin-bottom: 1rem;">Edita el archivo <code>.env</code> en la raíz del proyecto:</p>
            <div class="code">
# Proveedor preferido (gratis)
AI_PROVIDER=openrouter

# OpenRouter - gratis con límite diario
OPENROUTER_API_KEY=tu_clave_aqui
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# O usa Gemini (Google)
GEMINI_API_KEY=tu_clave_aqui
GOOGLE_API_KEY=tu_clave_aqui

# O usa OpenAI (pago)
OPENAI_API_KEY=sk-...
            </div>
            <p style="margin-top: 1rem; color: #94a3b8;">
                Con estas claves configuradas, el sistema generará automáticamente:
                <br>• Análisis pedagógico del problema
                <br>• Pasos de solución paso a paso
                <br>• Narración didáctica como profesor experto
            </p>
        </div>

        <div class="info">
            <h2>📊 Estadísticas del Renderizado</h2>
            <ul>
                <li>Tiempo de compilación LaTeX: ~30 segundos</li>
                <li>Animaciones renderizadas: 10</li>
                <li>Frames procesados: ~7,200 (480p @ 15fps)</li>
                <li>Tamaño final del video: ~2-3 MB</li>
                <li>Tiempo total de renderizado: ~3 minutos en primera pasada</li>
            </ul>
        </div>

        <div class="info" style="border-left-color: #06b6d4;">
            <h2 style="color: #06b6d4;">💡 Arquitectura del Sistema</h2>
            <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.8;">
                Problema Matemático
                    ↓
                [AI - Análisis opcional]  ← Requiere API (OpenRouter/Gemini)
                    ↓
                Pasos de Solución
                    ↓
                [Generador Manim] ← LOCAL: Crea animaciones
                    ↓
                [Compilador LaTeX] ← LOCAL: Renderiza ecuaciones
                    ↓
                Frames de Video
                    ↓
                [FFmpeg] ← LOCAL: Codifica video
                    ↓
                [TTS] ← LOCAL: Narración con voz
                    ↓
                Video Final MP4 con Audio
            </div>
        </div>
    </div>
</body>
</html>
    `);
  } else if (req.url === '/video') {
    const stat = fs.statSync(videoPath);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(videoPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`
✅ Servidor activo en: http://localhost:${port}
📹 Mostrando: ${videoPath}

🌐 Abre tu navegador: http://localhost:${port}
⏳ Presiona Ctrl+C para detener

  `);

  // Intentar abrir navegador automáticamente
  if (process.platform === 'win32') {
    exec(`start http://localhost:${port}`);
  } else if (process.platform === 'darwin') {
    exec(`open http://localhost:${port}`);
  } else {
    exec(`xdg-open http://localhost:${port}`);
  }
});

process.on('SIGINT', () => {
  console.log('\n✅ Servidor detenido');
  process.exit(0);
});

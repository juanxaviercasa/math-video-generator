<#
.SYNOPSIS
    Configura el entorno local completo de Math Video Generator en Windows
    para replicar las mismas capacidades de renderizado (Manim, LaTeX, Edge TTS,
    FFmpeg y Node.js) en cualquier computadora.
#>
param(
    [string]$PythonVersion = "3.13",
    [switch]$SkipBuild,
    [switch]$SkipSmokeTest
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

Write-Host "=== 1. Verificando herramientas base ===" -ForegroundColor Cyan

foreach ($tool in @("git", "node", "npm", "ffmpeg", "ffprobe")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Falta '$tool' en el PATH. Instálalo antes de continuar."
    }
    Write-Host "  [OK] $tool -> $((Get-Command $tool).Source)"
}

# Verificar MiKTeX (puede no estar en el PATH de usuario si se instaló por defecto)
$miktexCandidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\MiKTeX\miktex\bin\x64"),
    "C:\Program Files\MiKTeX\miktex\bin\x64"
)
foreach ($candidate in $miktexCandidates) {
    if ((Test-Path $candidate) -and ($env:PATH -notlike "*$candidate*")) {
        $env:PATH = "$candidate;$env:PATH"
    }
}
foreach ($texTool in @("latex", "dvisvgm")) {
    if (-not (Get-Command $texTool -ErrorAction SilentlyContinue)) {
        Write-Warning "No se encontró '$texTool' (MiKTeX). Instálalo para habilitar MathTex en Manim."
    } else {
        Write-Host "  [OK] $texTool -> $((Get-Command $texTool).Source)"
    }
}

Write-Host "`n=== 2. Verificando uv y entorno Python .venv ===" -ForegroundColor Cyan
$uvCmd = Get-Command uv -ErrorAction SilentlyContinue
if (-not $uvCmd) {
    $localUv = Join-Path $env:USERPROFILE ".local\bin\uv.exe"
    if (Test-Path $localUv) {
        $env:PATH = "$(Split-Path $localUv);$env:PATH"
        $uvCmd = Get-Command uv -ErrorAction SilentlyContinue
    }
}
if (-not $uvCmd) {
    Write-Host "Instalando uv..."
    Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
    $env:PATH = "$(Join-Path $env:USERPROFILE '.local\bin');$env:PATH"
}

$venvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Creando .venv con Python $PythonVersion..."
    uv venv (Join-Path $RepoRoot ".venv") --python $PythonVersion
}

Write-Host "Instalando dependencias Python desde backend/python/requirements.txt..."
uv pip install --python $venvPython -r (Join-Path $RepoRoot "backend\python\requirements.txt")

Write-Host "`n=== 3. Instalando dependencias Node.js y Prisma ===" -ForegroundColor Cyan
npm ci --ignore-scripts

if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://local:local@127.0.0.1:5432/postgres"
}
if (-not $env:DIRECT_URL) {
    $env:DIRECT_URL = "postgresql://local:local@127.0.0.1:5432/postgres"
}
npm run prisma:generate --workspace backend

if (-not $SkipBuild) {
    Write-Host "`n=== 4. Compilando backend y frontend ===" -ForegroundColor Cyan
    npm run build
}

if (-not $SkipSmokeTest) {
    Write-Host "`n=== 5. Verificación rápida de Python/Manim/Edge-TTS ===" -ForegroundColor Cyan
    & $venvPython -c "import manim, edge_tts, sympy, PIL, numpy, scipy, matplotlib, pydub, srt, faster_whisper; print('PYTHON IMPORTS OK - Manim:', manim.__version__, 'SymPy:', sympy.__version__)"
    & (Join-Path $RepoRoot ".venv\Scripts\manim.exe") --version
    & (Join-Path $RepoRoot ".venv\Scripts\edge-tts.exe") --version
}

Write-Host "`n=== Listo ===" -ForegroundColor Green
Write-Host "Si vas a levantar backend/worker conectados a Supabase, copia manualmente tu '.env.personal' (o '.env') en la raíz del proyecto."

#!/usr/bin/env bash

# 🎯 Script de prueba - Generar primer video

set -e  # Salir si hay error

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Math Video Generator - Test Script                   ║"
echo "║  Genera un video de prueba automáticamente             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que servidor está corriendo
echo -e "${BLUE}[1/3]${NC} Verificando servidor..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}✗ Backend no está corriendo${NC}"
    echo "   Inicia con: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Backend está activo${NC}"
echo ""

# Enviar request
echo -e "${BLUE}[2/3]${NC} Enviando request..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_'$(date +%s)'",
    "title": "Ecuación Cuadrática",
    "content": "x² - 5x + 6 = 0\nFactorizar: (x-2)(x-3)=0\nSoluciones: x=2, x=3",
    "quality": "medium"
  }')

echo "Respuesta:"
echo "$RESPONSE" | jq '.'
echo ""

# Parsear respuesta
STATUS=$(echo "$RESPONSE" | jq -r '.status')
PROGRESS=$(echo "$RESPONSE" | jq -r '.progress')
MESSAGE=$(echo "$RESPONSE" | jq -r '.message')

echo -e "${BLUE}[3/3]${NC} Resultado"
echo "  Status: $STATUS"
echo "  Progress: $PROGRESS%"
echo "  Message: $MESSAGE"
echo ""

if [ "$STATUS" = "failed" ]; then
    echo -e "${RED}✗ Error en procesamiento${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Video iniciado!${NC}"
    echo "  Los videos se guardarán en: /tmp/mvg-*"
fi

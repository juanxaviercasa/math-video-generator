# Conexión MCP — Math Video Generator & Super-Suite de 60 Motores

Este servidor MCP expone herramientas deterministas de matemáticas, auditoría de dominios e inyección de widgets para ser consumidas por **Antigravity**, **Claude Code** y **ChatGPT**.

---

## 1. Conexión Local en Antigravity / Claude Code (STDIO)

Agrega la siguiente configuración a tu archivo de configuración de MCP (`~/.gemini/antigravity/mcp_config.json` o `.mcp.json`):

```json
{
  "mcpServers": {
    "math-video-generator": {
      "command": "node",
      "args": [
        "c:\\Users\\cabel\\Videos\\Math Video Generator\\backend\\dist\\mcp\\stdio.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

O si estás en modo desarrollo con TypeScript:

```json
{
  "mcpServers": {
    "math-video-generator-dev": {
      "command": "npx",
      "args": [
        "tsx",
        "c:\\Users\\cabel\\Videos\\Math Video Generator\\backend\\src\\mcp\\stdio.ts"
      ]
    }
  }
}
```

---

## 2. Herramientas MCP Disponibles

| Nombre | Descripción | Parámetros Principales |
| :--- | :--- | :--- |
| `crawl_and_audit_domain` | Rastrea de forma autónoma cualquier dominio o sitio web de matemáticas, localiza vacíos interactivos y genera el mapa completo de fórmulas y motores (#01 al #60). | `domainOrUrl` (ej. `sistemazenit.com`), `maxPages` (1-20) |
| `audit_webpage_math_opportunities` | Evalúa el HTML o Markdown de una página web específica y detecta qué herramientas interactivas hacen falta. | `htmlOrMarkdown`, `url` |
| `recommend_engine_for_topic` | Recomienda cuál de los 60 motores open-source incrustar según el tema y expresiones matemáticas. | `topic`, `sampleEquations` |
| `generate_widget_embed_code` | Genera la URL embebible y el código HTML `<iframe>` o `<MathSuiteEmbed />` listo para copiar. | `toolId`, `expression`, `height` |
| `list_math_engines_catalog` | Devuelve el catálogo completo de los 60 motores matemáticos organizados en las 12 macro-categorías. | `categoryId` (opcional) |
| `validate_math` | Valida determinísticamente un ejercicio matemático (AST, raíces, discriminante) sin alucinar soluciones. | `problem` |
| `preview_quadratic_storyboard` | Genera las escenas pedagógicas y la narración sincronizada para video Manim 2.2. | `problem` |
| `list_neural_voices` | Lista las voces neuronales en español compatibles con la narración de video. | Ninguno |

---

## 3. Conexión Remota en ChatGPT (HTTP POST / SSE)

Para conectar ChatGPT a través de una Action o conector MCP remoto:

1. Inicia el backend con `npm start` en el puerto configurado (ej: `3001`).
2. Configura una variable de entorno `MCP_BEARER_TOKEN` de al menos 32 caracteres en tu archivo `.env`.
3. Expón el endpoint HTTPS (a través de tu proxy inverso o túnel):
   - **URL**: `https://<tu-dominio>/mcp`
   - **Protocolo**: MCP JSON-RPC 2.0
   - **Cabecera**: `Authorization: Bearer <MCP_BEARER_TOKEN>`

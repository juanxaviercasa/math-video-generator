# MCP: Antigravity, Gemini CLI, Codex y ChatGPT

Math Video Generator expone herramientas MCP de **solo lectura**: `validate_math`,
`preview_quadratic_storyboard`, `list_neural_voices` y `pipeline_capabilities`.

MCP es un protocolo de herramientas, **no reemplaza los modelos Gemini u OpenAI**.
Para invocar las APIs de esos modelos en el backend se siguen utilizando
`GEMINI_API_KEY` y `OPENAI_API_KEY`, respectivamente. Una suscripción a ChatGPT
no equivale automáticamente a una clave de OpenAI API.

## Antigravity o Gemini CLI: servidor local (stdio)

Primero compila el proyecto desde su raíz:

```bash
npm ci
npm run build --workspace backend
```

Agrega en el archivo de configuración de MCP del cliente una entrada equivalente
a la siguiente; sustituye la ruta por la absoluta a tu copia del repositorio:

```json
{
  "mcpServers": {
    "math-video-generator": {
      "command": "node",
      "args": ["C:/RUTA/math-video-generator/backend/dist/mcp/stdio.js"]
    }
  }
}
```

Para Antigravity IDE usa «MCP Servers → Manage MCP Servers → View raw config».
Para Antigravity CLI la configuración de proyecto puede guardarse en
`.agents/mcp_config.json`; para Gemini CLI usa `.gemini/settings.json`.
Solo debes configurar el cliente que realmente uses.

**Importante:** las herramientas no pueden crear publicaciones ni listar videos
de otros usuarios. La generación real de videos sigue protegida por la API
autenticada y por la cola del backend.

## ChatGPT: endpoint remoto por HTTPS

El backend dispone de un adaptador MCP stateless en `POST /mcp`. Por seguridad
se encuentra deshabilitado mientras `MCP_BEARER_TOKEN` no esté configurado
con al menos 32 caracteres aleatorios.

```dotenv
MCP_BEARER_TOKEN=coloca_aqui_un_token_aleatorio_de_32_caracteres_o_mas
```

Una vez desplegado tras HTTPS, la URL tendría la forma
`https://TU_DOMINIO/mcp`. **No se crea un dominio ni una conexión a ChatGPT
automáticamente.** La conexión necesita configurarse explícitamente en el
cliente y depende de los permisos de su cuenta/espacio de trabajo.

Usa autenticación de tipo Bearer únicamente si está permitida por el cliente.
En instalaciones que requieren OAuth, es necesario situar delante un gateway
OAuth compatible (con tokens de refresco cuando se requiera); el token estático
por sí solo no implementa OAuth. Si el servidor es privado, puede emplearse
un túnel MCP seguro compatible con el cliente.

El endpoint remoto no permite la publicación de videos ni el acceso a
artefactos privados. El middleware comprueba el token usando comparación
constante para valores de igual longitud; habilita TLS en tu proxy antes de
exponerlo por Internet y evita incluir el token en el repositorio.

## Verificación local

```bash
npm run mcp:dev --workspace backend
```

El proceso espera mensajes JSON-RPC en stdin y devuelve respuestas JSON-RPC
en stdout. Los mensajes de inicialización y `tools/list` son compatibles
con clientes stdio MCP. Para probar la validación desde el cliente llama a
`validate_math` con `{"problem":"x^2-5x+6=0"}`.

## Alcance

El MCP implementado sirve herramientas verificadas del proyecto; no afirma
que Antigravity o ChatGPT puedan controlar la interfaz ni utilizar las
credenciales de un usuario sin autorización. El solver productivo se limita
a cuadráticas hasta disponer de validadores para más familias matemáticas.

Referencias técnicas: https://antigravity.google/docs/mcp ,
https://geminicli.com/docs/tools/mcp-server/ y
https://developers.openai.com/api/docs/guides/tools-connectors-mcp .

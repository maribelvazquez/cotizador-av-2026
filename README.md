# Cotizador de Actividades Vulnerables · GMC360

Herramienta interna de diagnóstico y cotización de servicios de cumplimiento
PLD/FT para sujetos obligados por actividades vulnerables.

**Repositorio privado.** El archivo contiene costos, márgenes y notas internas
que no van al cliente.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `sitio/index.html` | El cotizador. Un solo archivo. |
| `funciones/propuesta.js` | El redactor de propuestas. Corre en el servidor. |
| `netlify.toml` | Le dice a Netlify qué publicar y qué correr. |
| `firestore.rules` | Reglas de la base de cotizaciones. Se pegan en Firebase. |

## La llave de Claude

Vive en Netlify → Project configuration → Environment variables, con el nombre
`ANTHROPIC_API_KEY`, marcada como secreta. **Nunca en este repositorio.**

## Cómo cambiar un precio

Todo lo configurable está en el bloque `CONFIG` al inicio del `<script>` de
`sitio/index.html`, comentado en español. No hay que tocar la lógica.

1. Se cambia el precio en el layout de productos.
2. Se refleja el mismo número en `CONFIG`.
3. Se sube describiendo qué se autorizó y quién lo autorizó.

El layout y el `CONFIG` son espejo. Si dejan de coincidir, el equipo cotiza con
un número y dirección autorizó otro.

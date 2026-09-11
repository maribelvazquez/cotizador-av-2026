# Cotizador de Actividades Vulnerables · GMC360

Herramienta interna de diagnóstico y cotización de servicios de cumplimiento
PLD/FT para sujetos obligados por actividades vulnerables.

**Repositorio privado.** El archivo contiene costos, márgenes y notas internas
que no van al cliente.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `sitio/index.html` | El cotizador. Un solo archivo. |
| `funciones/propuesta.js` | Corre en el servidor y hace dos trabajos: redacta la propuesta y, desde la v8.7, lee la transcripción de la junta para proponer la captura (`modo:'captura'`). Es el único que toca la llave. |
| `netlify.toml` | Le dice a Netlify qué publicar y qué correr. |
| `firestore.rules` | Reglas de la base. Se pegan en Firebase. **Cambiaron el 7-sep-2026**: antes ningún miembro del equipo podía mover el estatus de una cotización. |

## Tres colecciones

- `cotizaciones` — lo que se cotizó. Se crea y se lee; nunca se edita ni se borra.
- `autorizaciones` — el estado de cada cotización. El equipo mueve todos; solo dirección marca «Autorizada».
- `observaciones` — la retroalimentación del equipo, desde el botón «Reportar algo». Queda con folio, versión de precios y autor.

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

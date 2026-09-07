/* ══════════════════════════════════════════════════════════════
   GENERADOR DE PROPUESTAS · GMC360
   Función de servidor. Corre en Netlify, no en el navegador.

   AQUÍ ES DONDE VIVE LA LLAVE DE CLAUDE, y solo aquí.
   La llave se guarda en Netlify → Project configuration →
   Environment variables, con el nombre ANTHROPIC_API_KEY.
   Nunca se escribe en este archivo ni en el repositorio.

   Antes de gastar un solo peso de la llave, la función verifica
   contra Google que quien pide la propuesta entró de verdad con
   un correo @gmc360.com.mx. Sin eso, cualquiera que descubriera
   la dirección podría consumir el saldo.
   ══════════════════════════════════════════════════════════════ */

const DOMINIO = '@gmc360.com.mx';
const FIREBASE_API_KEY = 'AIzaSyC-T5ObXrd_lObRvgstBks-0uZONj5RNAc'; // identifica al proyecto, no es secreta
const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
/* Si la API contesta que el modelo no existe, cambia ANTHROPIC_MODEL
   en Netlify por el nombre vigente. No hay que tocar este archivo. */

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(obj)
});

/* Le pregunta a Google si el token es real y de quién es. */
async function verificar(idToken) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }) });
  if (!r.ok) return null;
  const d = await r.json();
  const u = d.users && d.users[0];
  if (!u || !u.email) return null;
  if (!u.email.toLowerCase().endsWith(DOMINIO)) return null;
  return u.email;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Solo POST' });

  if (!process.env.ANTHROPIC_API_KEY)
    return json(500, { error: 'Falta la llave. Guárdala en Netlify como ANTHROPIC_API_KEY y vuelve a publicar.' });

  let cuerpo;
  try { cuerpo = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'No se entendió la petición' }); }

  const correo = await verificar(cuerpo.idToken || '');
  if (!correo) return json(401, { error: 'Tu sesión no es válida. Sal y vuelve a entrar.' });

  const d = cuerpo.datos || {};

  /* ── Lo que el modelo PUEDE inventar: la prosa.
       Lo que NO puede inventar: hechos, cifras, fundamentos y alcances.
       Todo eso va aquí abajo ya resuelto, y la instrucción se lo prohíbe. ── */
  const contexto = `
DESTINATARIO DE LA PROPUESTA
${d.destinatario || '(no especificado — usa una fórmula neutra y marca [POR CONFIRMAR])'}

LO QUE SABEMOS DEL CLIENTE, dicho por quien lo atendió
${d.descripcion || '(no capturado)'}

TRANSCRIPCIÓN DE LA JUNTA
${d.transcripcion || '(no hay transcripción)'}

ARQUETIPO DE PROPUESTA QUE DETERMINÓ EL MOTOR
${d.arquetipo || ''}

DIAGNÓSTICO DE OBLIGACIONES, POR ENTIDAD
${JSON.stringify(d.diagnostico || [], null, 1)}

SERVICIOS COTIZADOS, CON SU ALCANCE Y ENTREGABLES YA REDACTADOS
${JSON.stringify(d.servicios || [], null, 1)}

HONORARIOS
${d.totales || ''}

ALERTAS INTERNAS DEL MOTOR (no van en la propuesta; son para que entiendas el caso)
${d.alertas || 'ninguna'}
`.trim();

  const instruccion = `Eres quien redacta las propuestas de GMC360, una firma mexicana de consultoría
en prevención de lavado de dinero dirigida por Maribel Vázquez Menchaca, contadora pública con más de
treinta años de experiencia y más de seiscientas auditorías.

Escribe la propuesta como la escribiría ella.

CÓMO ESCRIBE ELLA
- Le habla al dueño del negocio, no al auditor. Nada de jerga que obligue a traducir.
- Frases cortas. Va al punto. No adorna ni infla.
- Explica la consecuencia antes que la norma: primero qué le pasa al cliente, después de dónde sale.
- No amenaza. Un plazo mueve más que un susto, y además no se cae cuando el cliente lo consulta.
- No usa superlativos ni promesas de resultado. Usa verbos concretos: revisamos, construimos, presentamos.
- Nunca dice "líderes en el mercado" ni nada por el estilo.

REGLAS QUE NO PUEDES ROMPER
1. NO INVENTES NINGÚN HECHO. Nombres, cifras, fechas, artículos, plazos y alcances: solo los que están
   abajo. Si te falta un dato para escribir una frase, escribe [POR CONFIRMAR] y sigue.
2. NO INVENTES FUNDAMENTOS LEGALES. Cita únicamente los artículos que vienen en el diagnóstico, tal como
   vienen, con su ordenamiento. Si no viene, no lo cites.
3. NO COPIES NI ALUDAS a ningún otro cliente, caso o ejemplo. Jamás.
4. NO CAMBIES LOS HONORARIOS ni inventes descuentos, plazos de pago ni condiciones comerciales.
5. La sección de alcance se ARMA con los textos de alcance y entregables que vienen abajo. Puedes
   acomodarlos y darles hilo, no reescribir lo que prometen.
6. Distingue siempre entre lo que ya es exigible y lo que tiene fecha futura. A una obligación que aún
   no obliga NUNCA le llames incumplimiento: es un pendiente con fecha, y esa fecha es el argumento.
7. Nada de estructura de costos, márgenes, tarifas por hora ni por qué un servicio cuesta lo que cuesta.

ESTRUCTURA
1. Carta de presentación dirigida al destinatario. Máximo tres párrafos. El primero recoge algo concreto
   de la junta o de lo que nos contaron, para que se note que la escribimos para ellos.
2. Entendimiento de la situación. Qué encontramos y qué significa para su operación.
3. Diagnóstico. Lo exigible hoy y lo que tiene fecha. Con sus fundamentos.
4. Alcance de los servicios propuestos, ensamblado de los textos de abajo.
5. Entregables.
6. Honorarios, tal cual vienen.
7. Vigencia de treinta días naturales y siguiente paso.

Devuelve HTML limpio: solo <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <tr>, <th>, <td>, <strong>.
Sin CSS, sin <html>, sin <body>, sin comentarios y sin explicarme lo que hiciste. Solo el documento.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 8000,
        system: instruccion,
        messages: [{ role: 'user', content: contexto }]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return json(502, { error: 'La API de Claude respondió con error', detalle: t.slice(0, 500) });
    }
    const data = await r.json();
    const texto = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    return json(200, { html: texto, generadaPor: correo, modelo: MODELO });

  } catch (e) {
    return json(502, { error: 'No se pudo contactar a la API', detalle: String(e).slice(0, 300) });
  }
};

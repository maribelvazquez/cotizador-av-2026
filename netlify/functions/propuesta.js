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

CONTEXTO DEL CLIENTE
Puede venir como notas de quien lo atendió, como transcripción cruda de la junta, o como las dos cosas
mezcladas. Distíngue tú: si es transcripción, quédate con lo que dijo EL CLIENTE, no con lo que dijo
quien lo atendió; si son notas, tómalas como buenas. Nunca cites la transcripción literalmente en la
propuesta ni menciones que hubo una grabación.
${d.contexto || '(no capturado — la propuesta va a salir genérica; márcalo con [POR CONFIRMAR] donde haga falta)'}

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
treinta años de experiencia y más de seiscientas auditorías. Escribe la propuesta como la escribiría ella.

═══ LA VOZ ═══
- Le habla al dueño del negocio, no al auditor. Frases cortas. Va al punto.
- Empieza por reconocer lo que el cliente ya hizo.
- Cuantifica el riesgo UNA sola vez, con un número concreto, y sigue adelante. No lo repite.
- Explica el mecanismo, no solo la conclusión.
- Pone la escalera completa sobre la mesa y recomienda una. Dice qué NO recomienda y por qué.
- Nunca promete impunidad, pero tampoco amenaza.
- Las fechas de exigibilidad son el argumento, no la multa.
- Los encabezados explican la lógica, no etiquetan.
- Nombra lo que queda FUERA del alcance con la misma claridad que lo que entra.
- Dice explícitamente lo que el cliente NO tiene que hacer. Vale más que tres párrafos de venta.
- Sin adjetivos de venta ni superlativos sobre GMC360. Nada de "líderes" ni "expertos reconocidos".

═══ REGLAS QUE NO PUEDES ROMPER ═══
1. NO INVENTES NINGÚN HECHO. Nombres, cifras, fechas, artículos, plazos y alcances: solo los de abajo.
   Si te falta un dato, escribe [POR CONFIRMAR] y sigue. Nunca lo rellenes con algo verosímil.
2. NO INVENTES FUNDAMENTOS. Cita solo los artículos del diagnóstico, tal como vienen, con su
   ordenamiento (Ley, Reglamento o RCG). Si una afirmación no tiene fundamento abajo, márcala como
   zona abierta; no le inventes uno.
3. NINGUNA PROPUESTA MENCIONA A OTRO CLIENTE. Ni por nombre, ni por descripción reconocible, ni como
   caso de éxito. La experiencia se acredita por método, no por clientela.
4. NO CAMBIES LOS HONORARIOS ni inventes descuentos, anticipos, plazos de pago ni condiciones.
5. La sección 3 se ENSAMBLA con los textos de alcance y entregables de abajo, literales. Puedes
   ordenarlos y darles hilo; no puedes reescribir lo que prometen. Si a un servicio le falta alcance,
   escribe [ALCANCE POR CAPTURAR EN EL CATÁLOGO]. No lo inventes.
6. Distingue siempre lo exigible hoy de lo que tiene fecha futura. A una obligación que aún no obliga
   NUNCA le llames incumplimiento: es un pendiente con fecha, y esa fecha es el argumento.
7. Si alguna entidad NO actualiza los supuestos del artículo 17, dilo con todas sus letras y dedícale
   espacio: explicar que no está obligada construye la credibilidad de todo lo demás. Si aun así se le
   propone cumplimiento voluntario, se etiqueta como voluntario.
8. Nada de estructura de costos, márgenes, tarifas por hora ni por qué un servicio cuesta lo que cuesta.
9. No prometas resultado normativo: es encargo de medios. No prometas desarrollo de software.
10. Los viáticos nunca van dentro del honorario.

═══ ESTRUCTURA · SIETE SECCIONES, EN ESTE ORDEN ═══
PORTADA — Título del plan, entidades destinatarias, mes y año, y la leyenda "Documento Confidencial".
ÍNDICE — Las siete secciones.

1. RESUMEN EJECUTIVO
   Objetivo en un párrafo. Después "Hallazgos críticos identificados": uno por uno, nombrados y con su
   riesgo cuantificado cuando el diagnóstico traiga la cifra. Cierra con "Valor de la propuesta": cuatro
   puntos de lo que evita o logra. El hallazgo más grave va aquí, no escondido en el cuerpo.

2. ANTECEDENTES Y DIAGNÓSTICO
   Una subsección por entidad. Qué sí actualiza y qué no. Cierra cada una con
   "Nivel de riesgo: BAJO / MEDIO / ALTO", tal como viene en el diagnóstico.

3. ALCANCE DE SERVICIOS
   Fases secuenciales. Cada fase: período, un párrafo de propósito, subservicios numerados (1.1, 1.2,
   1.3) con acciones concretas, y "Entregables de la fase" en lista. Lo que vaya como cotización
   separada se marca "Servicio opcional (cotización separada)".

4. CRONOGRAMA
   Tabla de fases contra meses, anclada a las fechas de exigibilidad del diagnóstico.

5. EQUIPO DE TRABAJO
   Dirección del proyecto y responsabilidades del cliente. Sin cifras de credenciales que no vengan abajo.

6. INVERSIÓN Y CONDICIONES
   Tabla por fase con los honorarios tal cual. Vigencia de treinta días naturales. IVA. Viáticos aparte.
   Exclusiones.

7. PRÓXIMOS PASOS
   Revisión y aprobación, formalización, arranque. Corto.

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
    /* Toda propuesta nace como BORRADOR. La marca solo la quita dirección,
       y el registro guarda quién capturó, quién revisó y quién autorizó. */
    const marca = `<p><strong>BORRADOR · no se envía al cliente hasta que dirección lo autorice.</strong><br>
      Capturó: ${correo} · Revisó: [PENDIENTE] · Autorizó: [PENDIENTE]</p><hr>`;
    return json(200, { html: marca + texto, generadaPor: correo, modelo: MODELO, borrador: true });

  } catch (e) {
    return json(502, { error: 'No se pudo contactar a la API', detalle: String(e).slice(0, 300) });
  }
};

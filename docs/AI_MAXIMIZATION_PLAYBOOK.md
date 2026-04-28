# Playbook para sacar el maximo partido a la IA en WIAHost

## Objetivo

Este documento define como usar IA de forma realmente diferencial en WIAHost, combinando lo que ya tenemos en el producto con lo que conviene incluir en proximas fases.

La meta no es "poner IA". La meta es:

- Reducir tiempos de respuesta.
- Anticipar bloqueos operativos.
- Proteger activos.
- Mejorar revenue.
- Automatizar trabajo repetitivo sin perder control humano.
- Crear una base de datos historica que haga cada recomendacion mas util con el tiempo.

## Fuentes revisadas

- OpenAI: GPT-5.5 y Responses API recomiendan usar herramientas, structured outputs, razonamiento ajustable, prompt caching y evaluacion por casos reales para flujos productivos complejos: https://developers.openai.com/api/docs/guides/latest-model
- OpenAI: tools/function calling permiten conectar el modelo con datos, funciones, web search, MCP y servicios externos: https://developers.openai.com/api/docs/guides/tools
- OpenAI: Structured Outputs fuerza respuestas que cumplen un JSON Schema y reduce errores de formato: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI: embeddings sirven para busqueda, clustering, recomendaciones, anomalias y clasificacion semantica: https://developers.openai.com/api/docs/guides/embeddings
- Vercel AI SDK: unifica generacion, structured data, tool calling, agents, embeddings, streaming y UI en TypeScript/Next: https://ai-sdk.dev/docs
- Vercel AI SDK: structured data con Zod y `Output.object()` para clasificar o extraer informacion: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- Vercel AI SDK: tool calling con `inputSchema`, `execute` y `strict` para acciones controladas: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Vercel AI SDK: middleware para RAG, guardrails, cache y logging: https://ai-sdk.dev/docs/ai-sdk-core/middleware
- Vercel AI SDK: testing con mock providers para no depender de llamadas reales a modelos en tests: https://ai-sdk.dev/docs/ai-sdk-core/testing
- Vercel AI Gateway: acceso unificado a modelos, presupuestos, fallback, embeddings y monitorizacion de gasto: https://vercel.com/docs/ai-gateway
- Vercel AI Gateway observability: metricas de tokens, TTFT, coste y logs por proyecto/API key: https://vercel.com/docs/ai-gateway/capabilities/observability
- Supabase AI & Vectors: Postgres + pgvector para busqueda semantica, hibrida y RAG: https://supabase.com/docs/guides/ai
- Supabase pgvector: embeddings y busqueda por similitud dentro de Postgres: https://supabase.com/docs/guides/database/extensions/pgvector
- Supabase automatic embeddings: arquitectura con pgvector, colas, pg_net, pg_cron y Edge Functions para mantener embeddings sincronizados: https://supabase.com/docs/guides/ai/automatic-embeddings
- Supabase Edge Functions AI: Edge Functions pueden generar embeddings y ejecutar flujos IA cerca del usuario: https://supabase.com/docs/guides/functions/ai-models
- Supabase RLS: RLS debe estar habilitado en tablas expuestas y puede combinarse con Auth para seguridad end-to-end: https://supabase.com/docs/guides/database/postgres/row-level-security

## Lo que ya tenemos a favor

WIAHost ya tiene una base muy buena para IA futura:

- Producto PMS/CRM con datos ricos: propiedades, reservas, canales, mensajes, tareas, incidencias, pagos, documentos y owner statements.
- Supabase Postgres como fuente de verdad.
- RLS preparado para seguridad por rol.
- Storage preparado para evidencias, documentos y fotos.
- Web Next.js con dashboard tipo command center.
- Paquetes compartidos con validadores Zod.
- Migracion `0004_ai_foundation.sql` con eventos, labels, snapshots, observaciones de pricing, predicciones, auditoria y memoria visual/funcional.
- Documentacion de IA basada en los apuntes del Modulo 3.
- Estrategia de cinco modulos IA: inbox, automatizaciones, operaciones, revenue y riesgo/incidencias.

Esto significa que no partimos de cero. Lo que falta no es "idea"; falta convertir esa base en un sistema de IA medible.

## Principio tecnico

La arquitectura correcta para WIAHost debe separar cinco piezas:

1. Datos operativos: lo que pasa en la plataforma.
2. Labels y feedback: como los humanos corrigen o aprueban.
3. Modelos y reglas: lo que sugiere la IA.
4. Herramientas con permisos: lo que la IA puede consultar o proponer.
5. Auditoria: por que se hizo, cuanto costo y que resultado tuvo.

Si falta una de estas piezas, la IA se convierte en demo. Si estan las cinco, se convierte en ventaja competitiva.

## Arquitectura recomendada

```text
WIAHost Web / Mobile
  -> Supabase Auth + RLS
  -> Supabase Postgres
      -> PMS data
      -> AI foundation tables
      -> pgvector semantic memory
  -> Next.js API / Server Actions
      -> AI SDK structured outputs
      -> AI SDK tools
      -> AI Gateway / OpenAI / model providers
  -> Supabase Edge Functions
      -> embeddings jobs
      -> webhooks
      -> async AI tasks
  -> Observability
      -> model_predictions
      -> ai_audit_log
      -> Vercel AI Gateway metrics
      -> eval datasets
```

## Capas de IA

### Capa 1: reglas y datos

Uso:

- Prioridad por check-in cercano.
- Mensajes sin responder.
- Limpieza pendiente.
- Reserva sin pago/deposito.
- Incidencia abierta.

Por que:

- Es barata.
- Es explicable.
- Genera labels para entrenar o evaluar modelos despues.

### Capa 2: structured AI

Uso:

- Clasificar mensajes.
- Extraer hora de llegada.
- Extraer problema de incidencia.
- Detectar idioma.
- Generar resumen corto.
- Proponer categoria/urgencia.

Tecnica:

- Structured Outputs / Zod schema.
- Guardar salida en `model_predictions`.
- Guardar feedback en `message_labels` o `task_outcomes`.

Por que:

- Evita respuestas libres imposibles de automatizar.
- Permite UI y tests.
- Reduce alucinaciones de formato.

### Capa 3: semantic memory

Uso:

- Buscar mensajes similares.
- Encontrar incidencias parecidas.
- Sugerir respuestas basadas en casos previos.
- RAG sobre normas de casa, check-in, documentos y FAQs.
- Clustering de propiedades/reservas.

Tecnica:

- pgvector en Supabase.
- Tabla futura `ai_embeddings`.
- Jobs asincronos para generar embeddings.
- Busqueda hibrida: keyword + vector + filtros RLS.

Por que:

- Es donde la IA empieza a recordar la operacion real.
- Permite mejorar sin entrenar modelos propios.

### Capa 4: copilotos con herramientas

Uso:

- Copiloto de inbox.
- Copiloto de operaciones.
- Copiloto de revenue.
- Copiloto de incidencias.

Tecnica:

- AI SDK tool calling.
- Herramientas propias: `getReservation`, `getProperty`, `getConversation`, `createTaskDraft`, `suggestReply`, `createIncidentDraft`.
- `needsApproval` para acciones con efecto real.
- Nunca ejecutar acciones sensibles sin confirmacion humana.

Por que:

- El modelo no solo responde: consulta datos reales y propone acciones.
- La herramienta impone permisos, validacion y trazabilidad.

### Capa 5: agentes y automatizaciones dinamicas

Uso:

- "Next best action" diario.
- Monitor de check-ins.
- Monitor de limpiezas.
- Revenue advisor.
- Auditor visual/funcional.

Tecnica:

- Agentes con pasos limitados.
- Cola de jobs.
- Presupuesto por ejecucion.
- Reglas de parada.
- Auditoria obligatoria.

Por que:

- Aqui esta el diferencial fuerte, pero solo debe entrar cuando tengamos datos, permisos y metricas.

## Modulos con mayor ROI

### 1. Inbox inteligente

Primera entrega:

- Clasificacion de urgencia.
- Deteccion de idioma/canal.
- Resumen del hilo.
- Borrador de respuesta.
- Explicacion de prioridad.

Maximo partido:

- Usar structured output para que cada mensaje devuelva `category`, `urgency`, `intent`, `language`, `summary`, `suggested_reply`, `confidence`, `reasons`.
- Guardar cada decision en `model_predictions`.
- Guardar aceptacion/edicion/rechazo del operador.
- Con embeddings, recuperar respuestas anteriores parecidas.

Valor:

- Baja tiempo de respuesta.
- Mejora rating.
- Crea dataset propio de conversacion.

### 2. Automatizaciones contextuales

Primera entrega:

- Cola prioritaria.
- Reglas explicables.
- Sugerencias, no acciones automaticas.

Maximo partido:

- Herramientas con permisos: consultar reserva, consultar mensajes, crear borrador, crear tarea.
- Acciones que requieren aprobacion si envian mensaje, cambian precio, crean cargo o notifican propietario.
- Aprender de si el operador acepta/edita/ignora.

Valor:

- Es el "killer": convierte WIAHost en command center proactivo.

### 3. Operaciones de limpieza y mantenimiento

Primera entrega:

- SLA por tarea.
- Riesgo de retraso.
- Evidencias/fotos.
- Score de calidad manual.

Maximo partido:

- Vision futura para revisar fotos.
- Prediccion de retraso con historial.
- Incidencias recurrentes por propiedad.
- Ranking de tareas por impacto en check-in.

Valor:

- Diferenciador real frente a PMS que solo registran tareas.

### 4. Revenue advisor

Primera entrega:

- Alertas: precio bajo, hueco raro, minimo de noches mal configurado.
- Comparar precio actual vs historico.

Maximo partido:

- `pricing_observations` debe guardar precio actual, sugerido, aprobado y final.
- Integrar PriceLabs u otra herramienta como fuente externa cuando tenga sentido.
- El modelo explica por que recomienda, pero no cambia precios solo.

Valor:

- Aporta dinero directo, pero requiere confianza y datos.

### 5. Riesgo operativo e incidencias

Primera entrega:

- Clasificar incidencia.
- Estimar severidad/coste probable.
- Detectar reserva con riesgo operativo por senales no sensibles.

Maximo partido:

- Nunca etiquetar "huesped problematico".
- Etiquetar "reserva con riesgo operativo".
- Usar solo senales observables: timing, falta de informacion, pagos, mensajes, historial operativo, normas, incidencias.
- Explicar cada alerta.

Valor:

- Protege activos.
- Reduce sorpresas.
- Da confianza a gestores de villas y propietarios.

### 6. Owner intelligence

Primera entrega:

- Resumen mensual por propietario.
- Explicacion de ingresos, incidencias, ocupacion y tareas.

Maximo partido:

- Generar owner statements narrativos.
- Explicar "que paso este mes" en lenguaje claro.
- Detectar propiedades que necesitan atencion.

Valor:

- Reduce llamadas y mejora confianza del propietario.

### 7. Listing y distribucion inteligente

Primera entrega:

- Generador de copy de anuncios.
- Checklist SEO/canal.
- Diagnostico de listing incompleto.

Maximo partido:

- Optimizar textos por canal.
- Detectar fotos pobres o faltantes.
- Generar variantes A/B.
- Explicar por que un anuncio puede convertir peor.

Valor:

- Conecta con la estrategia de publicar anuncios y atraer leads a web propia.

## Lo que debemos incluir en la arquitectura

### 1. Prompt registry

Crear tabla futura:

- `ai_prompt_templates`
- `ai_prompt_versions`

Campos:

- nombre.
- modulo.
- version.
- system prompt.
- output schema.
- modelo recomendado.
- temperatura.
- estado: draft/active/archived.
- fecha.

Motivo:

- No queremos prompts escondidos en codigo.
- Queremos versionar y comparar.

### 2. Embeddings store

Crear migracion futura con pgvector:

- `ai_embedding_sources`
- `ai_embeddings`
- `ai_embedding_jobs`

Contenido embebible:

- mensajes.
- documentos.
- normas de casa.
- instrucciones de check-in.
- incidencias.
- FAQs.
- descripciones de propiedades.

Motivo:

- RAG.
- busqueda semantica.
- sugerencias basadas en casos previos.

### 3. Evals y datasets

Crear:

- `ai_eval_cases`
- `ai_eval_runs`
- `ai_eval_results`

Casos:

- 50 mensajes reales anonimizados.
- 30 incidencias.
- 30 tareas.
- 30 recomendaciones de pricing.
- 20 hilos largos.

Metricas:

- precision de categoria.
- recall de urgencias.
- aceptacion de respuesta.
- tiempo ahorrado.
- falsos positivos criticos.
- coste por caso.

Motivo:

- Sin evals, no sabemos si mejora.

### 4. Guardrails y permisos

Implementar:

- PII minimization.
- Redaccion de datos sensibles cuando no sean necesarios.
- Moderacion/seguridad antes de enviar mensajes.
- Aprobacion humana en acciones con efecto.
- RLS siempre activo.
- Service role nunca en cliente.

Motivo:

- La confianza es parte del producto.

### 5. Observabilidad IA

Medir:

- tokens input/output.
- coste.
- modelo.
- latencia.
- TTFT.
- tasa de aceptacion.
- tasa de edicion.
- tasa de error.
- feedback humano.

Guardar:

- en `model_predictions`.
- en `ai_audit_log`.
- en AI Gateway observability si usamos Vercel.

Motivo:

- Controlar coste y calidad.

## Roadmap recomendado

### Sprint IA 0: instrumentacion

Objetivo:

- Que la app empiece a generar datos utiles.

Entregables:

- Helper `trackOperationalEvent`.
- Eventos para login, reserva creada, mensaje recibido, tarea completada, incidencia creada, precio modificado.
- UI interna para ver eventos recientes.
- Validadores compartidos ya existentes.

### Sprint IA 1: inbox classifier

Objetivo:

- Primera IA visible y de alto impacto.

Entregables:

- Endpoint `POST /api/ai/inbox/classify`.
- Zod schema de salida.
- Guarda `message_labels` y `model_predictions`.
- Boton "Clasificar" en inbox.
- Badges de urgencia y categoria.
- Tests con mock provider.

### Sprint IA 2: conversation summary + draft reply

Objetivo:

- Ahorrar tiempo real al operador.

Entregables:

- Resumen de hilo.
- Borrador de respuesta.
- Selector de tono: formal, cercano, premium, urgente.
- Feedback: aceptar, editar, rechazar.
- Auditoria en `ai_audit_log`.

### Sprint IA 3: semantic memory

Objetivo:

- Que WIAHost recuerde casos previos.

Entregables:

- pgvector.
- embeddings de mensajes y FAQs.
- busqueda de conversaciones similares.
- sugerencias basadas en respuestas aprobadas.

### Sprint IA 4: next best action

Objetivo:

- Dashboard proactivo.

Entregables:

- ranking diario.
- explicacion por accion.
- herramientas con permisos.
- aprobacion humana.

### Sprint IA 5: operaciones inteligentes

Objetivo:

- Diferenciar en limpieza/mantenimiento.

Entregables:

- riesgo de retraso.
- score de calidad.
- recurrent incidents.
- foto/evidencia con revision asistida.

### Sprint IA 6: revenue advisor

Objetivo:

- Monetizar la inteligencia.

Entregables:

- alertas de precio.
- minimo de noches recomendado.
- huecos de calendario.
- comparativa historica.

## Modelo de seleccion de modelos

Usar varios niveles:

| Tipo de tarea | Modelo recomendado | Motivo |
| --- | --- | --- |
| Clasificacion simple | modelo rapido/barato + structured output | Bajo coste y latencia |
| Resumen de hilo | modelo medio | Mejor lenguaje y contexto |
| Borrador de respuesta | modelo medio con tono | Calidad visible al usuario |
| Agente con herramientas | modelo fuerte | Necesita razonar y usar datos |
| Vision/fotos | modelo multimodal | Revision visual |
| Embeddings | embedding model dedicado o Supabase AI | Semantica y busqueda |
| Evals complejas | modelo fuerte | Mejor juez, pero contrastar con humanos |

Regla:

- No usar el modelo mas caro por defecto.
- Cada modulo debe tener presupuesto, latencia objetivo y fallback.

## Que no debemos hacer

- No entrenar modelos propios al principio.
- No autoenviar mensajes sensibles sin aprobacion.
- No cambiar precios automaticamente.
- No clasificar personas con etiquetas peligrosas.
- No usar atributos protegidos.
- No guardar prompts completos con PII si basta con hash/resumen.
- No meter IA en UI antes de tener feedback y medicion.
- No prometer "80% automatizado" hasta medirlo.

## Cambios concretos que conviene implementar pronto

### Base de datos

- Activar `pgvector`.
- Crear tablas de embeddings y jobs.
- Crear tablas de prompt templates.
- Crear tablas de evals.
- Revisar RLS de `0004_ai_foundation.sql` cuando Supabase CLI este disponible.

### Backend

- Crear `apps/web/src/lib/ai`.
- Crear provider interface para no casarnos con un proveedor.
- Crear `trackOperationalEvent`.
- Crear `createModelPrediction`.
- Crear `recordAiFeedback`.
- Crear endpoints AI internos con rate limit.

### Frontend

- Inbox con badges IA.
- Panel de resumen.
- Borrador editable.
- Botones: aceptar, editar, rechazar.
- Explicacion visible.
- Indicador de confianza.

### Calidad

- Tests con mock provider.
- Golden datasets anonimizados.
- CI que no llame a modelos reales.
- Auditoria de prompts.
- Revisiones visuales para AI UI.

## Decision final

Para sacar el maximo partido a la IA, WIAHost debe convertirse en un PMS que aprende de la operacion. La secuencia ganadora es:

1. Instrumentar todo.
2. Clasificar y resumir inbox.
3. Guardar feedback humano.
4. Crear memoria semantica con embeddings.
5. Construir copilotos con herramientas y aprobacion.
6. Medir calidad, coste y aceptacion.
7. Automatizar solo lo que demuestre ser fiable.

El diferencial no sera tener un chatbot. Sera que cada reserva, mensaje, limpieza, incidencia y precio alimenta un sistema que cada semana ayuda mas.

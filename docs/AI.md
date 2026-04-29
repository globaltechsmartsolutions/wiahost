# IA en WIAHost

## Proposito

La IA de WIAHost no es un chatbot decorativo. Es una capa operativa para anticipar bloqueos, reducir trabajo manual, mejorar respuesta al huesped, proteger activos y ayudar a tomar mejores decisiones.

Mensaje de producto recomendado:

> El PMS que anticipa la operacion antes de que se convierta en problema.

Principio central:

- La IA sugiere.
- El operador decide.
- El sistema registra datos, explicacion, coste, feedback y resultado.

## Estado actual

Ya existe base preparada:

- Producto PMS/CRM con datos de propiedades, reservas, conversaciones, tareas, incidencias, pagos, documentos y canales.
- Supabase Postgres con RLS y storage.
- Migracion `0004_ai_foundation.sql` con tablas para eventos, labels, snapshots, pricing observations, incident features, predicciones, auditoria y memoria visual/funcional.
- Validadores compartidos en `packages/shared/src/validators/ai.ts`.
- La investigacion previa de fuentes oficiales y apuntes del Modulo 3 ya esta consolidada en este documento.

Todavia no existe:

- Llamadas reales a modelos.
- Embeddings con pgvector.
- Copilotos con herramientas.
- Evals de calidad IA.
- Automatizaciones IA en produccion.

## Modulos IA prioritarios

### 1. Inbox inteligente

Objetivo:

- Reducir tiempo de respuesta y mejorar ratings.

Capacidades:

- Clasificar urgencia.
- Detectar idioma, canal e intencion.
- Resumir hilos largos.
- Sugerir respuesta contextual.
- Recuperar respuestas aprobadas similares.

Primera version:

- Reglas + structured output + feedback humano.
- No auto-enviar respuestas sensibles.

### 2. Automatizaciones contextuales

Objetivo:

- Convertir el dashboard en un command center proactivo.

Capacidades:

- Siguiente mejor accion.
- Prioridad por check-in, limpieza, mensajes, pagos e incidencias.
- Herramientas con permisos para consultar datos y crear borradores.

Primera version:

- Cola prioritaria explicable.
- Acciones sugeridas con aprobacion humana.

### 3. Operaciones de limpieza y mantenimiento

Objetivo:

- Diferenciar WIAHost donde muchos PMS fallan: ejecucion diaria.

Capacidades:

- Riesgo de retraso de limpieza.
- Score de calidad por equipo.
- Evidencias/fotos.
- Incidencias recurrentes.
- Revision visual futura.

Primera version:

- SLA de tareas, outcomes y evidencias.

### 4. Revenue advisor

Objetivo:

- Ayudar a ganar mas sin cambiar precios automaticamente.

Capacidades:

- Alertas de fechas infravaloradas.
- Recomendacion de minimo de noches.
- Booking pace y lead time.
- Comparacion de precio actual, sugerido, aprobado y final.

Primera version:

- Advisor explicable, no autopricing.

### 5. Riesgo operativo e incidencias

Objetivo:

- Proteger activos y reducir sorpresas.

Capacidades:

- Clasificar incidencias.
- Estimar severidad/coste probable.
- Detectar riesgo operativo de reserva con senales observables.
- Sugerir acciones preventivas.

Importante:

- No etiquetar personas como "problematicas".
- No usar atributos protegidos.
- Usar solo senales operativas: timing, pagos, mensajes, deposito, historial de incidencias y normas.

## Arquitectura IA recomendada

```text
WIAHost Web / Mobile
  -> Supabase Auth + RLS
  -> Supabase Postgres
      -> PMS data
      -> AI foundation tables
      -> pgvector semantic memory futura
  -> Next.js API / Server Actions
      -> structured outputs
      -> tool calling
      -> human approval
  -> Supabase Edge Functions futuras
      -> embeddings jobs
      -> webhooks
      -> async AI tasks
  -> Observability
      -> model_predictions
      -> ai_audit_log
      -> eval datasets
      -> provider cost metrics
```

## Datos preparados

Tablas ya preparadas:

- `operational_events`
- `message_labels`
- `task_outcomes`
- `reservation_snapshots`
- `pricing_observations`
- `incident_features`
- `model_predictions`
- `ai_audit_log`
- `quality_audit_memories`

`message_labels` ya se alimenta desde el detalle de inbox y desde `POST /api/inbox/:conversationId/labels`: urgencia, sentimiento, categoria, intencion, idioma y rationale humano. Esto crea dataset revisado por operaciones antes de activar clasificadores o LLMs.

`automation_runs` ya registra pruebas manuales de reglas con preview renderizado y variables pendientes. Sera una fuente clave para medir que automatizaciones se usan, fallan o necesitan aprobacion humana antes de hacerlas autonomas.

`task_outcomes` ya se alimenta desde el flujo real de tareas y mide cumplimiento de SLA. Esto permite modelos futuros de prediccion de retrasos, calidad de limpieza/mantenimiento y priorizacion operativa con datos historicos limpios.

`operational_events` ya captura mutaciones clave de reservas, leads, tareas, incidencias, inbox y automatizaciones. Esta memoria temporal permite construir features de secuencia, tiempos de reaccion y causa/efecto sin depender de logs externos.

Tablas futuras recomendadas:

- `ai_prompt_templates`
- `ai_prompt_versions`
- `ai_embedding_sources`
- `ai_embeddings`
- `ai_embedding_jobs`
- `ai_eval_cases`
- `ai_eval_runs`
- `ai_eval_results`

## Secuencia de implementacion

### Fase IA 0: instrumentacion

- Crear helper `trackOperationalEvent`.
- Registrar eventos clave: mensaje recibido, reserva creada, tarea completada, incidencia creada, precio modificado.
- Guardar feedback humano.

### Fase IA 1: inbox classifier

- Endpoint interno `POST /api/ai/inbox/classify`.
- Zod schema de salida.
- Guardar `message_labels` y `model_predictions`.
- Mostrar badges de urgencia/categoria.
- Tests con mock provider.

### Fase IA 2: resumen y borrador de respuesta

- Resumen de conversacion.
- Borrador editable.
- Selector de tono.
- Feedback: aceptar, editar, rechazar.
- Auditoria en `ai_audit_log`.

### Fase IA 3: memoria semantica

- Activar pgvector.
- Embeddings de mensajes, FAQs, normas y documentos.
- Busqueda de conversaciones similares.
- RAG con filtros por permisos.

### Fase IA 4: next best action

- Ranking diario de acciones.
- Herramientas con permisos.
- Explicacion visible.
- Aprobacion humana.

### Fase IA 5: operaciones y revenue

- Riesgo de retraso.
- Score de calidad.
- Incidencias recurrentes.
- Alertas de pricing.
- Recomendaciones de minimo de noches.

## Guardrails

- No usar atributos protegidos.
- No auto-enviar mensajes sensibles.
- No cambiar precios automaticamente.
- No crear cargos, cancelar reservas o notificar propietarios sin aprobacion.
- No guardar prompts completos con PII si basta con hash/resumen.
- No entrenar modelos propios sin historico suficiente.
- No desplegar IA sin baseline, metricas y rollback.
- No vender correlacion como causalidad.

## Calidad y medicion

Cada feature IA debe medir:

- Precision de categoria.
- Recall de urgencias.
- Tasa de aceptacion.
- Tasa de edicion.
- Tasa de rechazo.
- Tiempo ahorrado.
- Coste por accion.
- Latencia.
- Errores y falsos positivos criticos.

Los tests de IA no deben depender de llamadas reales a modelos en CI. Deben usar mocks, datasets anonimizados y snapshots estructurados.

## Fuentes consolidadas

Este documento fusiona la investigacion previa para evitar documentos duplicados.

Fuentes tecnicas revisadas:

- OpenAI Responses API, tool calling, structured outputs y embeddings.
- Vercel AI SDK para structured output, streaming, herramientas, agentes y testing con mocks.
- Vercel AI Gateway para observabilidad, coste, presupuestos y fallback de modelos.
- Supabase AI, pgvector, Edge Functions, RLS y patrones de embeddings automaticos.
- Apuntes del Modulo 3: machine learning supervisado/no supervisado, grafos, explicabilidad, embeddings, multimodal, redes neuronales, RNN, GRU, LSTM y Transformers.

Decisiones extraidas:

- Empezar por datos, reglas y feedback humano antes de modelos complejos.
- Usar structured outputs para clasificacion/extraccion, no texto libre cuando haya que guardar resultados.
- Usar embeddings y pgvector para memoria semantica antes de entrenar modelos propios.
- Usar herramientas con permisos y aprobacion humana para acciones reales.
- Medir calidad, coste y aceptacion desde el primer modulo IA.
- Mantener modelos secuenciales o multimodales para fases posteriores con historico suficiente.

## Aprendizajes del Modulo 3 aplicados

### Machine learning supervisado

Uso en WIAHost:

- Clasificar urgencia del inbox.
- Predecir riesgo de SLA roto.
- Estimar coste de incidencia.
- Sugerir prioridad de tareas.
- Crear ranking de proximas mejores acciones.

Regla:

- Todo modelo supervisado necesita labels humanos, split correcto, baseline y metrica de negocio.

### Machine learning no supervisado

Uso en WIAHost:

- Segmentacion de propiedades.
- Segmentacion de reservas por comportamiento.
- Deteccion de anomalias en precios, reservas, mensajes o incidencias.
- PCA/embeddings para entender portfolio health.

Regla:

- Los clusters ayudan a explorar, no deben tomar decisiones automaticas sin validacion.

### Explicabilidad y grafos

Uso en WIAHost:

- Explicar por que una accion es prioritaria.
- Mapear dependencias entre canal, propiedad, check-in, limpieza, pagos, mensajes e incidencias.
- Detectar cuellos de botella operativos.

Regla:

- Hablar de relacion, dependencia o hipotesis causal; no vender causalidad fuerte sin evidencia.

### Redes neuronales y secuencias

Uso futuro:

- Forecast de ocupacion.
- Pricing secuencial.
- Clasificacion de conversaciones completas.
- Patrones recurrentes de incidencias.

Regla:

- Antes de RNN/GRU/LSTM/Transformers propios, necesitamos historico, ventanas temporales limpias y validacion sin leakage.

### Multimodal

Uso futuro:

- Transcribir notas de voz.
- Analizar fotos de incidencias.
- Revisar fotos de limpieza.
- Auditar anuncios y calidad visual.

Regla:

- Vision/audio entran despues de tener storage, permisos, consentimiento, auditoria y coste controlado.

## Modelo de seleccion de modelos

| Tipo de tarea | Enfoque recomendado | Motivo |
| --- | --- | --- |
| Reglas operativas simples | Reglas deterministas | Barato, rapido y explicable |
| Clasificacion/extraccion | Structured output con schema Zod | Resultado guardable y testeable |
| Busqueda semantica | Embeddings + pgvector | Memoria de casos previos |
| Borradores de respuesta | LLM con tono y contexto | Valor visible para operadores |
| Copiloto con acciones | Tool calling + aprobacion | Control y seguridad |
| Vision/fotos | Modelo multimodal | Solo cuando haya storage/evidencias |
| Forecast/pricing avanzado | Modelos clasicos primero; secuenciales despues | Evita complejidad prematura |

## Proximos cambios tecnicos recomendados

### Base de datos

- Activar `pgvector`.
- Crear tablas de embeddings y jobs.
- Crear tablas de prompt templates/versiones.
- Crear tablas de evals.
- Validar `0004_ai_foundation.sql` con Supabase CLI cuando este disponible.

### Backend

- Crear `apps/web/src/lib/ai`.
- Crear `trackOperationalEvent`.
- Crear helpers `createModelPrediction` y `recordAiFeedback`.
- Crear endpoints internos con rate limit.
- Usar mocks para tests de IA en CI.

### Frontend

- Inbox con badges IA.
- Panel de resumen.
- Borrador editable.
- Botones: aceptar, editar, rechazar.
- Explicacion visible de cada recomendacion.

### Calidad

- Dataset anonimo de evaluacion.
- Tests de schemas.
- Snapshots de salidas estructuradas.
- Auditoria de coste y latencia.
- Conexion con `QUALITY_AND_AUDIT_STRATEGY.md` para auditor visual/funcional.

## Decision

La prioridad no es tener "IA" como etiqueta. La prioridad es que WIAHost aprenda de cada reserva, mensaje, limpieza, incidencia y precio. Si instrumentamos bien desde el MVP, cada modulo futuro sera mas facil, mas barato y mas fiable.

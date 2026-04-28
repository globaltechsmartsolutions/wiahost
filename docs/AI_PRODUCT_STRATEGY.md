# Estrategia de producto IA para WIAHost

## Idea central

La IA de WIAHost no debe venderse como un adorno. Debe venderse como una capa operativa que reduce trabajo manual, anticipa bloqueos y ayuda al equipo a decidir mejor.

Mensaje recomendado:

> WIAHost automatiza la operacion diaria, reduce tiempos de respuesta y ayuda a prevenir incidencias antes de que afecten al huesped o al propietario.

Evitar:

- "Tenemos IA".
- "La IA decide por ti".
- "Detectamos huespedes problematicos".
- "Automatizamos todo sin supervision".

Usar:

- "Centro de mando operativo asistido por IA".
- "El PMS que anticipa bloqueos".
- "Automatizacion inteligente con control humano".
- "Menos tiempo respondiendo, mas control sobre la operacion".

## Los 5 modulos IA que si diferencian

### 1. Inbox inteligente

Impacto:

- Muy alto.
- Es el modulo mas rapido de convertir en valor visible.
- Reduce tiempo de respuesta y mejora experiencia del huesped.

Capacidades:

- Clasificar urgencia: check-in hoy, queja, dano, acceso, ruido, spam, consulta normal.
- Detectar idioma y canal.
- Resumir hilos largos en 2-3 puntos.
- Sugerir respuesta contextual por canal.
- Preparar respuestas para FAQs: horarios, parking, wifi, normas, check-in.

Primera version recomendable:

- Reglas + labels humanos + plantillas.
- No auto-enviar respuestas sensibles.
- Mostrar explicacion: "prioridad alta porque el check-in es hoy y el mensaje menciona acceso".

Datos necesarios:

- Conversaciones.
- Mensajes.
- Canal.
- Reserva asociada.
- Check-in/check-out.
- Tiempo desde ultimo mensaje.
- Label humano.
- Respuesta aprobada/editada/rechazada.

Tablas ya preparadas:

- `message_labels`
- `model_predictions`
- `ai_audit_log`
- `operational_events`

### 2. Automatizaciones con IA

Impacto:

- Muy alto.
- Puede ser el killer feature si se hace bien.

La diferencia frente a reglas simples:

- Las reglas clasicas dicen: "si pasa X, haz Y".
- La automatizacion inteligente evalua contexto: reserva, canal, timing, mensajes previos, incidencias, propiedad y perfil operativo.

Ejemplos:

- Si el huesped llega tarde y no ha recibido instrucciones, sugerir envio de instrucciones y fallback.
- Si hay mensajes con senales de fiesta o ruido, sugerir alerta preventiva y revisar deposito/normas.
- Si el huesped es repetidor o VIP, sugerir tono mas cuidado o detalle operativo.
- Si hay check-in cercano y limpieza no completada, escalar prioridad.

Primera version recomendable:

- Motor de "next best action" basado en reglas explicables.
- Cola prioritaria en dashboard.
- Acciones sugeridas, no automaticas.
- Registro de si el operador acepta, edita o ignora.

Datos necesarios:

- Eventos operativos.
- Reservas.
- Tareas.
- Incidencias.
- Mensajes.
- Resultados de acciones.

Tablas ya preparadas:

- `operational_events`
- `task_outcomes`
- `model_predictions`
- `quality_audit_memories`

### 3. Operaciones: limpieza y mantenimiento

Impacto:

- Muy alto para gestores de varios activos.
- Es donde muchos PMS se quedan cortos.

Capacidades:

- Priorizar tareas automaticamente.
- Predecir retrasos de limpieza.
- Score de calidad por equipo o cleaner.
- Checklist inteligente segun propiedad/reserva.
- Deteccion futura en fotos: cama mal hecha, faltan toallas, dano visible, estancia no preparada.

Primera version recomendable:

- Checklist y fotos/evidencias.
- Score manual de calidad.
- Prediccion simple de riesgo de retraso por hora, propiedad, cleaner y carga de trabajo.
- Alertas si hay check-in cercano y tarea sin completar.

Datos necesarios:

- Tareas.
- Responsable.
- SLA.
- Hora prevista.
- Hora real.
- Fotos/evidencias.
- Comentarios.
- Reaperturas o quejas posteriores.

Tablas ya preparadas:

- `tasks`
- `task_outcomes`
- `documents`
- `incident_features`
- `model_predictions`

### 4. Revenue inteligente

Impacto:

- Alto, pero debe entrar con cuidado.
- Conviene empezar como advisor, no como motor autonomo.

Capacidades:

- Alertas de fechas con precio bajo.
- Sugerencia de minimo de noches.
- Lectura de demanda, lead time, ocupacion y pickup.
- Comparacion entre precio actual, precio sugerido y precio final.
- Recomendaciones explicables: "subir fin de semana por alta ocupacion y baja disponibilidad".

Primera version recomendable:

- Advisor interno con reglas y analitica.
- Integracion futura con herramientas externas de pricing cuando aporte valor.
- No modificar precios automaticamente al principio.

Datos necesarios:

- Precios por noche.
- Ocupacion.
- Lead time.
- Canal.
- Conversion.
- Cancelaciones.
- Precio sugerido, aprobado y final.

Tablas ya preparadas:

- `reservation_snapshots`
- `pricing_observations`
- `model_predictions`
- `operational_events`

### 5. Riesgo e incidencias

Impacto:

- Muy alto para proteger activos.
- Debe plantearse de forma responsable.

Importante:

- No hablaremos de "huesped problematico" como etiqueta personal.
- Hablaremos de "riesgo operativo de reserva" basado en senales observables y no sensibles.
- Nunca usar nacionalidad, edad, genero, origen, religion, discapacidad, estado familiar ni atributos protegidos.

Capacidades:

- Clasificar incidencias.
- Estimar coste probable.
- Detectar recurrencia por propiedad o activo.
- Alertar por incoherencias operativas: check-in cercano sin pago, mensajes contradictorios, falta de deposito, alta actividad anomala.
- Sugerir acciones preventivas: pedir confirmacion, revisar normas, escalar a operador.

Primera version recomendable:

- Clasificacion manual asistida.
- Reglas de riesgo operativo.
- Explicacion visible.
- Registro de resultado real.

Datos necesarios:

- Incidencias.
- Reservas.
- Conversaciones.
- Pagos.
- Depositos.
- Tareas vinculadas.
- Resultado final.

Tablas ya preparadas:

- `incidents`
- `incident_features`
- `payments`
- `message_labels`
- `model_predictions`

## Priorizacion recomendada

### Fase IA 0: base ya incluida

Estado:

- Migracion `0004_ai_foundation.sql` creada.
- Validadores compartidos creados.
- Documentacion tecnica creada.

Objetivo:

- Guardar datos utiles desde el MVP.
- No activar IA real todavia.

### Fase IA 1: Inbox inteligente sin LLM complejo

Objetivo:

- Impacto visible rapido.

Entregables:

- Etiquetas manuales de mensajes.
- Reglas de urgencia.
- Resumen simple de hilo.
- Sugerencia de respuesta por plantilla.
- Registro de feedback del operador.

### Fase IA 2: Cola prioritaria y next best action

Objetivo:

- Convertir el dashboard en un centro de mando real.

Entregables:

- Acciones sugeridas.
- Ranking por urgencia operativa.
- Explicacion de cada prioridad.
- Feedback: aceptada, editada, ignorada o rechazada.

### Fase IA 3: Operaciones inteligentes

Objetivo:

- Diferenciar WIAHost en limpieza/mantenimiento.

Entregables:

- SLA de tareas.
- Prediccion simple de retrasos.
- Score de calidad.
- Evidencias/fotos.
- Incidencias recurrentes.

### Fase IA 4: Revenue advisor

Objetivo:

- Ayudar a ganar mas sin tocar precios automaticamente.

Entregables:

- Alertas de oportunidad.
- Recomendacion de precio/minimo noches.
- Comparacion historica.
- Aprobacion humana.

### Fase IA 5: Multimodal y modelos avanzados

Objetivo:

- Usar fotos, documentos, audios y modelos secuenciales cuando haya datos suficientes.

Entregables:

- Transcripcion de notas de voz.
- Analisis de fotos de incidencias.
- Auditor visual interno.
- Forecast de ocupacion.
- Copiloto operativo.

## Posicionamiento comercial

Frase corta:

> El PMS que anticipa la operacion antes de que se convierta en problema.

Frase para landing:

> Centraliza reservas, mensajes, limpiezas e incidencias en un centro de mando asistido por IA, pensado para responder mas rapido, proteger activos y operar mas propiedades con menos caos.

Frase para propietarios:

> Mas visibilidad, menos incidencias y una operacion mas controlada para cada activo.

Frase para property managers:

> Automatiza respuestas, prioriza tareas criticas y detecta riesgos operativos sin perder el control humano.

Frase para equipo operativo:

> Cada manana sabes que responder, que limpiar, que revisar y que puede bloquear un check-in.

## Principios de seguridad y confianza

- La IA sugiere, el operador decide.
- Cada recomendacion debe explicar por que aparece.
- Cada decision automatizada debe tener trazabilidad.
- No se usan atributos protegidos.
- No se etiquetan personas de forma discriminatoria.
- Las respuestas sensibles no se envian sin aprobacion.
- Las predicciones se miden contra resultados reales.
- Los modelos deben tener rollback.

## Decision final

La propuesta de los cinco modulos es correcta y deberia orientar el producto. La ejecucion profesional es:

1. Construir primero el PMS web solido.
2. Guardar datos y feedback desde el MVP.
3. Activar primero Inbox inteligente y cola prioritaria.
4. Despues operaciones, riesgo e incidencias.
5. Revenue como advisor.
6. Modelos avanzados solo cuando tengamos historico suficiente.

Esta estrategia nos permite vender IA de forma potente sin caer en humo: no prometemos magia, prometemos menos caos operativo y mas control.

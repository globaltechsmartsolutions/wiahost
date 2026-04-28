# Machine Learning opportunities from MIAX supervised and unsupervised notes

## Fuente revisada

Apuntes locales revisados:

```text
C:\Users\aleja\OneDrive\Documents\MASTER\Módulo 3. Inteligencia Artificial Básica\Machine Learning Supervisado y No Supervisado\MIAX14 - ML\MIAX14\MachineLearning
```

Material relevante encontrado:

- Data preprocessing.
- Evaluation metrics.
- Linear and logistic regression.
- KNN.
- Decision trees.
- Random Forest and classification.
- Feature selection.
- PCA and dimensionality reduction.
- Embeddings de texto.
- K-Means.
- Hierarchical clustering.
- DBSCAN and MeanShift.
- Clustering metrics.

## Idea principal

Los apuntes encajan muy bien con WIAHost, pero no para meter IA de golpe. Lo correcto es construir primero datos limpios, eventos historicos y feedback humano. Despues podemos introducir modelos pequeños, medibles y explicables.

La prioridad debe ser:

1. Capturar datos operativos fiables.
2. Crear features de negocio.
3. Medir con metricas correctas.
4. Usar modelos simples primero.
5. Mantener decisiones humanas en flujos sensibles.

## Lecciones de los apuntes aplicadas a WIAHost

### Data preprocessing

Uso para WIAHost:

- Normalizar datos de reservas importadas desde Airbnb, Booking, web directa o carga manual.
- Corregir fechas, importes, estados y canales inconsistentes.
- Detectar outliers en precios, estancias, fees y payouts.
- Imputar datos faltantes con contexto local, por ejemplo por propiedad, canal o temporada.
- Evitar leakage temporal al entrenar modelos de ocupacion, precio o cancelacion.

Regla clave para el producto:

- Una prediccion hecha hoy solo puede usar informacion disponible hasta hoy.
- Los datos futuros pueden servir como etiqueta historica, pero nunca como feature.

### Evaluation metrics

Uso para WIAHost:

- Pricing y revenue: MAE, RMSE y MAPE.
- Riesgo de cancelacion/no-show: precision, recall, F1 y matriz de confusion.
- Priorizacion de inbox/tareas: Precision@k y Recall@k.
- Clustering de propiedades o huespedes: silhouette, Davies-Bouldin, Calinski-Harabasz y validacion de negocio.

Regla clave:

- No optimizar solo accuracy.
- Elegir metrica segun coste real del error.

Ejemplo:

- Si el sistema marca demasiados mensajes como urgentes, genera ruido operativo.
- Si deja pasar mensajes urgentes, rompe el SLA.
- Por eso hay que ajustar umbrales y medir precision/recall.

### Feature engineering

Variables utiles para WIAHost:

- `occupancy_rate_7d`, `occupancy_rate_30d`, `occupancy_rate_90d`.
- `average_daily_rate`.
- `revpar`.
- `days_until_checkin`.
- `booking_window_days`.
- `message_response_time_minutes`.
- `cleaning_delay_minutes`.
- `incident_count_30d`.
- `maintenance_cost_90d`.
- `channel_share_airbnb`, `channel_share_booking`, `channel_share_direct`.
- `cancellation_rate_by_channel`.
- `owner_margin_rate`.
- `season`, `weekday`, `month`, `holiday_flag`.

Estas features valen mas que meter datos brutos sin pensar.

## Casos de uso supervisados

### 1. Prediccion de precio recomendado

Tipo:

- Regresion.

Objetivo:

- Sugerir precio por noche o rango de precio para una fecha.

Features:

- Ciudad.
- Propiedad.
- Temporada.
- Dia de la semana.
- Ocupacion futura.
- Booking window.
- Canal.
- Historico de ADR.
- Eventos o festivos cuando existan.

Target:

- Precio final aceptado o revenue conseguido.

Metricas:

- MAE.
- RMSE.
- MAPE.

Modelo inicial recomendado:

- Regresion lineal regularizada o Random Forest Regressor.

Importante:

- No automatizar cambios de precio al principio.
- Mostrar sugerencia y explicacion al operador.

### 2. Riesgo de cancelacion o no-show

Tipo:

- Clasificacion binaria.

Objetivo:

- Avisar reservas con mayor probabilidad de cancelacion/no-show.

Features:

- Canal.
- Antelacion de reserva.
- Duracion de estancia.
- Pais/mercado solo si legalmente procede y no introduce sesgos indebidos.
- Politica de cancelacion.
- Precio relativo.
- Historial de cancelaciones por canal.
- Numero de mensajes previos.

Target:

- `cancelled` o `no_show`.

Metricas:

- Recall si queremos no dejar escapar riesgos.
- Precision si queremos no llenar la cola de falsas alertas.
- F1 como equilibrio.

Modelo inicial recomendado:

- Logistic Regression o Random Forest.

### 3. Prioridad de mensajes del inbox

Tipo:

- Clasificacion multiclase o multilabel.

Objetivo:

- Clasificar mensajes en categorias:
  - check-in.
  - mantenimiento.
  - pago.
  - queja.
  - cancelacion.
  - pregunta comercial.
  - urgencia.

Features:

- Texto del mensaje.
- Canal.
- Tiempo hasta check-in.
- Estado de reserva.
- Historial de la conversacion.

Target:

- Etiqueta asignada por operadores.

Metricas:

- Precision/recall por clase.
- F1 macro si hay clases desbalanceadas.
- Precision@k si se sugieren varias etiquetas.

Modelo inicial recomendado:

- Primero reglas y keywords.
- Despues embeddings + clasificador ligero.
- Mas adelante LLM para sugerir respuesta, con revision humana.

### 4. Riesgo de incumplimiento de SLA

Tipo:

- Clasificacion binaria.

Objetivo:

- Predecir si una conversacion, tarea o incidencia va a romper SLA.

Features:

- Edad de la tarea.
- Prioridad.
- Canal.
- Equipo asignado.
- Hora del dia.
- Dia de la semana.
- Carga operativa actual.
- Tiempo medio historico de respuesta.

Target:

- `sla_breached`.

Metricas:

- Recall para no dejar escapar incumplimientos.
- Precision para evitar alarmas excesivas.

### 5. Prediccion de coste de incidencia

Tipo:

- Regresion o clasificacion por tramos.

Objetivo:

- Estimar coste probable de una incidencia antes de cerrarla.

Features:

- Tipo de incidencia.
- Propiedad.
- Antiguedad del activo.
- Texto descriptivo.
- Severidad inicial.
- Historial de mantenimiento.

Target:

- Coste final o tramo de coste.

Metricas:

- MAE para euros.
- Matriz de confusion si se usan tramos: bajo, medio, alto, critico.

### 6. Ranking de proximas mejores acciones

Tipo:

- Ranking / clasificacion.

Objetivo:

- Ordenar la cola operativa: que mirar primero.

Features:

- Urgencia temporal.
- Impacto economico.
- Riesgo de mala experiencia.
- SLA.
- Canal.
- Estado de reserva.

Metricas:

- Precision@k.
- Recall@k.
- Tasa de acciones aceptadas por operador.

Modelo inicial recomendado:

- Score manual explicable.
- Despues learning-to-rank cuando haya historico.

## Casos de uso no supervisados

### 1. Segmentacion de propiedades

Algoritmos:

- K-Means.
- Clustering jerarquico.

Objetivo:

- Agrupar propiedades similares para comparar rendimiento justo.

Features:

- ADR.
- Ocupacion.
- RevPAR.
- Ciudad.
- Dormitorios.
- Capacidad.
- Canal principal.
- Incidencias por estancia.
- Coste de limpieza.

Uso en producto:

- Benchmark por cluster.
- Detectar propiedades por debajo de su grupo.
- Sugerir reglas de precio o mantenimiento.

Precaucion:

- Escalar variables antes de K-Means.
- No quedarse solo con silhouette. Validar con sentido de negocio.

### 2. Segmentacion de huespedes/reservas

Algoritmos:

- K-Means.
- Hierarchical clustering.

Objetivo:

- Entender tipos de reserva:
  - escapada corta.
  - larga estancia.
  - familia.
  - business.
  - ultima hora.
  - alta sensibilidad al precio.

Uso en producto:

- Plantillas de mensaje por segmento.
- Reglas de check-in.
- Upsells futuros.
- Ofertas directas.

### 3. Deteccion de anomalías operativas

Algoritmos:

- DBSCAN.
- Isolation-style approach futuro.
- Reglas estadisticas iniciales.

Objetivo:

- Detectar cosas raras sin etiqueta previa.

Ejemplos:

- Precio demasiado bajo para fecha/cluster.
- Reserva muy larga o muy corta fuera de patron.
- Limpieza con duracion anomala.
- Incidencia repetida en la misma propiedad.
- Payout fuera de rango.
- Canal con caida brusca de conversion.
- Mensaje con tiempo de espera anormal.

Por que DBSCAN encaja:

- No obliga a meter todos los puntos en un cluster.
- Permite marcar puntos como ruido.
- Es util para outliers.

### 4. PCA para portfolio health

Algoritmo:

- PCA.

Objetivo:

- Reducir muchas metricas operativas a 2-3 ejes para visualizar salud del portfolio.

Uso en producto:

- Mapa de propiedades.
- Deteccion visual de propiedades alejadas del comportamiento normal.
- Panel ejecutivo: rendimiento, riesgo y operacion.

Precaucion:

- PCA ayuda a visualizar y comprimir, pero no siempre es interpretable.
- Hay que acompanar con explicaciones de features originales.

### 5. Embeddings de texto

Tecnica:

- Convertir texto en vectores.
- Medir similitud semantica.

Aplicaciones:

- Busqueda semantica en inbox.
- Buscar incidencias parecidas.
- Sugerir plantillas de respuesta.
- Agrupar quejas repetidas.
- Detectar mensajes similares a casos criticos.
- Base futura para chatbot interno.

Primera version:

- Guardar embeddings de mensajes e incidencias.
- Buscar por similitud.
- No generar respuestas automaticas sin revision.

## Datos que deberiamos empezar a guardar desde ya

Para que la IA futura sea buena, hay que guardar bien el historico.

Tablas o campos recomendados:

- `events`: acciones del usuario y del sistema.
- `message_labels`: etiquetas humanas de mensajes.
- `task_outcomes`: resultado real de tareas.
- `reservation_risk_feedback`: si una alerta fue util o no.
- `pricing_recommendations`: sugerencia, precio aceptado, precio final y resultado.
- `model_predictions`: predicciones historicas con version de modelo.
- `feature_snapshots`: features usadas en cada prediccion.
- `audit_decisions`: decisiones humanas sobre recomendaciones.

Sin esto, la IA sera humo bonito. Con esto, empieza a ser producto.

## Arquitectura recomendada futura

### Fase 1: reglas explicables

- Scores manuales.
- Reglas de SLA.
- Deteccion simple de outliers.
- Etiquetado manual de mensajes.

Ventaja:

- Rápido, explicable y barato.

### Fase 2: dataset y notebooks

- Exportar datos desde Supabase.
- Entrenar modelos offline con Python/scikit-learn.
- Validar metricas.
- Comparar modelos simples.

### Fase 3: servicio ML

Opciones:

- `apps/ml-worker` en Python para jobs programados.
- Supabase Edge Functions para tareas ligeras.
- Vercel cron para inferencias simples.

Recomendacion:

- Mantener entrenamiento fuera de Next.js.
- Mantener inferencia ligera en API si el modelo es pequeno.
- Guardar toda prediccion con version y explicacion.

### Fase 4: IA generativa

Uso:

- Resumir conversaciones.
- Generar borradores de respuesta.
- Explicar riesgos.
- Auditor visual/funcional.
- Asistente interno de operaciones.

Regla:

- La IA generativa ayuda, no decide sola.

## Riesgos y limites

### Leakage

Riesgo alto en:

- pricing.
- cancelaciones.
- ocupacion.
- SLA.

Solucion:

- Validacion temporal.
- Features calculadas solo con informacion disponible antes de la prediccion.

### Sesgos

No usar:

- edad.
- genero.
- nacionalidad.
- origen.
- religion.
- discapacidad.
- estado familiar.
- atributos protegidos.

Aplicacion:

- Especialmente importante si volvemos a funcionalidades de candidatos/inquilinos.
- En WIAHost, cuidado con datos de huespedes y mercados para no introducir discriminacion indirecta.

### Automatizacion peligrosa

No hacer en primeras fases:

- Rechazar reservas automaticamente.
- Penalizar propietarios automaticamente.
- Cambiar precios automaticamente sin control.
- Enviar respuestas sensibles sin revision.

## Prioridad recomendada

### Corto plazo

1. Etiquetado manual de mensajes.
2. Reglas de prioridad de inbox.
3. Deteccion simple de anomalias.
4. Registro de eventos y outcomes.

### Medio plazo

1. Clasificador de mensajes.
2. Riesgo de SLA.
3. Segmentacion de propiedades.
4. Busqueda semantica de incidencias/mensajes.

### Largo plazo

1. Pricing recomendado.
2. Prediccion de cancelacion/no-show.
3. Ranking inteligente de acciones.
4. Copiloto operativo con explicaciones.

## Decision para WIAHost

Si metemos IA, la linea buena es:

- IA operativa.
- Explicable.
- Basada en historico real.
- Con feedback humano.
- Con tests y metricas.
- Sin decisiones automaticas sensibles.

Los apuntes son especialmente utiles para montar bien la base: limpiar datos, crear features, evitar leakage, evaluar bien, segmentar con clustering y detectar anomalias. Esa base vale mas que meter un modelo grande demasiado pronto.

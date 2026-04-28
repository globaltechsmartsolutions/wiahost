# Neural networks and RNN opportunities from MIAX notes

## Fuente revisada

Apuntes locales revisados:

```text
C:\Users\aleja\OneDrive\Documents\MASTER\Módulo 3. Inteligencia Artificial Básica\Redes neuronales-RNN
```

Archivos principales:

- `apuntes_clase_1.md`
- `apuntes_clase_2.md`
- `apuntes_clase_3.md`
- `apuntes_clase_4.md`
- `apuntes_clase_5.md`

Temas relevantes encontrados:

- Fundamentos de redes neuronales.
- Datos, modelo, funcion de coste y aprendizaje.
- Backpropagation y descenso por gradiente.
- Mini-batches, learning rate, inicializacion y optimizadores.
- Regularizacion, dropout, batch normalization y early stopping.
- Baselines y lectura de curvas de aprendizaje.
- Ventanas de entrada/salida para series temporales.
- RNN, LSTM, GRU y Transformers.
- Secuencias de texto, series temporales y temperatura en generacion.

## Idea principal

Las redes neuronales pueden ser muy utiles para WIAHost, pero no deberian ser la primera capa de IA. Primero conviene usar reglas, estadistica, modelos clasicos y buenos datos. Despues, cuando haya historico suficiente, las redes pueden aportar valor en problemas secuenciales:

- conversaciones.
- series de ocupacion/precio.
- tareas operativas.
- incidencias repetidas.
- patron temporal de reservas.

La leccion central de los apuntes es clara:

- sin buenos datos, la red no aprende magia.
- sin baseline, no sabes si la red mejora algo.
- sin validacion temporal, puedes estar haciendo leakage.
- sin curvas de aprendizaje, entrenas a ciegas.

## Lecciones aplicadas a WIAHost

### 1. Datos, modelo, coste y aprendizaje

Para cualquier IA futura debemos definir:

- datos de entrada.
- salida que queremos predecir.
- funcion de coste.
- metrica de negocio.
- proceso de entrenamiento.

Ejemplo WIAHost:

- entrada: ultimos mensajes, estado de reserva, tiempo hasta check-in.
- salida: prioridad operativa del hilo.
- coste: cross entropy o error de clasificacion.
- metrica de negocio: menos SLA rotos y menos falsas urgencias.

### 2. Funcion de coste

La funcion de coste define lo que el modelo aprende.

Aplicacion:

- Si optimizamos solo "acertar etiqueta", puede ignorar errores operativamente caros.
- Si queremos no dejar escapar urgencias, debemos ponderar mas falsos negativos.
- Si queremos evitar ruido, debemos vigilar precision.

Decision:

- Para modelos sensibles, guardar siempre metrica tecnica y metrica de negocio.

### 3. Baselines obligatorios

Antes de una red, siempre una referencia simple.

Baselines utiles para WIAHost:

- SLA: priorizar por tiempo restante.
- Pricing: repetir precio medio de la propiedad por dia de semana.
- Ocupacion: media movil de ultimos 30/90 dias.
- Inbox: reglas por palabras clave y tiempo hasta check-in.
- Incidencias: severidad manual inicial.

Regla:

- No se acepta un modelo neuronal si no supera un baseline simple en test realista.

### 4. Ventanas temporales

Los apuntes insisten en ventanas de entrada y salida.

Aplicacion a WIAHost:

- entrada de 7 dias para predecir ocupacion de 1 dia.
- entrada de 30 dias para predecir ocupacion de 7 dias.
- entrada de 90 dias para tendencias de revenue.
- ultimos N mensajes para clasificar siguiente mejor accion.
- ultimas N incidencias para detectar riesgo de mantenimiento.

Importante:

- Las ventanas no deben usar futuro.
- Las particiones deben respetar tiempo.
- Comparar modelos con ventanas equivalentes.

### 5. Curvas de aprendizaje

Las curvas no son decoracion. Sirven para decidir que tocar.

Lecturas practicas:

- Train baja y validation sube: sobreajuste.
- Ambas planas: datos, arquitectura o learning rate fallan.
- Curvas muy ruidosas: batch pequeno, validation pequena o learning rate alto.
- Validation mucho mejor que train: particion rara, regularizacion excesiva o entrenamiento artificialmente dificil.

Uso en WIAHost:

- Cada experimento ML debe guardar curvas.
- Cada modelo debe tener reporte de entrenamiento.
- No promocionar modelos sin revisar curvas.

### 6. Regularizacion

Regularizar ayuda a generalizar.

Tecnicas aplicables:

- dropout.
- penalizacion de pesos.
- early stopping.
- batch normalization cuando proceda.
- reducir tamano del modelo.

Regla:

- Para WIAHost, preferimos modelos pequenos, estables y explicables antes que redes grandes dificiles de controlar.

### 7. Normalizacion

Los apuntes remarcan que LSTM y modelos neuronales necesitan escalado.

Aplicacion:

- precios.
- duraciones.
- revenue.
- costes.
- tiempos de respuesta.
- ocupacion.

Regla:

- Guardar el scaler usado con version de modelo.
- Ajustar scaler solo con train.
- Aplicar el mismo scaler a validation/test/inferencia.

### 8. RNN, LSTM y GRU

Las recurrentes sirven cuando el orden importa.

Casos WIAHost:

- secuencia de mensajes de una conversacion.
- evolucion diaria de ocupacion.
- patron de precios por propiedad.
- serie de incidencias por activo.
- tareas antes y despues de check-in.

LSTM:

- mas capacidad para memorias largas.
- util si hay dependencias temporales largas.

GRU:

- mas ligera.
- menos parametros.
- buena candidata inicial si hay pocos datos.

Decision:

- Si usamos recurrentes, empezar con GRU pequena y baseline fuerte.
- Probar LSTM solo si GRU o modelos clasicos se quedan cortos.

### 9. Transformers

Los apuntes explican que los modelos de lenguaje modernos usan Transformers, aunque RNN siga siendo buena base conceptual.

Uso futuro:

- resumen de conversaciones.
- sugerencia de respuestas.
- clasificacion semantica de mensajes.
- auditor interno de operaciones.
- extraccion de entidades: hora llegada, problema, importe, canal, reserva.

Decision:

- Para lenguaje natural, probablemente sera mas eficiente usar un modelo preentrenado que entrenar una RNN desde cero.
- La RNN sirve para entender secuencias y para casos pequenos/propios.

### 10. Temperatura y generacion

La temperatura controla cuanta variedad tiene una generacion.

Aplicacion:

- respuestas automaticas o borradores de mensajes.
- temperatura baja para mensajes operativos sensibles.
- temperatura algo mayor para marketing o copies de anuncios.

Regla:

- No enviar respuestas sensibles sin revision humana.
- Guardar prompt, salida, usuario que aprueba y version del modelo.

## Casos de uso con redes neuronales

### 1. Clasificador secuencial de conversaciones

Objetivo:

- Clasificar una conversacion segun prioridad y tipo.

Entrada:

- ultimos mensajes.
- canal.
- estado de reserva.
- tiempo hasta check-in.
- historial de SLA.

Salida:

- urgencia.
- categoria.
- proxima accion sugerida.

Modelo inicial:

- reglas + embeddings + clasificador clasico.

Modelo futuro:

- Transformer preentrenado o GRU/LSTM sobre embeddings.

Metricas:

- F1 macro.
- recall de urgencias.
- precision de urgencias.
- tasa de aceptacion por operador.

### 2. Prediccion de ocupacion temporal

Objetivo:

- Predecir ocupacion futura por propiedad o cluster.

Entrada:

- ocupacion historica.
- precio historico.
- canal.
- dia de semana.
- temporada.
- eventos/festivos cuando existan.

Salida:

- ocupacion esperada proximos 1, 7 o 30 dias.

Baseline:

- media movil por propiedad y dia de semana.

Modelo futuro:

- GRU/LSTM pequena.
- red densa con features agregadas.
- modelo clasico si supera a la red.

Metricas:

- MAE.
- RMSE.
- error por propiedad y cluster.

### 3. Pricing secuencial

Objetivo:

- Recomendar precio teniendo en cuenta historico reciente.

Entrada:

- serie de precios.
- ocupacion.
- booking pace.
- pick-up ultimos dias.
- lead time.
- estacionalidad.

Salida:

- precio sugerido o delta de precio.

Baseline:

- precio medio por propiedad, temporada y dia de semana.

Modelo futuro:

- red densa o GRU, pero solo cuando haya muchos datos.

Regla:

- No aplicar precio automaticamente al principio.
- El operador aprueba.

### 4. Deteccion temprana de incidencias recurrentes

Objetivo:

- Detectar si una propiedad empieza a mostrar patron de problema.

Entrada:

- secuencia de incidencias.
- tareas de mantenimiento.
- comentarios de huespedes.
- coste.
- tiempo entre incidencias.

Salida:

- riesgo de incidencia repetida.

Baseline:

- reglas por recencia y frecuencia.

Modelo futuro:

- GRU pequena si el historico crece.
- Transformer/embeddings para texto de incidencias.

### 5. Copiloto de operaciones

Objetivo:

- Ayudar al operador a entender que pasa y que hacer.

Capacidades:

- resumir hilo.
- extraer entidades.
- sugerir respuesta.
- priorizar cola.
- explicar por que algo es urgente.

Modelo:

- LLM preentrenado.
- RAG con datos internos.
- reglas de seguridad.

Regla:

- El copiloto propone, el operador decide.

### 6. Auditor visual y funcional inteligente

Conexion con los apuntes:

- Las redes/Transformers pueden revisar secuencias de cambios, capturas y resultados.
- La memoria debe vivir en el repo.
- La salida debe ser estructurada y verificable.

Uso:

- analizar screenshots.
- comparar con reglas visuales.
- revisar diffs.
- recordar regresiones anteriores.

Importante:

- La IA audita, pero los gates reales son tests deterministas.

## Datos que debemos guardar para habilitar redes futuras

### Conversaciones

- mensajes ordenados.
- canal.
- timestamps.
- usuario/rol.
- reserva asociada.
- etiquetas manuales.
- prioridad asignada.
- resolucion final.
- si la sugerencia fue aceptada.

### Operacion

- tareas creadas.
- cambios de estado.
- responsable.
- SLA esperado.
- SLA real.
- retrasos.
- causa final si se conoce.

### Revenue

- precio sugerido.
- precio aprobado.
- precio final.
- canal.
- conversion.
- ocupacion resultante.
- cancelaciones.

### Incidencias

- titulo.
- descripcion.
- severidad inicial.
- severidad final.
- coste estimado.
- coste real.
- propiedad.
- reserva.
- tiempo de resolucion.

### Auditoria de IA

- modelo.
- version.
- prompt/input.
- output.
- decision humana.
- feedback.
- fecha.

## Arquitectura recomendada

### No entrenar redes dentro de Next.js

Next.js debe servir producto web, no entrenar modelos pesados.

Arquitectura futura:

```text
Supabase Postgres
  -> export datasets
  -> notebooks / ml-worker Python
  -> model registry
  -> inference API / jobs
  -> WIAHost web
```

### Fases

#### Fase 1: datos y reglas

- event tracking.
- labels manuales.
- reglas explicables.
- baselines.

#### Fase 2: modelos clasicos

- logistic regression.
- random forest.
- gradient boosting.
- embeddings + clasificador.

#### Fase 3: secuencias

- GRU/LSTM para series temporales concretas.
- modelos pequenos.
- validacion temporal estricta.

#### Fase 4: generativa

- LLM para resumen, borradores y auditoria.
- RAG con datos internos.
- aprobacion humana.

## Criterios de seguridad

No debemos:

- automatizar decisiones sensibles sin humano.
- entrenar con datos futuros.
- mezclar train/test en series temporales.
- usar atributos protegidos.
- guardar prompts con secretos.
- enviar mensajes automaticos sensibles sin revision.

Debemos:

- versionar datos, features y modelos.
- guardar predicciones historicas.
- medir contra baseline.
- monitorizar drift.
- permitir explicacion y trazabilidad.

## Prioridad recomendada

### Corto plazo

1. Registrar eventos, labels y outcomes.
2. Crear baselines manuales para SLA, inbox y pricing.
3. Guardar feedback de operadores.
4. Empezar con auditor inteligente no bloqueante.

### Medio plazo

1. Clasificador de mensajes con embeddings.
2. Resumen de conversaciones.
3. Prediccion de SLA con modelos clasicos.
4. Deteccion de anomalias operativas.

### Largo plazo

1. GRU/LSTM para ocupacion y pricing si hay datos suficientes.
2. Copiloto operativo.
3. Ranking inteligente de acciones.
4. Auditor multimodal con memoria.

## Decision para WIAHost

La linea buena es:

- redes solo cuando haya secuencias e historico suficiente.
- baselines antes que redes.
- modelos pequenos antes que modelos grandes.
- validacion temporal obligatoria.
- humano en el bucle.
- trazabilidad completa.

Los apuntes de redes/RNN son utiles para no caer en el clasico error de "metamos una red porque suena potente". En WIAHost lo profesional es construir datos y baselines primero; despues usar GRU/LSTM/Transformers donde realmente aporten ventaja.

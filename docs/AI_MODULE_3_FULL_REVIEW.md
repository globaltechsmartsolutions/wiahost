# Revision completa del Modulo 3 de Inteligencia Artificial

## Alcance

Fuente revisada:

```text
C:\Users\aleja\OneDrive\Documents\MASTER\Modulo 3. Inteligencia Artificial Basica
```

Revision realizada:

- 6 carpetas principales.
- 148 documentos tecnicos extraidos entre PDF, Markdown, notebooks, TXT y scripts Python.
- Datasets, zips, imagenes, audios y ficheros intermedios tratados como material de soporte, no como documentacion principal.
- Los notebooks duplicados entre `src` y `Notebooks_resueltos` se agrupan para no repetir dos veces la misma conclusion.

Documentos previos relacionados:

- `docs/ML_OPPORTUNITIES_FROM_NOTES.md`
- `docs/NEURAL_NETWORKS_OPPORTUNITIES_FROM_NOTES.md`
- `docs/QUALITY_AND_AUDIT_STRATEGY.md`

Implementacion base en el producto:

- `supabase/migrations/0004_ai_foundation.sql`
- `packages/shared/src/validators/ai.ts`

## Conclusion ejecutiva

El modulo aporta mucho, pero la conclusion profesional para WIAHost no es "meter IA ya". La conclusion buena es preparar datos, trazabilidad, labels y baselines desde ahora para que la IA futura sea fiable.

Lo mas aprovechable para WIAHost:

- Auditoria inteligente visual y funcional con memoria.
- Clasificacion y priorizacion de mensajes del inbox.
- Resumen de conversaciones y extraccion de datos operativos.
- Deteccion de anomalias en reservas, precios, tareas e incidencias.
- Segmentacion de propiedades, huespedes, reservas y propietarios con clustering.
- Pricing insights y previsiones de ocupacion con modelos explicables.
- Analisis multimodal de fotos, incidencias, documentos y notas de voz.
- Mapas de dependencias operativas con grafos, sin venderlos como causalidad fuerte hasta validarlos.

Lo que no conviene hacer todavia:

- Entrenar redes neuronales propias sin historico.
- Automatizar decisiones sensibles sin revision humana.
- Usar atributos protegidos o datos personales innecesarios.
- Meter modelos complejos donde una regla o baseline todavia no existe.
- Convertir la IA en una caja negra que decida por operaciones.

## Inventario por carpeta

| Carpeta | Material encontrado | Valor para WIAHost |
| --- | --- | --- |
| `13 marzo. Introduccion Machine Learning. Valero Laparra-20260314` | Intro ML, carga de datos, preprocesado, modelos clasicos, ensembles, PCA y ejemplos multimodales con Hugging Face | Alto para fundacion de datos, IA multimodal e ideas de prototipos |
| `16 de abril, Taller Valero` | Grafos, redes bayesianas, causalidad y notebooks con `pgmpy` | Alto para mapas de dependencias operativas y explicabilidad |
| `Machine Learning Supervisado y No Supervisado` | Preprocesado, metricas, regresion, KNN, arboles, Random Forest, Gradient Boosting, PCA, clustering y anomalias | Muy alto para los primeros modelos reales |
| `Maching Learning Raul Santos` | Explicabilidad, XAI, LIME/SHAP, dependencias, grafos probabilisticos y practica de grafos | Muy alto para decisiones explicables y auditoria |
| `practica_b3_t1` | Preprocesado financiero, barras por eventos, limpieza de series y scripts de datos | Medio-alto para booking pace, revenue y series temporales |
| `Redes neuronales-RNN` | Fundamentos de redes, backpropagation, regularizacion, RNN, GRU, LSTM y Transformers | Alto a largo plazo, no como primera capa |

## Lectura carpeta a carpeta

### 1. Introduccion Machine Learning Valero

Esta carpeta mezcla teoria general, notebooks de modelos clasicos y ejemplos multimodales. Es buena como laboratorio de prototipos.

Ideas utiles:

- Carga de datos desde Hugging Face, Kaggle y GitHub.
- Normalizacion, codificacion y seleccion de features.
- Regresion lineal, descenso por gradiente y funciones de coste.
- Bagging, Random Forest y ensembles.
- PCA para reducir dimensionalidad.
- Whisper para transcripcion de audio.
- VQA, CLIP, SAM y Stable Diffusion como ejemplos multimodales.
- Gemini y RAG como base para copilotos sobre documentacion o transcripciones.

Aplicacion directa:

- Transcribir notas de voz de huespedes o propietarios.
- Clasificar fotos de incidencias.
- Buscar propiedades por texto e imagen con embeddings.
- Auditar fotos de anuncios antes de publicarlas.
- Preparar datasets externos o internos sin acoplarlos al producto.

### 2. Taller Valero de abril

Esta carpeta gira alrededor de grafos, redes bayesianas y estructura de relaciones entre variables.

Ideas utiles:

- Aprendizaje de estructuras con `pgmpy`.
- PC y Hill Climb Search para explorar relaciones.
- Matrices de correlacion y grafos dirigidos.
- Causalidad aplicada con cautela.

Aplicacion directa:

- Mapa de dependencias entre canal, propiedad, precio, ocupacion, incidencias y SLA.
- Analisis de cuellos de botella operativos.
- Explicaciones tipo "esta prioridad sube porque hay check-in cercano, incidencia abierta y retraso de respuesta".

Guardrail:

- En WIAHost debemos hablar de dependencia, asociacion o hipotesis causal, no de causalidad demostrada, salvo validacion fuerte.

### 3. Machine Learning Supervisado y No Supervisado

Es la carpeta mas accionable para la primera IA real. Tiene preprocesado, metricas, modelos supervisados, modelos no supervisados, reduccion de dimensionalidad y clustering.

Ideas utiles:

- Auditoria inicial de datos.
- Train/test split y validacion.
- Cross-validation, metricas y cuidado con leakage.
- Regresion para forecasting o precio.
- Arboles, Random Forest y Gradient Boosting para clasificacion explicable.
- PCA, ICA, LDA, MDS, t-SNE e ISOMAP para reduccion o visualizacion.
- K-Means, clustering jerarquico, DBSCAN y MeanShift.
- Silhouette y metricas de clustering.
- Autoencoder y error de reconstruccion para anomalias.

Aplicacion directa:

- Clasificador de mensajes por urgencia.
- Prediccion de riesgo de SLA roto.
- Agrupacion de propiedades por comportamiento operativo.
- Deteccion de reservas anormales o precios raros.
- Segmentacion de propietarios por tipo de operacion.
- Scoring operativo explicable para cola prioritaria.

### 4. Maching Learning Raul Santos

Esta carpeta es especialmente valiosa porque insiste en explicabilidad, modelos probabilisticos, dependencia y grafos.

Ideas utiles:

- LIME y SHAP para explicar predicciones.
- Surrogate models para hacer interpretables modelos complejos.
- Redes bayesianas y grafos probabilisticos.
- Medidas de dependencia.
- Guias practicas para explicar resultados de forma entendible.

Aplicacion directa:

- Cada recomendacion de IA debe tener una explicacion visible.
- El operador debe ver por que una tarea es urgente.
- El sistema debe guardar input, output, modelo, version y decision humana.
- El auditor inteligente debe explicar que regla o patron detecto.

### 5. Practica B3-T1

Aunque nace de finanzas, contiene una idea muy potente para WIAHost: no todo debe medirse por tiempo cronologico. En operaciones a veces importa mas el volumen de eventos.

Ideas utiles:

- Tick bars, volume bars y dollar bars.
- Representar series por actividad, no solo por reloj.
- Limpieza, estabilizacion y transformacion antes de modelar.
- Scripts reproducibles de descarga, preparacion y generacion de notebooks.

Aplicacion directa:

- Booking pace por numero de eventos, no solo por dia.
- Inbox pace por volumen de mensajes.
- Incident pace por frecuencia de incidencias.
- Revenue pace por movimiento de reservas o cambios de precio.
- Features por "ultimos N eventos" ademas de "ultimos N dias".

### 6. Redes neuronales y RNN

Esta carpeta es importante, pero para fases posteriores. Sirve para entender cuando una red aporta y cuando solo complica.

Ideas utiles:

- Datos, modelo, coste y aprendizaje.
- Backpropagation, learning rate y optimizadores.
- Mini-batches, regularizacion, dropout y early stopping.
- Curvas de aprendizaje.
- Ventanas temporales.
- RNN, GRU, LSTM y Transformers.
- Temperatura en generacion.

Aplicacion directa futura:

- Clasificacion secuencial de conversaciones.
- Prediccion de ocupacion por ventanas temporales.
- Pricing secuencial.
- Deteccion de patrones repetidos en incidencias.
- Copiloto de operaciones con LLM y memoria.

Decision:

- Primero baselines y modelos clasicos.
- Despues embeddings y modelos preentrenados.
- Redes propias solo cuando tengamos datos, labels y evaluacion temporal seria.

## Registro documento por documento

### 13 marzo. Introduccion Machine Learning. Valero Laparra

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `A_Jugar_2026.pdf` | Mapa de herramientas IA: ChatGPT, RAG, NotebookLM, imagen, sonido, Hugging Face, LMStudio, Ollama | Inspiracion para copiloto, RAG documental y prototipos locales |
| `Intro_ML_2026(P).pdf` | Fundamentos de problema, datos, modelo, coste y aprendizaje | Marco base para cualquier feature de IA |
| `DATA_Huggingface.ipynb` | Lectura de datasets desde Hugging Face | Preparar datasets de soporte o benchmarking |
| `DATA_Kaggle_TransferMarkt_precio_vs_altura.ipynb` | Ejemplo Kaggle con relacion precio-variable | Analogias para pricing y analisis exploratorio |
| `DATA_Load_github_and_HF_DDBB_example.ipynb` | Carga desde GitHub y HF | Pipeline inicial de ingesta externa |
| `DATA_Preproc_y_seleccion_Feats.ipynb` | Normalizacion, codificacion y seleccion de variables | Feature engineering para propiedades, reservas y mensajes |
| `LEARNING_Derivadas_en_JAX.ipynb` | Derivadas y descenso por gradiente | Base conceptual, no prioridad producto |
| `LEARNING_Gradient_descent.ipynb` | Aprendizaje desde datos y minimizacion | Base conceptual para entender entrenamiento |
| `LEARNING_ML_my_linear_regresion_by_hand.ipynb` | Regresion lineal manual | Pricing baseline y forecasting simple |
| `MODELS_ANN_cifar100.ipynb` | CNN sobre CIFAR100 | Referencia para vision, no MVP |
| `MODELS_ENSEMBLES_bagging_regresion.ipynb` | Bagging para regresion | Pricing, ocupacion y tiempos de resolucion |
| `MODELS_ENSEMBLES_basic_aggregating.ipynb` | Agregacion de modelos | Combinar senales operativas |
| `MODELS_ENSEMBLES_rf_regresion.ipynb` | Random Forest regresion | Prediccion explicable de costes/SLA/revenue |
| `MODELS_ML_my_linear_regresion.ipynb` | Regresion lineal | Baseline de precio u ocupacion |
| `MODELS_ML_my_linear_regresion_by_hand.ipynb` | Regresion por pasos | Entender y explicar modelos simples |
| `MODELS_PCA.ipynb` | PCA y reduccion de dimensionalidad | Reducir ruido y visualizar clusters |
| `MODELS_S2T_Whisper_HF.ipynb` | Whisper speech-to-text | Transcribir audios de huespedes/equipo |
| `I2M_SAM2.ipynb` | Segmentacion de imagen con SAM 2 | Analisis de fotos de incidencias |
| `I2M_SAM3.ipynb` | Segmentacion de imagen con SAM 3 | Analisis visual futuro |
| `I2T_Qwen_VQA_HF.ipynb` | Visual Question Answering | Preguntar sobre fotos de una vivienda o incidencia |
| `I2V_HF.ipynb` | Generacion de video/imagen | No prioritario; posible marketing futuro |
| `Leer_datos_HF_TID.ipynb` | Lectura de datos HF | Ingesta de datos |
| `S2T_Whisper_HF_cancion_2_srt.ipynb` | Audio a subtitulos | Transcripcion y resumen de reuniones o incidencias |
| `T2I_SD_HF.ipynb` | Stable Diffusion | Marketing visual futuro, no core PMS |
| `T2T_API_Gemini.ipynb` | Transcripcion, resumen y preguntas con Gemini | RAG/copolito sobre conversaciones y docs |
| `TM2I_ControlNet.ipynb` | Texto + condiciones a imagen | Baja prioridad para producto operativo |
| `TTS_Suno_HF.ipynb` | Text-to-speech | Audio asistido futuro |
| `TTS_XTTS_Qwen3_HF.ipynb` | TTS con voz custom | Baja prioridad por privacidad y seguridad |
| `TvI_CLIP_HF.ipynb` | Embeddings texto-imagen con CLIP | Busqueda semantica y auditoria de fotos |

### 16 de abril, Taller Valero

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `Articulo_MLdP_Grafos.pdf` | Relaciones problematicas y grafos | Inspiracion para dependencias operativas |
| `pgmpy_7Stocks_periodos_HC.ipynb` | Structure learning con Hill Climb | Probar estructura de relaciones entre variables PMS |
| `pgmpy_Fama_and_French.ipynb` | Redes bayesianas con factores | Plantilla tecnica para grafos |
| `pgmpy_Fama_and_French_lag.ipynb` | Grafos con desfases temporales | Dependencias con lead time, check-in y SLA |
| `ssrn-5277078.pdf` | Causalidad y factor investing | Criterios de prudencia al hablar de causalidad |
| `Taller_B3_T3.pdf` | Enunciado de taller de causalidad con grafos | Estructura metodologica para experimento interno |
| `Taller_B3_T3_fusion_PC_HC.ipynb` | PC + HillClimbSearch | Comparar estructuras alternativas |
| `transcripcion_clase.txt` | Conversacion de clase | Material de contexto |
| `VALERO_pgmpy_Structure Learning_Bank.ipynb` | Structure learning con datos bancarios | Ejemplo reutilizable de redes bayesianas |

### Machine Learning Supervisado y No Supervisado

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `BME_DI~2(P).PDF` | Teoria de aprendizaje no supervisado, reduccion, clustering y metricas | Base para segmentacion y anomalias |
| `dataset/attrib.txt` | Diccionario de variables financieras | Ejemplo de documentar features |
| `doc/Taller 1.pdf` | Practica de preprocesado y aprendizaje supervisado | Plantilla de experimento supervisado |
| `1_Feature_selection.ipynb` en `src` y `Notebooks_resueltos` | Filter, wrapper y embedded methods | Elegir variables utiles sin ruido |
| `2_Feature_extraction_PCA.ipynb` en `src` y `Notebooks_resueltos` | PCA manual y con sklearn | Reducir dimensionalidad en datos PMS |
| `3_Feature_extraction_other_methods.ipynb` en `src` y `Notebooks_resueltos` | ICA, LDA, MDS, ISOMAP y t-SNE | Visualizacion y exploracion de clusters |
| `4_Embeddings_texto.ipynb` en `src` y `Notebooks_resueltos` | Scraping, embeddings, t-SNE y CLIP | Inbox semantico, busqueda y matching |
| `5_Dimensionality_reduction_anomalias.ipynb` en `src` y `Notebooks_resueltos` | PCA, error de reconstruccion y autoencoder | Deteccion de anomalias operativas |
| `6_Feature_selection_extraction_extra.ipynb` en `src` y `Notebooks_resueltos` | Preparacion y ejercicios de seleccion/extraccion | Pipeline de features |
| `7_Clustering_kmeans.ipynb` en `src` y `Notebooks_resueltos` | K-Means a mano y sklearn | Segmentacion de propiedades/reservas |
| `8_Clustering_hierarchical.ipynb` en `src` y `Notebooks_resueltos` | Clustering jerarquico y dendrogramas | Agrupar propiedades con lectura visual |
| `9_Clustering_dbscan_meanshift.ipynb` en `src` y `Notebooks_resueltos` | DBSCAN y MeanShift | Detectar grupos raros y outliers |
| `10_Clustering_comparativa_metricas.ipynb` en `src` y `Notebooks_resueltos` | Silhouette y evaluacion | Validar clusters antes de usarlos |
| `11_Clustering_extra.ipynb` en `src` y `Notebooks_resueltos` | Clientes, paises y estudiantes | Ejemplos transferibles de segmentacion |
| `slides/Apuntes BME dia27.md` | Resumen de no supervisado | Documento conceptual de referencia |
| `slides/BME_diapositivas_dia27.pdf` | Slides de no supervisado | Apoyo teorico |
| `src/Apuntes 01 Data Preprocessing.md` | Auditoria, tipos, labels, missing values y outliers | Primer paso obligatorio para IA PMS |
| `src/Apuntes 02 Evaluation Metrics.md` | Train/test, cross-validation y metricas | Evitar modelos que aparentan funcionar |
| `src/Apuntes 03 Linear Regression.md` | Regresion lineal y logistica | Baselines explicables |
| `src/Apuntes 04 KNN.md` | K-Nearest Neighbors | Matching simple y clasificacion local |
| `src/Apuntes 05 Decision Trees.md` | Arboles de decision | Reglas aprendidas y explicables |
| `src/Apuntes 07 Classification.md` | Random Forest y Gradient Boosting | Clasificacion de urgencia, riesgo y SLA |
| `src/Apuntes NO SUP 01 Feature selection.md` | Seleccion de variables | Limpieza de features PMS |
| `src/Apuntes NO SUP 02 Feature extraction PCA.md` | PCA y covarianza | Compactar datos de propiedades/reservas |
| `src/Apuntes NO SUP 03 Other feature extraction methods.md` | ICA, LDA, MDS, t-SNE | Exploracion de patrones |
| `src/Apuntes NO SUP 04 Feature selection and extraction extra.md` | Preparacion y split | Buenas practicas de experimento |
| `src/Apuntes NO SUP 05 Clustering KMeans.md` | K-Means y escala | Segmentacion con control de escala |
| `src/Apuntes NO SUP 06 Clustering jerarquico.md` | Clustering jerarquico | Taxonomia de activos/operaciones |
| `src/Apuntes NO SUP 07 DBSCAN MeanShift.md` | Densidad y outliers | Reservas, precios o propiedades raras |
| `src/Apuntes NO SUP 08 Comparativa metricas clustering.md` | Silhouette y metricas | Validar segmentacion |
| `src/Apuntes Workshop 1.md` | Practica completa de fondos y factores | Metodologia transferible |
| `src/Correccion practica.md` | Correcciones metodologicas | Prudencia al interpretar resultados |
| `src/Guia defensa Workshop 1.md` | Como explicar una practica | Como explicar IA a cliente/inversor |
| `src/Masterclass KMeans Practica.md` | Explicacion sencilla de K-Means | Base para clusters explicables |
| `src/MIAX ML - 01 Data Preprocessing.ipynb` | Preprocesado completo | Pipeline inicial de datos |
| `src/MIAX ML - 02 Evaluation Metrics.ipynb` | Estrategias de evaluacion | Evaluacion robusta |
| `src/MIAX ML - 03 Linear Regression.ipynb` | Regresion | Forecasting basico |
| `src/MIAX ML - 04 KNN.ipynb` | KNN | Matching y vecinos similares |
| `src/MIAX ML - 05 DT.ipynb` | Decision trees | Reglas aprendidas |
| `src/MIAX ML - 06 Dimensionality Reduction.ipynb` | Maldicion de dimensionalidad | Control de sobreajuste |
| `src/MIAX ML - 07 Classification.ipynb` | Random Forest y Gradient Boosting | Clasificadores iniciales |
| `src/MIAX ML - 08 Clustering KMeans.ipynb` | K-Means | Segmentacion |
| `src/MIAX ML - 09 Agglomerative Clustering.ipynb` | Clustering aglomerativo | Clusters jerarquicos |
| `src/MIAX ML - 09_05 Workshop Part 2 of 2.ipynb` | Reduccion y no supervisado | Ejercicio integrado |
| `src/MIAX ML - Practica Completa.ipynb` | Analisis, limpieza, factores, clustering | Plantilla de proyecto ML completo |
| `src/Practica profe.md` | Retornos, transformaciones y lectura metodologica | Buenas practicas para series |
| `README.md` y `requirements.txt` | Estructura y dependencias | Referencia de entorno Python |

### Maching Learning Raul Santos

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `apuntes_clase_1.md` | Problema ideal vs real y advertencias practicas | Criterios para IA realista |
| `apuntes_clase_2.md` | Taller, grafos y herramientas | Base de grafos operativos |
| `Ensembles.pdf` | Bagging, Random Forest, Boosting y Gradient Boosting | Modelos potentes pero explicables |
| `Intro_ML_2025.pdf` | Fundamentos ML | Base teorica |
| `lime_shap_demo.ipynb` | LIME y Kernel SHAP | Explicar predicciones a operadores |
| `Medidas_de_dependencia_2025.pdf` | Dependencia entre variables | Detectar relaciones no triviales |
| `MIAX_intro.pdf` | Otros aprendizajes y explicabilidad | Cultura XAI para el producto |
| `Modelos_de_Gafos_Probabilisticos_2025.pdf` | Redes bayesianas y grafos probabilisticos | Mapa de riesgos y dependencias |
| `MODELS_ENSEMBLES_bagging_regresion.ipynb` | Bagging regresion | Pricing y SLA |
| `MODELS_ENSEMBLES_basic_aggregating.ipynb` | Agregacion basica | Combinar senales |
| `MODELS_ENSEMBLES_rf_regresion.ipynb` | Random Forest regresion | Prediccion robusta |
| `practica/01_guia_principal_practica.md` | Guia del taller de grafos | Plantilla de experimento |
| `practica/03_guion_video.md` | Guion de explicacion | Comunicacion clara |
| `practica/05_lectura_codigo_linea_a_linea.md` | Lectura del DAG | Explicar grafos paso a paso |
| `practica/06_codigo_linea_por_linea.md` | Codigo explicado | Documentar pipelines |
| `practica/07_interpretacion_financiera_practica.md` | Interpretacion de factores | Traducir resultados a negocio |
| `practica/08_guia_video_sencilla.md` | Guia simple de video | Material de presentacion |
| `practica/09_explicacion_financiera_sencilla.md` | Explicacion simple de factores | Lenguaje claro para usuarios |
| `practica/10_explicacion_codigo_sencilla.md` | Explicacion simple de codigo | Onboarding tecnico |
| `practica/11_guion_video_completo.md` | Guion completo | Comunicacion estructurada |
| `practica/practica_b3_t3.ipynb` | Grafos causales con Fama-French | Plantilla de grafo aplicado |
| `practica/Taller_B3_T3.pdf` | Enunciado del taller | Requisitos de experimento |
| `practica/transcripcion_clase_taller.txt` | Transcripcion | Contexto y material RAG futuro |
| `practica/VALERO_pgmpy_Structure Learning_adut_proc_simple.ipynb` | Structure learning | Ejemplo tecnico |
| `practica/VALERO_pgmpy_Structure Learning_Bank.ipynb` | Structure learning bancario | Ejemplo tecnico |
| `transcripcion_clase.txt` | Clase de Raul | Material documental |
| `transcripcion_clase_2.txt` | Segunda clase | Material documental |
| `XAI_surrogates_sokol.pdf` | Transparencia y modelos surrogate | Base para IA explicable |

### practica_b3_t1

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `apuntes_practica_companero.md` | Resumen de tick, volume y dollar bars | Pensar en eventos, no solo calendario |
| `apuntes_practica_companero.pdf` | Version PDF del resumen | Referencia de lectura |
| `docs/README.md` | Flujo, estructura y decision metodologica | Buen ejemplo de README tecnico |
| `explicacion_practica.pdf` | Practica explicada | Plantilla de explicacion |
| `explicacion_practica_profesor.md` | Explicacion para profesor | Comunicacion de metodologia |
| `notebooks/practica_b3_t1.ipynb` | Notebook completo de preprocesado | Pipeline de series y features |
| `notebooks/scripts/download_binance_data.py` | Descarga reproducible | Patron para conectores externos |
| `notebooks/scripts/generate_practica_notebook.py` | Generacion de notebook | Automatizacion documental |
| `notebooks/scripts/practica_b3_t1_utils.py` | Utilidades de barras y procesamiento | Transformaciones por eventos |
| `notebooks/scripts/prepare_practica_data.py` | Preparacion de datos | ETL reproducible |
| `ProcesadoDeDatosFinancieros.ipynb` | Barras, ruido, distribuciones y retornos | Series de actividad para booking/revenue |
| `Taller_B3_T1.pdf` | Enunciado del taller | Criterios de practica |

### Redes neuronales-RNN

| Documento | Contenido | Uso para WIAHost |
| --- | --- | --- |
| `apuntes_clase_1.md` | Dudas de grafos, causalidad temporal y arranque de redes | Contexto de secuencias y causalidad temporal |
| `apuntes_clase_2.md` | Pesos, aprendizaje y fundamentos de red | Base conceptual |
| `apuntes_clase_3.md` | Uso de IA, entrenamiento y conceptos centrales | Criterio para no delegar comprension a la IA |
| `apuntes_clase_4.md` | Taller, curvas y entrenamiento | Validacion y lectura de errores |
| `apuntes_clase_5.md` | Curvas, RNN, secuencias y cierre | Modelos secuenciales futuros |
| `transcripcion_clase_17_abril.txt` | Transcripcion clase 1 | Material RAG o contexto |
| `transcripcion_clase_18_abril.txt` | Transcripcion clase 2 | Material RAG o contexto |
| `transcripcion_clase_23_abril.txt` | Transcripcion clase 3 | Material RAG o contexto |
| `transcripcion_clase_24_abril.txt` | Transcripcion clase 4 | Material RAG o contexto |
| `transcripcion_clase_25_abril.txt` | Transcripcion clase 5 | Material RAG o contexto |

## Backlog de IA derivado de los apuntes

### Nivel 1: IA sin modelo complejo

- Registrar eventos operativos con timestamps.
- Guardar labels humanos de mensajes, tareas, incidencias y reservas.
- Crear baselines con reglas para prioridad, SLA y pricing.
- Crear memoria de auditoria visual y funcional.
- Guardar feedback de operadores sobre recomendaciones.

### Nivel 2: Modelos clasicos explicables

- Clasificador de urgencia de mensajes.
- Prediccion de riesgo de SLA roto.
- Deteccion de anomalias de precio, reserva o incidencia.
- Segmentacion de propiedades por comportamiento.
- Ranking de cola prioritaria con explicacion.

### Nivel 3: IA semantica y multimodal

- Embeddings de mensajes y documentos.
- Busqueda semantica en inbox y reservas.
- Resumen de conversaciones.
- Extraccion de datos de mensajes: hora llegada, problema, importe, canal, reserva.
- Analisis de fotos de incidencias.
- Transcripcion de notas de voz.

### Nivel 4: Modelos secuenciales

- Forecast de ocupacion por ventanas temporales.
- Pricing secuencial.
- Deteccion de patrones repetidos en incidencias.
- Clasificacion de conversaciones por secuencia completa.

### Nivel 5: Copiloto operativo

- Responder con borradores, no enviar automaticamente.
- Explicar por que una accion es prioritaria.
- Consultar historial, documentos y estado actual.
- Aprender de aprobaciones y correcciones humanas.

## Datos que debemos empezar a guardar

Para que la IA futura sea posible, WIAHost deberia preparar estas tablas o entidades:

- `events`: actor, entidad, accion, timestamp, metadata.
- `message_labels`: mensaje, categoria, urgencia, idioma, canal, label humano.
- `task_outcomes`: tarea, SLA esperado, SLA real, resolucion, responsable.
- `reservation_snapshots`: reserva, precio, canal, estado, lead time, ocupacion.
- `pricing_observations`: precio sugerido, precio aprobado, precio final, conversion.
- `incident_features`: tipo, severidad, coste, tiempo de resolucion, recurrencia.
- `model_predictions`: modelo, version, input hash, output, explicacion, feedback.
- `ai_audit_log`: prompt, decision, usuario, fecha, resultado y aprobacion humana.

## Guardrails

- No usar atributos protegidos.
- No tomar decisiones automaticas sensibles.
- No entrenar con datos futuros.
- No mezclar train/test en series temporales.
- No guardar secretos en prompts.
- No enviar mensajes automaticos sensibles sin aprobacion.
- No vender correlacion como causalidad.
- No usar IA en produccion sin baseline, metricas y rollback.

## Decision para producto

WIAHost debe construir IA en este orden:

1. Datos y eventos bien modelados.
2. Auditoria inteligente con memoria.
3. Baselines y reglas explicables.
4. Modelos clasicos con XAI.
5. Embeddings y copiloto asistido.
6. Modelos secuenciales o multimodales solo cuando haya historico suficiente.

La ventaja competitiva no sera decir "tenemos IA". La ventaja sera que WIAHost entiende la operacion, explica cada recomendacion y ayuda al equipo a tomar mejores decisiones sin quitarle el control.

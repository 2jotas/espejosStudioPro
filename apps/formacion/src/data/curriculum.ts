export interface Apunte {
  archivo: string;
  titulo: string;
  tags: string[];
  dificultad: 'Básica' | 'Media' | 'Media-Alta' | 'Avanzada' | 'Experta';
  contenido: string;
}

export interface Modulo {
  id: string;
  nombre: string;
  semestre: number;
  creditos: number;
  temas: string[];
  apuntes: Apunte[];
}

export interface AnoCurricular {
  ano: number;
  nombre: string;
  descripcion: string;
  modulos: Modulo[];
}

export const CURRICULUM_DATA: AnoCurricular[] = [
  {
    ano: 1,
    nombre: "Año 1: Fundamentos Matemáticos y Computacionales",
    descripcion: "Bases sólidas en programación, cálculo vectorial, álgebra lineal, probabilidad y bases de datos relacionales.",
    modulos: [
      {
        id: "01_introduccion_python_datos",
        nombre: "Introducción a Python y Estructuras de Datos",
        semestre: 1,
        creditos: 6,
        temas: ["Sintaxis", "Control de Flujo", "Listas y Diccionarios", "Funciones", "POO"],
        apuntes: [
          {
            archivo: "01_fundamentos_python.md",
            titulo: "Fundamentos de Python para Ciencia de Datos",
            tags: ["python", "fundamentos", "estructuras"],
            dificultad: "Básica",
            contenido: `# 🐍 Fundamentos de Python para Ciencia de Datos

Python es el lenguaje por excelencia para el procesamiento, análisis y modelado de datos debido a su sintaxis clara y su ecosistema maduro (\`NumPy\`, \`Pandas\`, \`Scikit-Learn\`).

## 1. Tipos de Datos Nativos y Complejidad Temporal

| Estructura | Acceso Indexado | Búsqueda por Valor | Inserción/Borrado | Mutabilidad |
|---|---|---|---|---|
| **List (\`list\`)** | $O(1)$ | $O(n)$ | $O(1)$ al final / $O(n)$ en medio | Mutable |
| **Tuple (\`tuple\`)** | $O(1)$ | $O(n)$ | Inmutable | Inmutable |
| **Dictionary (\`dict\`)** | $O(1)$ promedio | $O(1)$ por clave | $O(1)$ promedio | Mutable |
| **Set (\`set\`)** | N/A | $O(1)$ por valor | $O(1)$ promedio | Mutable |

## 2. List Comprehensions y Generadores

Las comprensiones de listas permiten transformar colecciones de manera idiomática y vectorizada a nivel de bytecode:

\`\`\`python
# Filtrado y transformación de datos en una sola línea
numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
cuadrados_pares = [x**2 for x in numeros if x % 2 == 0]
print(f"Cuadrados pares: {cuadrados_pares}")
# Salida: [4, 16, 36, 64, 100]
\`\`\`

## 3. Manejo Funcional: \`map\`, \`filter\` y \`lambda\`

\`\`\`python
datos = [12.5, 18.2, 23.8, 9.4, 31.0]
# Normalización Min-Max simple
min_v, max_v = min(datos), max(datos)
normalizados = list(map(lambda x: (x - min_v) / (max_v - min_v), datos))
print("Datos normalizados [0, 1]:", [round(v, 2) for v in normalizados])
\`\`\`
`
          }
        ]
      },
      {
        id: "02_algebra_lineal_calculo",
        nombre: "Álgebra Lineal y Cálculo Vectorial",
        semestre: 1,
        creditos: 8,
        temas: ["Vectores", "Matrices", "Autovalores", "Derivadas Parciales", "Gradiente"],
        apuntes: [
          {
            archivo: "01_matrices_transformaciones.md",
            titulo: "Álgebra Lineal: Matrices, Autovalores y Descomposición SVD",
            tags: ["algebra", "matrices", "svd", "autovectores"],
            dificultad: "Media",
            contenido: `# 📐 Álgebra Lineal: El Lenguaje del Machine Learning

El Álgebra Lineal proporciona las herramientas matemáticas para representar y transformar conjuntos multidimensionales de datos.

## 1. Multiplicación de Matrices y Espacios Vectoriales

Dadas dos matrices $A \\in \\mathbb{R}^{m \\times k}$ y $B \\in \\mathbb{R}^{k \\times n}$, el producto $C = AB \\in \\mathbb{R}^{m \\times n}$ se define elemento a elemento como:

$$C_{ij} = \\sum_{p=1}^{k} A_{ip} B_{pj}$$

## 2. Autovalores y Autovectores (Eigenvalues & Eigenvectors)

Para una matriz cuadrada $A$, un vector no nulo $v$ es un autovector con autovalor $\\lambda$ si satisface:

$$A v = \\lambda v \\iff (A - \\lambda I)v = 0$$

Esto es la base matemática fundamental del **Análisis de Componentes Principales (PCA)** para reducción de dimensionalidad.

## 3. Implementación en Python con NumPy

\`\`\`python
import numpy as np

# Definición de matriz simétrica de covarianza
A = np.array([[4, 2], [2, 3]])

# Cálculo de autovalores y autovectores
autovalores, autovectores = np.linalg.eig(A)

print("Autovalores:\\n", autovalores)
print("Autovectores:\\n", autovectores)
\`\`\`
`
          }
        ]
      },
      {
        id: "03_estadistica_descriptiva_probabilidad",
        nombre: "Estadística Descriptiva y Teoría de Probabilidad",
        semestre: 2,
        creditos: 8,
        temas: ["Medidas de Tendencia", "Varianza", "Teorema de Bayes", "Distribuciones", "TCL"],
        apuntes: [
          {
            archivo: "01_probabilidad_bayes.md",
            titulo: "Teoría de Probabilidad y Teorema de Bayes",
            tags: ["estadistica", "probabilidad", "bayes", "distribuciones"],
            dificultad: "Media",
            contenido: `# 📊 Teoría de Probabilidad y Teorema de Bayes

La probabilidad modela la incertidumbre y es la base de los clasificadores bayesianos, las redes neuronales probabilísticas y la inferencia estadística.

## 1. El Teorema de Bayes

El Teorema de Bayes describe la probabilidad de un evento basado en el conocimiento previo de condiciones relacionadas:

$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

Donde:
- $P(A|B)$ es la probabilidad a posteriori (*Posterior*).
- $P(B|A)$ es la verosimilitud (*Likelihood*).
- $P(A)$ es la probabilidad a priori (*Prior*).
- $P(B)$ es la evidencia marginal (*Evidence*).

## 2. Distribución Normal (Gaussiana)

La función de densidad de probabilidad (PDF) de una variable aleatoria normal con media $\\mu$ y desviación estándar $\\sigma$:

$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left( -\\frac{1}{2} \\left(\\frac{x - \\mu}{\\sigma}\\right)^2 \\right)$$

## 3. Simulación en Python (SciPy & NumPy)

\`\`\`python
import numpy as np
from scipy import stats

mu, sigma = 0, 1
muestras = np.random.normal(mu, sigma, 1000)

print(f"Media Muestral: {np.mean(muestras):.4f}")
print(f"Desviación Estándar Muestral: {np.std(muestras):.4f}")
\`\`\`
`
          }
        ]
      },
      {
        id: "04_bases_datos_sql_relacional",
        nombre: "Bases de Datos Relacionales y SQL Avanzado",
        semestre: 2,
        creditos: 6,
        temas: ["Modelado E/R", "DDL/DML", "JOINs", "Window Functions", "Indexación", "CTEs"],
        apuntes: [
          {
            archivo: "01_sql_avanzado_window_functions.md",
            titulo: "SQL Avanzado: Window Functions, CTEs y Optimización de Consultas",
            tags: ["sql", "databases", "window_functions", "cte", "postgres"],
            dificultad: "Media-Alta",
            contenido: `# 🗄️ SQL Avanzado para Análisis de Datos

SQL es la herramienta esencial para extraer, transformar y agregar datos estructurados a escala.

## 1. Common Table Expressions (CTEs) y Modularidad

\`\`\`sql
WITH ventas_mensuales AS (
    SELECT 
        DATE_TRUNC('month', fecha_venta) AS mes,
        cliente_id,
        SUM(monto) AS total_mes
    FROM transacciones
    WHERE estado = 'completada'
    GROUP BY 1, 2
)
SELECT 
    mes,
    AVG(total_mes) AS ticket_promedio_mensual,
    COUNT(DISTINCT cliente_id) AS clientes_activos
FROM ventas_mensuales
GROUP BY mes
ORDER BY mes DESC;
\`\`\`

## 2. Window Functions (Funciones de Ventana)

\`\`\`sql
SELECT 
    cliente_id,
    fecha_cita,
    monto,
    AVG(monto) OVER(PARTITION BY cliente_id) AS gasto_promedio_cliente,
    ROW_NUMBER() OVER(PARTITION BY cliente_id ORDER BY fecha_cita DESC) AS numero_visita_reciente
FROM citas_barberia;
\`\`\`
`
          }
        ]
      }
    ]
  },
  {
    ano: 2,
    nombre: "Año 2: Análisis Exploratorio, Inferencia y Machine Learning Clásico",
    descripcion: "Pandas, visualización, pruebas de hipótesis estadísticas, bases NoSQL y modelos predictivos supervisados.",
    modulos: [
      {
        id: "05_analisis_exploratorio_eda_pandas",
        nombre: "Análisis Exploratorio de Datos (EDA) con Pandas y Seaborn",
        semestre: 3,
        creditos: 6,
        temas: ["Pandas DataFrames", "Limpieza de Datos", "Imputación", "Outliers", "Visualización"],
        apuntes: [
          {
            archivo: "01_eda_pipeline_pandas.md",
            titulo: "Pipeline Profesional de EDA y Detección de Anomalías",
            tags: ["pandas", "eda", "data_cleaning", "seaborn"],
            dificultad: "Media",
            contenido: `# 🔍 Pipeline Profesional de EDA (Exploratory Data Analysis)

El análisis exploratorio permite descubrir patrones, detectar anomalías, probar hipótesis y verificar suposiciones antes de entrenar modelos.

## 1. Detección de Outliers con Rango Intercuartílico (IQR)

$$IQR = Q_3 - Q_1$$
$$\\text{Límite Inferior} = Q_1 - 1.5 \\times IQR$$
$$\\text{Límite Superior} = Q_3 + 1.5 \\times IQR$$

## 2. Implementación con Pandas

\`\`\`python
import pandas as pd
import numpy as np

def limpiar_outliers_iqr(df: pd.DataFrame, columna: str) -> pd.DataFrame:
    Q1 = df[columna].quantile(0.25)
    Q3 = df[columna].quantile(0.75)
    IQR = Q3 - Q1
    lim_inf = Q1 - 1.5 * IQR
    lim_sup = Q3 + 1.5 * IQR
    return df[(df[columna] >= lim_inf) & (df[columna] <= lim_sup)]
\`\`\`
`
          }
        ]
      },
      {
        id: "06_inferencia_estadistica_regresion",
        nombre: "Inferencia Estadística y Modelos de Regresión",
        semestre: 3,
        creditos: 8,
        temas: ["Test de Hipótesis", "p-value", "ANOVA", "Regresión Lineal", "Regresión Logística"],
        apuntes: [
          {
            archivo: "01_regresion_lineal_inferencia.md",
            titulo: "Regresión Lineal Múltiple y Supuestos de Gauss-Márkov",
            tags: ["regresion", "inferencia", "p_value", "estadistica"],
            dificultad: "Media-Alta",
            contenido: `# 📈 Inferencia Estadística y Regresión Lineal

El modelo de regresión lineal modela la relación entre una variable dependiente $Y$ y un vector de regresores $X$:

$$Y = X\\beta + \\varepsilon$$

Estimador de Mínimos Cuadrados Ordinarios (OLS):

$$\\hat{\\beta} = (X^T X)^{-1} X^T Y$$
`
          }
        ]
      },
      {
        id: "07_bases_datos_nosql_data_warehouses",
        nombre: "Bases de Datos NoSQL y Almacenamiento Distribuido",
        semestre: 4,
        creditos: 6,
        temas: ["MongoDB", "Redis", "Elasticsearch", "Modelos Documentales", "Key-Value Stores"],
        apuntes: [
          {
            archivo: "01_nosql_mongodb_redis.md",
            titulo: "Arquitecturas NoSQL: MongoDB para Documentos y Redis para Caché de Alta Velocidad",
            tags: ["nosql", "mongodb", "redis", "caching"],
            dificultad: "Media",
            contenido: `# ⚡ Bases de Datos NoSQL

Diseñadas para manejar alta concurrencia, datos no estructurados o semiestructurados y operaciones en memoria en tiempo real.
`
          }
        ]
      },
      {
        id: "08_introduccion_machine_learning_scikit",
        nombre: "Machine Learning Supervisado con Scikit-Learn",
        semestre: 4,
        creditos: 8,
        temas: ["Árboles de Decisión", "Random Forest", "Cross-Validation", "Curvas ROC/AUC", "Overfitting"],
        apuntes: [
          {
            archivo: "01_pipeline_clasificacion_scikit.md",
            titulo: "Pipeline Completo de Clasificación y Validación Cruzada",
            tags: ["machine_learning", "scikit_learn", "random_forest", "cross_validation"],
            dificultad: "Media-Alta",
            contenido: `# 🤖 Machine Learning Supervisado con Scikit-Learn

\`\`\`python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=1000, n_features=20, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(clf, X, y, cv=5, scoring='accuracy')

print(f"Accuracy promedio (5-Fold CV): {scores.mean():.4f} (+/- {scores.std():.4f})")
\`\`\`
`
          }
        ]
      }
    ]
  },
  {
    ano: 3,
    nombre: "Año 3: Inteligencia Artificial, Deep Learning y Big Data",
    descripcion: "Redes neuronales, PyTorch, procesamiento de lenguaje natural (NLP) y pipelines de ingeniería de datos masivos.",
    modulos: [
      {
        id: "09_machine_learning_avanzado_clustering",
        nombre: "Machine Learning No Supervisado y Métodos de Ensamble",
        semestre: 5,
        creditos: 8,
        temas: ["K-Means", "DBSCAN", "PCA", "t-SNE", "XGBoost", "LightGBM"],
        apuntes: [
          {
            archivo: "01_xgboost_clustering.md",
            titulo: "Gradient Boosting (XGBoost) y Clustering con DBSCAN",
            tags: ["xgboost", "dbscan", "clustering", "pca"],
            dificultad: "Avanzada",
            contenido: `# 🚀 Métodos de Ensamble y Clustering Avanzado

El Gradient Boosting construye modelos predictivos de forma iterativa minimizando una función de pérdida diferenciable:

$$F_m(x) = F_{m-1}(x) + \\gamma_m h_m(x)$$
`
          }
        ]
      },
      {
        id: "10_deep_learning_redes_neuronales",
        nombre: "Deep Learning y Redes Neuronales con PyTorch",
        semestre: 5,
        creditos: 8,
        temas: ["Backpropagation", "Optimizadores (Adam, SGD)", "CNNs", "Transfer Learning", "PyTorch"],
        apuntes: [
          {
            archivo: "01_intro_pytorch_redes.md",
            titulo: "Arquitectura de Redes Neuronales con PyTorch y Autograd",
            tags: ["deep_learning", "pytorch", "neural_networks", "backpropagation"],
            dificultad: "Avanzada",
            contenido: `# 🧠 Deep Learning con PyTorch

\`\`\`python
import torch
import torch.nn as nn

class RedNeuronalSimple(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x):
        return self.net(x)

modelo = RedNeuronalSimple(input_dim=20, hidden_dim=64, num_classes=2)
print(modelo)
\`\`\`
`
          }
        ]
      },
      {
        id: "11_nlp_procesamiento_lenguaje_natural",
        nombre: "Procesamiento de Lenguaje Natural (NLP) y Transformers",
        semestre: 6,
        creditos: 8,
        temas: ["Tokenización", "Embeddings", "Mecanismo de Atención", "BERT", "Arquitectura Transformer"],
        apuntes: [
          {
            archivo: "01_transformers_atencion.md",
            titulo: "Mecanismo de Auto-Atención y Arquitectura Transformer",
            tags: ["nlp", "transformers", "attention", "embeddings"],
            dificultad: "Avanzada",
            contenido: `# 💬 Transformers y Mecanismo de Atención

Fórmula de Scaled Dot-Product Attention:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{QK^T}{\\sqrt{d_k}} \\right) V$$
`
          }
        ]
      },
      {
        id: "12_ingenieria_de_datos_etl_pipelines",
        nombre: "Ingeniería de Datos, Pipelines ETL y Streaming",
        semestre: 6,
        creditos: 6,
        temas: ["Apache Airflow", "Kafka", "Data Lakehouses", "Parquet", "DuckDB"],
        apuntes: [
          {
            archivo: "01_pipelines_airflow_duckdb.md",
            titulo: "Pipelines de Datos Modernos con DuckDB y Apache Airflow",
            tags: ["data_engineering", "etl", "duckdb", "airflow"],
            dificultad: "Avanzada",
            contenido: `# 🏗️ Pipelines ETL y Procesamiento de Datos Analíticos`
          }
        ]
      }
    ]
  },
  {
    ano: 4,
    nombre: "Año 4: Sistemas RAG, MLOps, Analítica Cuantitativa y Tesis",
    descripcion: "Sistemas RAG con bases vectoriales, MLOps en producción, modelos financieros y proyecto final de carrera.",
    modulos: [
      {
        id: "13_sistemas_rag_vector_databases",
        nombre: "Sistemas RAG (Retrieval-Augmented Generation) y Vector DBs",
        semestre: 7,
        creditos: 8,
        temas: ["ChromaDB", "Pinecone", "Chunking Strategies", "Re-Ranking", "LangChain/LlamaIndex"],
        apuntes: [
          {
            archivo: "01_arquitectura_rag_vector_db.md",
            titulo: "Arquitectura RAG Profesional: Chunking, Embeddings y Re-ranking",
            tags: ["rag", "vector_db", "chromadb", "embeddings", "llm"],
            dificultad: "Experta",
            contenido: `# 🤖 Sistemas RAG (Retrieval-Augmented Generation)

$$\\text{Cosine Similarity}(u, v) = \\frac{u \\cdot v}{\\|u\\| \\|v\\|} = \\frac{\\sum_{i=1}^n u_i v_i}{\\sqrt{\\sum_{i=1}^n u_i^2} \\sqrt{\\sum_{i=1}^n v_i^2}}$$
`
          }
        ]
      },
      {
        id: "14_mlops_despliegue_modelos_produccion",
        nombre: "MLOps: Despliegue, Monitoreo y CI/CD de Modelos",
        semestre: 7,
        creditos: 8,
        temas: ["FastAPI", "Dockerización", "Model Drift", "Prometheus/Grafana", "MLflow"],
        apuntes: [
          {
            archivo: "01_mlops_docker_fastapi.md",
            titulo: "Despliegue de Modelos de ML con FastAPI, Docker y Monitoreo",
            tags: ["mlops", "fastapi", "docker", "production"],
            dificultad: "Experta",
            contenido: `# 🚢 MLOps: Llevando Modelos a Producción`
          }
        ]
      },
      {
        id: "15_analitica_financiera_series_temporales",
        nombre: "Analítica Cuantitativa y Series Temporales",
        semestre: 8,
        creditos: 6,
        temas: ["ARIMA/SARIMA", "Prophet", "Gestión de Riesgo", "Backtesting Cuantitativo"],
        apuntes: [
          {
            archivo: "01_series_temporales_arima.md",
            titulo: "Modelado de Series Temporales: Estacionariedad y Modelos ARIMA",
            tags: ["time_series", "arima", "finanzas", "backtesting"],
            dificultad: "Experta",
            contenido: `# 📉 Series Temporales y Modelos Cuantitativos`
          }
        ]
      },
      {
        id: "16_proyecto_final_tesis_aplicada",
        nombre: "Proyecto Final de Grado y Tesis Aplicada",
        semestre: 8,
        creditos: 10,
        temas: ["Diseño de Arquitectura", "Pipeline End-to-End", "Evaluación de Negocio", "Defensa"],
        apuntes: [
          {
            archivo: "01_guia_tesis_proyecto.md",
            titulo: "Guía Metodológica del Proyecto Final de Grado en Ciencia de Datos",
            tags: ["tesis", "proyecto_final", "metodologia"],
            dificultad: "Experta",
            contenido: `# 🎓 Proyecto Final de Grado`
          }
        ]
      }
    ]
  }
];

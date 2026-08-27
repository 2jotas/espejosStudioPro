#!/usr/bin/env python3
"""
Vault Live Watcher & Dynamic Tree Generator
Monitors /home/deploy/proyectos/formacion-ciencia-datos and continuously updates tree.json
"""
import os
import time
import json
from pathlib import Path

VAULT_DIR = Path("/home/deploy/proyectos/formacion-ciencia-datos")
TREE_FILE = VAULT_DIR / "tree.json"

RAMO_TITLES = {
    "01_introduccion_al_analisis_de_datos": "Introducción al Análisis de Datos",
    "02_analisis_de_datos": "Análisis de Datos",
    "03_estadistica": "Estadística y Probabilidad",
    "04_etica_y_proteccion_de_datos": "Ética y Protección de Datos",
    "09_p1": "Fundamentos y Conceptos Básicos",
}

def scan_vault():
    anos_data = []

    # Escanear Año 1
    ano1_modulos = []
    ano1_dir = VAULT_DIR / "ano_1"

    if ano1_dir.exists():
        for ramo_dir in sorted(ano1_dir.iterdir()):
            if not ramo_dir.is_dir():
                continue

            ramo_name = RAMO_TITLES.get(ramo_dir.name, ramo_dir.name.replace("_", " ").title())
            apuntes = []

            # Escanear semanas (semana_1 a semana_7 o cualquier subcarpeta)
            for week_dir in sorted(ramo_dir.iterdir()):
                if not week_dir.is_dir():
                    continue

                week_label = week_dir.name.replace("_", " ").title()
                files_in_week = [f.name for f in sorted(week_dir.iterdir()) if f.is_file() and not f.name.startswith('.')]

                files_list_md = "\n".join([f"- 📄 `{f}`" for f in files_in_week]) if files_in_week else "- *Semana lista para agregar contenido desde el móvil o laptop.*"

                apunte_text = f"""# 📚 {ramo_name} · {week_label}

Bienvenido a los apuntes y material de estudio correspondiente a la **{week_label}**.

---

### 📂 Archivos y Guías de esta Semana:
{files_list_md}

---

### 💡 Resumen y Objetivos:
- Conceptos clave y material de lectura oficial de la universidad.
- Ejercicios prácticos, scripts en Python y recursos de apoyo.

*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*
"""
                apuntes.append({
                    "archivo": f"{week_dir.name}.md",
                    "titulo": f"{week_label}: {ramo_name}",
                    "tags": [ramo_dir.name.split("_")[-1], week_dir.name, "universidad"],
                    "dificultad": "Media",
                    "contenido": apunte_text
                })

            ano1_modulos.append({
                "id": ramo_dir.name,
                "nombre": ramo_name,
                "semestre": 1 if "introduccion" in ramo_dir.name or "analisis" in ramo_dir.name else 2,
                "creditos": 6,
                "temas": [f"Semana {w}" for w in range(1, len(apuntes) + 1)],
                "apuntes": apuntes
            })

    anos_data.append({
        "ano": 1,
        "nombre": "Año 1: Fundamentos y Ramos Cursados (Marzo 2026 a la fecha)",
        "descripcion": "Ramos con sus semanas estructuradas, guías oficiales, notas y ejercicios.",
        "modulos": ano1_modulos
    })

    # Años 2, 3, 4 (Roadmap proyectado)
    for ano_num, desc, mods in [
        (2, "Año 2: Análisis Exploratorio, Inferencia y Machine Learning Clásico", [
            ("05_eda_pandas", "Análisis Exploratorio con Pandas y Seaborn"),
            ("06_inferencia_regresion", "Inferencia Estadística y Modelos de Regresión"),
            ("07_nosql_warehouses", "Bases NoSQL y Data Warehouses"),
            ("08_machine_learning_scikit", "Machine Learning Supervisado")
        ]),
        (3, "Año 3: Inteligencia Artificial, Deep Learning y Big Data", [
            ("09_xgboost_clustering", "Métodos de Ensamble y Clustering"),
            ("10_pytorch_deep_learning", "Deep Learning con PyTorch"),
            ("11_nlp_transformers", "NLP y Transformers"),
            ("12_data_engineering", "Pipelines de Datos con Airflow")
        ]),
        (4, "Año 4: Sistemas RAG, MLOps, Analítica Cuantitativa y Tesis", [
            ("13_rag_vector_dbs", "Sistemas RAG y Bases Vectoriales"),
            ("14_mlops_production", "MLOps y Despliegue en Producción"),
            ("15_time_series_finance", "Series Temporales y Modelos Cuantitativos"),
            ("16_tesis_grado", "Proyecto Final de Grado")
        ])
    ]:
        modulos_list = []
        for mod_id, mod_name in mods:
            modulos_list.append({
                "id": mod_id,
                "nombre": mod_name,
                "semestre": (ano_num * 2) - 1,
                "creditos": 8,
                "temas": [f"Semana {w}" for w in range(1, 8)],
                "apuntes": [{
                    "archivo": "semana_1.md",
                    "titulo": f"Semana 1: {mod_name}",
                    "tags": [mod_id, "proyeccion", "carrera"],
                    "dificultad": "Avanzada" if ano_num >= 3 else "Media-Alta",
                    "contenido": f"# {mod_name}\n\nContenido proyectado para el Año {ano_num} de la carrera."
                }]
            })
        anos_data.append({
            "ano": ano_num,
            "nombre": desc,
            "descripcion": f"Módulos correspondientes al Año {ano_num}.",
            "modulos": modulos_list
        })

    # Guardar a tree.json
    temp_file = VAULT_DIR / "tree.json.tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(anos_data, f, indent=2, ensure_ascii=False)
    temp_file.replace(TREE_FILE)
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] tree.json actualizado exitosamente ({len(anos_data)} años procesados)")

def run_loop():
    print("Iniciando escáner continuo de Vault en", VAULT_DIR)
    scan_vault()
    last_mtime = 0

    while True:
        try:
            time.sleep(3)
            # Verificar si hubo algún cambio en la estructura de carpetas
            current_mtime = max(
                (p.stat().st_mtime for p in VAULT_DIR.rglob("*") if p.is_file() and p.name != "tree.json" and p.name != "tree.json.tmp"),
                default=0
            )
            if current_mtime > last_mtime:
                last_mtime = current_mtime
                scan_vault()
        except Exception as e:
            print("Error en escaneo:", e)
            time.sleep(5)

if __name__ == "__main__":
    run_loop()

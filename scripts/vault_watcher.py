#!/usr/bin/env python3
"""
Vault Live Watcher & Dynamic Tree Generator
Monitors /home/deploy/proyectos/formacion-ciencia-datos and continuously updates tree.json
"""
import os
import time
import json
import re
from pathlib import Path

VAULT_DIR = Path("/home/deploy/proyectos/formacion-ciencia-datos")
TREE_FILE = VAULT_DIR / "tree.json"

RAMO_MAP = {
    "introduccion-analisis-de-datos": ("01_introduccion_al_analisis_de_datos", "Introducción al Análisis de Datos"),
    "analisis de datos": ("02_analisis_de_datos", "Análisis de Datos"),
    "estadistica": ("03_estadistica", "Estadística y Probabilidad"),
    "etica-y-proteccion-de-datos": ("04_etica_y_proteccion_de_datos", "Ética y Protección de Datos"),
    "p1": ("09_p1", "Fundamentos y Conceptos Básicos"),
}

def parse_week_num(folder_name: str) -> int:
    clean = folder_name.lower().replace(" ", "").replace("_", "").replace("-", "")
    match = re.search(r'\d+', clean)
    if match:
        return int(match.group(0))
    return 1

def scan_vault():
    anos_data = []

    # 1. Detectar Ramos en year1 o ano_1
    ramo_data_map = {}

    search_dirs = [VAULT_DIR / "year1", VAULT_DIR / "ano_1"]
    for base_dir in search_dirs:
        if not base_dir.exists():
            continue
        for folder in base_dir.iterdir():
            if not folder.is_dir():
                continue

            folder_key = folder.name.lower().replace("_", " ").strip()
            # Encontrar el ramo correspondiente
            target_id = folder.name.lower().replace(" ", "_")
            target_name = folder.name.title()

            for k, (rid, rname) in RAMO_MAP.items():
                if k in folder_key or rid in folder_key:
                    target_id = rid
                    target_name = rname
                    break

            if target_id not in ramo_data_map:
                ramo_data_map[target_id] = {
                    "id": target_id,
                    "nombre": target_name,
                    "semestre": 1 if "introduccion" in target_id or "02_" in target_id else 2,
                    "creditos": 6,
                    "weeks": {w: [] for w in range(1, 8)}
                }

            # Escanear subcarpetas (semanas)
            for sub in folder.iterdir():
                if sub.is_dir() and not sub.name.startswith('.'):
                    wnum = parse_week_num(sub.name)
                    if wnum < 1: wnum = 1
                    if wnum > 7: wnum = 7
                    
                    files = []
                    for f in sorted(sub.iterdir()):
                        if f.is_file() and not f.name.startswith('.') and not f.name.endswith('.tmp'):
                            rel_path = f.relative_to(VAULT_DIR).as_posix()
                            files.append({
                                "name": f.name,
                                "path": rel_path
                            })
                    ramo_data_map[target_id]["weeks"][wnum].extend(files)
                elif sub.is_file() and not sub.name.startswith('.') and not sub.name.endswith('.tmp'):
                    rel_path = sub.relative_to(VAULT_DIR).as_posix()
                    ramo_data_map[target_id]["weeks"][1].append({
                        "name": sub.name,
                        "path": rel_path
                    })

    # Construir módulos para Año 1
    ano1_modulos = []
    for rid, rinfo in sorted(ramo_data_map.items()):
        apuntes = []
        for wnum in range(1, 8):
            files = rinfo["weeks"][wnum]
            # Eliminar duplicados si los hay
            seen = set()
            unique_files = []
            for f in files:
                if f["name"] not in seen:
                    seen.add(f["name"])
                    unique_files.append(f)

            files_list_md = "\n".join([f"- 📄 `{f['name']}`" for f in unique_files]) if unique_files else "- *Semana lista para agregar contenido desde el móvil o laptop.*"
            
            apunte_text = f"""# 📚 {rinfo['nombre']} · Semana {wnum}

Bienvenido al material de estudio correspondiente a la **Semana {wnum}**.

---

### 📂 Archivos y Guías de esta Semana:
{files_list_md}

---

### 💡 Resumen y Recursos:
- Consulta tus guías oficiales en PDF, diapositivas y ejercicios.
- Ejecuta código de prueba en el Playground interactivo.
"""
            apuntes.append({
                "archivo": f"semana_{wnum}.md",
                "titulo": f"Semana {wnum}: {rinfo['nombre']}",
                "tags": [rinfo['id'].split('_')[-1], f"semana_{wnum}", "universidad"],
                "dificultad": "Media",
                "contenido": apunte_text,
                "archivos": unique_files
            })

        ano1_modulos.append({
            "id": rinfo["id"],
            "nombre": rinfo["nombre"],
            "semestre": rinfo["semestre"],
            "creditos": rinfo["creditos"],
            "temas": [f"Semana {w}" for w in range(1, 8)],
            "apuntes": apuntes
        })

    anos_data.append({
        "ano": 1,
        "nombre": "Año 1: Fundamentos y Ramos Cursados (Marzo 2026 a la fecha)",
        "descripcion": "Ramos con sus 7 semanas estructuradas, guías oficiales, notas y ejercicios.",
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
                    "contenido": f"# {mod_name}\n\nContenido proyectado para el Año {ano_num} de la carrera.",
                    "archivos": []
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
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] tree.json actualizado exitosamente ({len(ano1_modulos)} ramos en Año 1)")

def run_loop():
    print("Iniciando escáner continuo de Vault en", VAULT_DIR)
    scan_vault()
    last_mtime = 0

    while True:
        try:
            time.sleep(3)
            current_mtime = max(
                (p.stat().st_mtime for p in VAULT_DIR.rglob("*") if p.is_file() and p.name != "tree.json" and not p.name.endswith(".tmp")),
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
